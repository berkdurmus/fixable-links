/**
 * Base interface for LLM providers
 */

export interface LLMProviderConfig {
  /** API key for the provider */
  apiKey: string;
  
  /** Model to use (e.g., 'gpt-4o', 'claude-sonnet-4-20250514') */
  model?: string;
  
  /** Base URL for API (for custom endpoints) */
  baseUrl?: string;
  
  /** Request timeout in milliseconds */
  timeout?: number;
  
  /** Maximum retries on failure */
  maxRetries?: number;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequestOptions {
  /** Messages to send */
  messages: LLMMessage[];
  
  /** Maximum tokens in response */
  maxTokens?: number;
  
  /** Temperature (0-1) */
  temperature?: number;
  
  /** JSON mode - request structured JSON output */
  jsonMode?: boolean;
  
  /** Stop sequences */
  stop?: string[];
}

export interface LLMResponse {
  /** The generated content */
  content: string;
  
  /** Number of tokens in prompt */
  promptTokens: number;
  
  /** Number of tokens in response */
  completionTokens: number;
  
  /** Total tokens used */
  totalTokens: number;
  
  /** Model used */
  model: string;
  
  /** Finish reason */
  finishReason: 'stop' | 'length' | 'content_filter' | 'error';
  
  /** Raw response for debugging */
  raw?: unknown;
}

export interface LLMStreamChunk {
  /** Incremental content */
  content: string;
  
  /** Whether this is the final chunk */
  done: boolean;
  
  /** Usage info (only on final chunk) */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Abstract base class for LLM providers
 */
export abstract class LLMProvider {
  protected config: LLMProviderConfig;
  
  constructor(config: LLMProviderConfig) {
    this.config = config;
  }
  
  /** Provider name */
  abstract get name(): 'openai' | 'anthropic';
  
  /** Default model for this provider */
  abstract get defaultModel(): string;
  
  /**
   * Generate a completion
   */
  abstract complete(options: LLMRequestOptions): Promise<LLMResponse>;
  
  /**
   * Generate a streaming completion
   */
  abstract completeStream(
    options: LLMRequestOptions
  ): AsyncGenerator<LLMStreamChunk, void, unknown>;
  
  /**
   * Check if the provider is properly configured
   */
  isConfigured(): boolean {
    return !!this.config.apiKey;
  }
  
  /**
   * Get the model to use
   */
  protected getModel(): string {
    return this.config.model || this.defaultModel;
  }
}
