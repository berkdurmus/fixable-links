import type { PRScore, PRScoreBreakdown } from '../prompts/schemas';
import { ScoringWeights, DEFAULT_WEIGHTS, INVERTED_METRICS, mergeWeights } from './weights';
import { evaluateScore, getScoreLabel } from './criteria';

/**
 * Engine for calculating and aggregating scores
 */
export class ScoringEngine {
  private weights: ScoringWeights;
  
  constructor(customWeights?: Partial<ScoringWeights>) {
    this.weights = mergeWeights(customWeights);
  }
  
  /**
   * Calculate overall score from breakdown
   */
  calculateOverallScore(breakdown: PRScoreBreakdown): number {
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const [key, weight] of Object.entries(this.weights)) {
      const metricKey = key as keyof PRScoreBreakdown;
      let value = breakdown[metricKey];
      
      // Invert risk metrics (lower risk = higher contribution)
      if (INVERTED_METRICS.includes(key as keyof ScoringWeights)) {
        value = 100 - value;
      }
      
      weightedSum += value * weight;
      totalWeight += weight;
    }
    
    return Math.round(weightedSum / totalWeight);
  }
  
  /**
   * Recalculate and validate a PR score
   */
  validateAndRecalculate(prScore: PRScore): PRScore {
    const recalculatedOverall = this.calculateOverallScore(prScore.breakdown);
    
    // Allow some tolerance between LLM's score and calculated score
    const tolerance = 10;
    const scoreDiff = Math.abs(prScore.overall - recalculatedOverall);
    
    // If significantly different, use the calculated score
    const finalOverall = scoreDiff > tolerance ? recalculatedOverall : prScore.overall;
    
    return {
      ...prScore,
      overall: finalOverall,
    };
  }
  
  /**
   * Generate additional flags based on breakdown analysis
   */
  generateFlags(breakdown: PRScoreBreakdown): PRScore['flags'] {
    const flags: PRScore['flags'] = [];
    
    // Check each metric
    for (const [key, value] of Object.entries(breakdown)) {
      const metricKey = key as keyof PRScoreBreakdown;
      const evaluation = evaluateScore(metricKey, value);
      
      if (evaluation === 'bad') {
        flags.push({
          type: 'warning',
          message: this.getWarningMessage(metricKey, value),
          confidence: 0.9,
        });
      } else if (evaluation === 'good' && value >= 90) {
        flags.push({
          type: 'info',
          message: this.getPositiveMessage(metricKey),
          confidence: 0.8,
        });
      }
    }
    
    return flags;
  }
  
  /**
   * Get warning message for a metric
   */
  private getWarningMessage(metric: keyof PRScoreBreakdown, value: number): string {
    const messages: Record<keyof PRScoreBreakdown, string> = {
      codeConsistency: `Low code consistency (${value}%). The change may not match surrounding patterns.`,
      reuseScore: `Low reuse score (${value}%). Consider using existing utilities instead.`,
      aiDetectionRisk: `High AI detection risk (${value}%). The change may appear AI-generated.`,
      cascadeRisk: `High cascade risk (${value}%). CSS changes may affect other elements.`,
      responsiveScore: `Low responsive score (${value}%). Mobile/tablet breakpoints may be affected.`,
      semanticScore: `Low semantic score (${value}%). HTML structure may not be semantic.`,
      intentAlignment: `Low intent alignment (${value}%). The change may not match user expectations.`,
    };
    
    return messages[metric];
  }
  
  /**
   * Get positive message for a metric
   */
  private getPositiveMessage(metric: keyof PRScoreBreakdown): string {
    const messages: Record<keyof PRScoreBreakdown, string> = {
      codeConsistency: 'Excellent code consistency with existing patterns.',
      reuseScore: 'Great use of existing utilities and components.',
      aiDetectionRisk: 'Change appears natural and human-written.',
      cascadeRisk: 'CSS changes are well-scoped with low cascade risk.',
      responsiveScore: 'Excellent responsive design considerations.',
      semanticScore: 'Semantic HTML structure preserved.',
      intentAlignment: 'Change aligns well with user intent.',
    };
    
    return messages[metric];
  }
  
  /**
   * Get a summary based on overall score
   */
  getSummary(overall: number, breakdown: PRScoreBreakdown): string {
    const label = getScoreLabel(overall);
    
    // Find the weakest area
    let weakestKey: keyof PRScoreBreakdown = 'codeConsistency';
    let weakestValue = 100;
    
    for (const [key, value] of Object.entries(breakdown)) {
      const metricKey = key as keyof PRScoreBreakdown;
      // For inverted metrics, higher is actually weaker
      const effectiveValue = INVERTED_METRICS.includes(key as keyof ScoringWeights) 
        ? 100 - value 
        : value;
      
      if (effectiveValue < weakestValue) {
        weakestValue = effectiveValue;
        weakestKey = metricKey;
      }
    }
    
    const weakAreaNames: Record<keyof PRScoreBreakdown, string> = {
      codeConsistency: 'code consistency',
      reuseScore: 'code reuse',
      aiDetectionRisk: 'natural appearance',
      cascadeRisk: 'CSS scoping',
      responsiveScore: 'responsive design',
      semanticScore: 'semantic structure',
      intentAlignment: 'intent alignment',
    };
    
    if (overall >= 80) {
      return `${label} change. Well-structured with good attention to ${weakAreaNames[weakestKey]}.`;
    } else if (overall >= 60) {
      return `${label}. Consider improving ${weakAreaNames[weakestKey]} before merging.`;
    } else {
      return `${label}. Significant concerns with ${weakAreaNames[weakestKey]}. Review recommended.`;
    }
  }
  
  /**
   * Determine if change should be approved
   */
  shouldApprove(overall: number, breakdown: PRScoreBreakdown): boolean {
    // Must have overall score >= 60
    if (overall < 60) return false;
    
    // Check for critical failures
    if (breakdown.cascadeRisk > 80) return false;
    if (breakdown.semanticScore < 40) return false;
    if (breakdown.intentAlignment < 50) return false;
    
    return true;
  }
}
