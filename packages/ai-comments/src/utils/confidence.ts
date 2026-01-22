/**
 * Factors that influence confidence scoring
 */
export interface ConfidenceFactors {
  /** How much surrounding context is available (0-1) */
  contextAvailable: number;
  
  /** Complexity of the change (0-1, lower = simpler = more confident) */
  changeComplexity: number;
  
  /** LLM's self-reported confidence (0-1) */
  llmConfidence: number;
  
  /** Schema validation success (0-1) */
  schemaValidation: number;
  
  /** Token usage relative to max (0-1, lower = more confident) */
  tokenUsageRatio?: number;
}

/**
 * Weights for confidence factors
 */
const CONFIDENCE_WEIGHTS = {
  contextAvailable: 0.2,
  changeComplexity: 0.15,
  llmConfidence: 0.35,
  schemaValidation: 0.25,
  tokenUsageRatio: 0.05,
};

/**
 * Calculate overall confidence from factors
 */
export function calculateConfidence(factors: ConfidenceFactors): number {
  let weightedSum = 0;
  let totalWeight = 0;
  
  // Context available (more context = more confident)
  weightedSum += factors.contextAvailable * CONFIDENCE_WEIGHTS.contextAvailable;
  totalWeight += CONFIDENCE_WEIGHTS.contextAvailable;
  
  // Change complexity (simpler = more confident, so invert)
  const complexityScore = 1 - factors.changeComplexity;
  weightedSum += complexityScore * CONFIDENCE_WEIGHTS.changeComplexity;
  totalWeight += CONFIDENCE_WEIGHTS.changeComplexity;
  
  // LLM confidence (direct)
  weightedSum += factors.llmConfidence * CONFIDENCE_WEIGHTS.llmConfidence;
  totalWeight += CONFIDENCE_WEIGHTS.llmConfidence;
  
  // Schema validation (direct)
  weightedSum += factors.schemaValidation * CONFIDENCE_WEIGHTS.schemaValidation;
  totalWeight += CONFIDENCE_WEIGHTS.schemaValidation;
  
  // Token usage (if provided)
  if (factors.tokenUsageRatio !== undefined) {
    const tokenScore = 1 - factors.tokenUsageRatio;
    weightedSum += tokenScore * CONFIDENCE_WEIGHTS.tokenUsageRatio;
    totalWeight += CONFIDENCE_WEIGHTS.tokenUsageRatio;
  }
  
  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

/**
 * Extract average confidence from analysis result
 */
export function extractAverageConfidence(analysisData: {
  affectedComponents?: Array<{ confidence?: number }>;
  risks?: Array<{ confidence?: number }>;
  suggestions?: Array<{ confidence?: number }>;
  styleConsistency?: { confidence?: number };
  prScore?: { confidence?: number };
}): number {
  const confidences: number[] = [];
  
  // Collect all confidence scores
  if (analysisData.affectedComponents) {
    for (const c of analysisData.affectedComponents) {
      if (c.confidence !== undefined) confidences.push(c.confidence);
    }
  }
  
  if (analysisData.risks) {
    for (const r of analysisData.risks) {
      if (r.confidence !== undefined) confidences.push(r.confidence);
    }
  }
  
  if (analysisData.suggestions) {
    for (const s of analysisData.suggestions) {
      if (s.confidence !== undefined) confidences.push(s.confidence);
    }
  }
  
  if (analysisData.styleConsistency?.confidence !== undefined) {
    confidences.push(analysisData.styleConsistency.confidence);
  }
  
  if (analysisData.prScore?.confidence !== undefined) {
    confidences.push(analysisData.prScore.confidence);
  }
  
  // Return average or default
  if (confidences.length === 0) return 0.7;
  
  return confidences.reduce((a, b) => a + b, 0) / confidences.length;
}

/**
 * Get confidence level label
 */
export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.9) return 'Very High';
  if (confidence >= 0.75) return 'High';
  if (confidence >= 0.6) return 'Moderate';
  if (confidence >= 0.4) return 'Low';
  return 'Very Low';
}

/**
 * Should we warn about low confidence?
 */
export function shouldWarnLowConfidence(confidence: number): boolean {
  return confidence < 0.6;
}
