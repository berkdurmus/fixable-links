import { LLMProvider, LLMProviderConfig } from './base';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';

export type ProviderType = 'openai' | 'anthropic';

/**
 * Create an LLM provider instance
 */
export function createProvider(
  type: ProviderType,
  config: LLMProviderConfig
): LLMProvider {
  switch (type) {
    case 'openai':
      return new OpenAIProvider(config);
    case 'anthropic':
      return new AnthropicProvider(config);
    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
}

/**
 * Auto-detect provider from environment variables
 */
export function createProviderFromEnv(): LLMProvider {
  const provider = process.env.LLM_PROVIDER as ProviderType || 'openai';
  
  let apiKey: string | undefined;
  let model: string | undefined;
  
  if (provider === 'openai') {
    apiKey = process.env.OPENAI_API_KEY;
    model = process.env.AI_COMMENTS_MODEL || 'gpt-4o';
  } else if (provider === 'anthropic') {
    apiKey = process.env.ANTHROPIC_API_KEY;
    model = process.env.AI_COMMENTS_MODEL || 'claude-sonnet-4-20250514';
  }
  
  if (!apiKey) {
    throw new Error(
      `API key not found for provider "${provider}". ` +
      `Please set ${provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY'} environment variable.`
    );
  }
  
  return createProvider(provider, { apiKey, model });
}

export { LLMProvider } from './base';
export type { LLMProviderConfig } from './base';
export { OpenAIProvider } from './openai';
export { AnthropicProvider } from './anthropic';
