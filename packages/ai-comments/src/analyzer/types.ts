import type { LLMProvider } from '../providers/base';
import type { ScoringWeights } from '../scoring/weights';
import type {
  ComponentImpact,
  Risk,
  Suggestion,
  StyleReview,
  PRScore,
} from '../prompts/schemas';

/**
 * Configuration for the ChangeAnalyzer
 */
export interface AnalyzerConfig {
  /** LLM provider instance */
  provider: LLMProvider;
  
  /** Optional custom prompts directory path */
  promptsDir?: string;
  
  /** Scoring configuration */
  scoring?: {
    /** Override default scoring weights */
    weights?: Partial<ScoringWeights>;
  };
  
  /** Maximum tokens for LLM response */
  maxTokens?: number;
  
  /** Temperature for LLM (0-1) */
  temperature?: number;
}

/**
 * Context about the page and surrounding elements
 */
export interface AnalysisContext {
  /** URL of the page being edited */
  pageUrl: string;
  
  /** HTML of surrounding elements for context */
  surroundingHTML?: string;
  
  /** Detected design system/framework (e.g., 'tailwind', 'bootstrap') */
  designSystem?: string;
  
  /** Existing CSS classes on the page */
  existingClasses?: string[];
  
  /** Viewport width for responsive analysis */
  viewportWidth?: number;
}

/**
 * A single DOM change to analyze
 */
export interface ChangeInput {
  /** Unique identifier for this change */
  id: string;
  
  /** Type of change */
  type: 'text' | 'style';
  
  /** HTML tag of the element */
  elementTag: string;
  
  /** XPath to the element */
  xpath: string;
  
  /** CSS selector for the element */
  selector: string;
  
  /** Original state before change */
  original: {
    textContent?: string;
    styles?: Record<string, string>;
  };
  
  /** Modified state after change */
  modified: {
    textContent?: string;
    styles?: Record<string, string>;
  };
}

/**
 * Complete analysis result for a change
 */
export interface AnalysisResult {
  /** Unique ID for this analysis */
  id: string;
  
  /** ID of the change that was analyzed */
  changeId: string;
  
  /** Timestamp of analysis */
  timestamp: number;
  
  /** Components affected by this change */
  affectedComponents: ComponentImpact[];
  
  /** Identified risks */
  risks: Risk[];
  
  /** Improvement suggestions */
  suggestions: Suggestion[];
  
  /** Style consistency review */
  styleConsistency: StyleReview;
  
  /** Overall PR score with breakdown */
  prScore: PRScore;
  
  /** Overall confidence in the analysis (0-1) */
  confidence: number;
  
  /** Which LLM provider was used */
  provider: 'openai' | 'anthropic';
  
  /** Number of tokens used */
  tokensUsed: number;
  
  /** Raw LLM response for debugging */
  rawResponse?: string;
}

/**
 * Streaming analysis event
 */
export interface AnalysisStreamEvent {
  type: 'start' | 'progress' | 'result' | 'error' | 'complete';
  changeId?: string;
  progress?: number;
  result?: AnalysisResult;
  error?: string;
  totalChanges?: number;
  completedChanges?: number;
}

/**
 * Batch analysis options
 */
export interface BatchAnalysisOptions {
  /** Whether to run analyses in parallel */
  parallel?: boolean;
  
  /** Maximum concurrent analyses if parallel */
  concurrency?: number;
  
  /** Callback for progress updates */
  onProgress?: (event: AnalysisStreamEvent) => void;
}
