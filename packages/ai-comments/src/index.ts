/**
 * @plsfix/ai-comments
 * 
 * AI-powered code review comments for DOM changes.
 * Analyzes risks, style consistency, and provides PR scoring.
 */

// Main analyzer
export { ChangeAnalyzer } from './analyzer/ChangeAnalyzer';
export type { AnalyzerConfig, AnalysisResult, AnalysisContext } from './analyzer/types';

// LLM Providers
export { createProvider } from './providers';
export { OpenAIProvider } from './providers/openai';
export { AnthropicProvider } from './providers/anthropic';
export type { LLMProvider, LLMProviderConfig, LLMResponse } from './providers/base';

// Prompt Management
export { PromptManager } from './prompts/PromptManager';

// Schemas and Types
export {
  AnalysisResultSchema,
  ComponentImpactSchema,
  RiskSchema,
  SuggestionSchema,
  StyleReviewSchema,
  PRScoreSchema,
} from './prompts/schemas';

export type {
  ComponentImpact,
  Risk,
  Suggestion,
  StyleReview,
  PRScore,
  PRScoreBreakdown,
  Flag,
} from './prompts/schemas';

// Scoring Engine
export { ScoringEngine } from './scoring/ScoringEngine';
export { DEFAULT_WEIGHTS } from './scoring/weights';
export type { ScoringWeights } from './scoring/weights';

// Utilities
export { calculateConfidence } from './utils/confidence';
export type { ConfidenceFactors } from './utils/confidence';
