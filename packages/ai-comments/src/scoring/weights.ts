/**
 * Scoring weight configuration
 */
export interface ScoringWeights {
  /** Weight for code consistency score */
  codeConsistency: number;
  
  /** Weight for reuse score */
  reuseScore: number;
  
  /** Weight for AI detection risk (inverted in calculation) */
  aiDetectionRisk: number;
  
  /** Weight for cascade risk (inverted in calculation) */
  cascadeRisk: number;
  
  /** Weight for responsive design score */
  responsiveScore: number;
  
  /** Weight for semantic HTML score */
  semanticScore: number;
  
  /** Weight for intent alignment score */
  intentAlignment: number;
}

/**
 * Default scoring weights
 */
export const DEFAULT_WEIGHTS: ScoringWeights = {
  codeConsistency: 1.0,
  reuseScore: 0.8,
  aiDetectionRisk: 0.6,
  cascadeRisk: 1.2,
  responsiveScore: 1.0,
  semanticScore: 0.9,
  intentAlignment: 1.1,
};

/**
 * Risk-based weights for inverted scores
 * These are subtracted from 100 before weighting
 */
export const INVERTED_METRICS: (keyof ScoringWeights)[] = [
  'aiDetectionRisk',
  'cascadeRisk',
];

/**
 * Merge custom weights with defaults
 */
export function mergeWeights(custom?: Partial<ScoringWeights>): ScoringWeights {
  if (!custom) return { ...DEFAULT_WEIGHTS };
  
  return {
    ...DEFAULT_WEIGHTS,
    ...custom,
  };
}

/**
 * Normalize weights to sum to 1
 */
export function normalizeWeights(weights: ScoringWeights): ScoringWeights {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  
  if (sum === 0) return weights;
  
  return {
    codeConsistency: weights.codeConsistency / sum,
    reuseScore: weights.reuseScore / sum,
    aiDetectionRisk: weights.aiDetectionRisk / sum,
    cascadeRisk: weights.cascadeRisk / sum,
    responsiveScore: weights.responsiveScore / sum,
    semanticScore: weights.semanticScore / sum,
    intentAlignment: weights.intentAlignment / sum,
  };
}
