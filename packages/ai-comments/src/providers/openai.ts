import OpenAI from 'openai';
import {
  LLMProvider,
  LLMProviderConfig,
  LLMRequestOptions,
  LLMResponse,
  LLMStreamChunk,
} from './base';

/**
 * OpenAI provider implementation
 */
export class OpenAIProvider extends LLMProvider {
  private client: OpenAI;
  
  constructor(config: LLMProviderConfig) {
    super(config);
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      timeout: config.timeout || 60000,
      maxRetries: config.maxRetries || 3,
    });
  }
  
  get name(): 'openai' {
    return 'openai';
  }
  
  get defaultModel(): string {
    return 'gpt-4o';
  }
  
  async complete(options: LLMRequestOptions): Promise<LLMResponse> {
    const response = await this.client.chat.completions.create({
      model: this.getModel(),
      messages: options.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature ?? 0.3,
      response_format: options.jsonMode ? { type: 'json_object' } : undefined,
      stop: options.stop,
    });
    
    const choice = response.choices[0];
    
    return {
      content: choice.message.content || '',
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
      model: response.model,
      finishReason: this.mapFinishReason(choice.finish_reason),
      raw: response,
    };
  }
  
  async *completeStream(
    options: LLMRequestOptions
  ): AsyncGenerator<LLMStreamChunk, void, unknown> {
    const stream = await this.client.chat.completions.create({
      model: this.getModel(),
      messages: options.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature ?? 0.3,
      response_format: options.jsonMode ? { type: 'json_object' } : undefined,
      stop: options.stop,
      stream: true,
      stream_options: { include_usage: true },
    });
    
    let usage: LLMStreamChunk['usage'] | undefined;
    
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      const content = delta?.content || '';
      const done = chunk.choices[0]?.finish_reason !== null;
      
      if (chunk.usage) {
        usage = {
          promptTokens: chunk.usage.prompt_tokens,
          completionTokens: chunk.usage.completion_tokens,
          totalTokens: chunk.usage.total_tokens,
        };
      }
      
      yield {
        content,
        done,
        usage: done ? usage : undefined,
      };
    }
  }
  
  private mapFinishReason(
    reason: string | null
  ): LLMResponse['finishReason'] {
    switch (reason) {
      case 'stop':
        return 'stop';
      case 'length':
        return 'length';
      case 'content_filter':
        return 'content_filter';
      default:
        return 'stop';
    }
  }
}
