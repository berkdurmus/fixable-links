import Anthropic from '@anthropic-ai/sdk';
import {
  LLMProvider,
  LLMProviderConfig,
  LLMRequestOptions,
  LLMResponse,
  LLMStreamChunk,
} from './base';

/**
 * Anthropic (Claude) provider implementation
 */
export class AnthropicProvider extends LLMProvider {
  private client: Anthropic;
  
  constructor(config: LLMProviderConfig) {
    super(config);
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      timeout: config.timeout || 60000,
      maxRetries: config.maxRetries || 3,
    });
  }
  
  get name(): 'anthropic' {
    return 'anthropic';
  }
  
  get defaultModel(): string {
    return 'claude-sonnet-4-20250514';
  }
  
  async complete(options: LLMRequestOptions): Promise<LLMResponse> {
    // Extract system message if present
    const systemMessage = options.messages.find(m => m.role === 'system');
    const otherMessages = options.messages.filter(m => m.role !== 'system');
    
    const response = await this.client.messages.create({
      model: this.getModel(),
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature ?? 0.3,
      system: systemMessage?.content,
      messages: otherMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      stop_sequences: options.stop,
    });
    
    const textContent = response.content.find(c => c.type === 'text');
    
    return {
      content: textContent?.type === 'text' ? textContent.text : '',
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      model: response.model,
      finishReason: this.mapFinishReason(response.stop_reason),
      raw: response,
    };
  }
  
  async *completeStream(
    options: LLMRequestOptions
  ): AsyncGenerator<LLMStreamChunk, void, unknown> {
    // Extract system message if present
    const systemMessage = options.messages.find(m => m.role === 'system');
    const otherMessages = options.messages.filter(m => m.role !== 'system');
    
    const stream = this.client.messages.stream({
      model: this.getModel(),
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature ?? 0.3,
      system: systemMessage?.content,
      messages: otherMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      stop_sequences: options.stop,
    });
    
    let inputTokens = 0;
    let outputTokens = 0;
    
    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        const delta = event.delta;
        if (delta.type === 'text_delta') {
          yield {
            content: delta.text,
            done: false,
          };
        }
      } else if (event.type === 'message_delta') {
        if (event.usage) {
          outputTokens = event.usage.output_tokens;
        }
      } else if (event.type === 'message_start') {
        if (event.message.usage) {
          inputTokens = event.message.usage.input_tokens;
        }
      } else if (event.type === 'message_stop') {
        yield {
          content: '',
          done: true,
          usage: {
            promptTokens: inputTokens,
            completionTokens: outputTokens,
            totalTokens: inputTokens + outputTokens,
          },
        };
      }
    }
  }
  
  private mapFinishReason(
    reason: string | null
  ): LLMResponse['finishReason'] {
    switch (reason) {
      case 'end_turn':
      case 'stop_sequence':
        return 'stop';
      case 'max_tokens':
        return 'length';
      default:
        return 'stop';
    }
  }
}
