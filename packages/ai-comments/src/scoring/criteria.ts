import type { PRScoreBreakdown } from '../prompts/schemas';

/**
 * Scoring criteria definitions with descriptions
 */
export interface ScoringCriteria {
  key: keyof PRScoreBreakdown;
  name: string;
  description: string;
  goodThreshold: number;
  badThreshold: number;
  isInverted: boolean;
}

export const SCORING_CRITERIA: ScoringCriteria[] = [
  {
    key: 'codeConsistency',
    name: 'Code Consistency',
    description: 'How well the change matches surrounding code patterns and conventions',
    goodThreshold: 80,
    badThreshold: 50,
    isInverted: false,
  },
  {
    key: 'reuseScore',
    name: 'Code Reuse',
    description: 'Whether the change leverages existing utilities vs creating redundant ones',
    goodThreshold: 75,
    badThreshold: 40,
    isInverted: false,
  },
  {
    key: 'aiDetectionRisk',
    name: 'AI Detection Risk',
    description: 'Likelihood a reviewer would flag this as AI-generated',
    goodThreshold: 30,
    badThreshold: 70,
    isInverted: true,
  },
  {
    key: 'cascadeRisk',
    name: 'CSS Cascade Risk',
    description: 'Risk of CSS changes affecting other elements unexpectedly',
    goodThreshold: 30,
    badThreshold: 60,
    isInverted: true,
  },
  {
    key: 'responsiveScore',
    name: 'Responsive Design',
    description: 'Quality of responsive design considerations',
    goodThreshold: 75,
    badThreshold: 45,
    isInverted: false,
  },
  {
    key: 'semanticScore',
    name: 'Semantic HTML',
    description: 'Preservation of semantic HTML structure',
    goodThreshold: 80,
    badThreshold: 50,
    isInverted: false,
  },
  {
    key: 'intentAlignment',
    name: 'Intent Alignment',
    description: 'How well the change matches what the user likely intended',
    goodThreshold: 85,
    badThreshold: 60,
    isInverted: false,
  },
];

/**
 * Get criteria by key
 */
export function getCriteria(key: keyof PRScoreBreakdown): ScoringCriteria | undefined {
  return SCORING_CRITERIA.find(c => c.key === key);
}

/**
 * Evaluate a single score against criteria
 */
export function evaluateScore(
  key: keyof PRScoreBreakdown,
  value: number
): 'good' | 'neutral' | 'bad' {
  const criteria = getCriteria(key);
  if (!criteria) return 'neutral';
  
  if (criteria.isInverted) {
    // For inverted metrics, lower is better
    if (value <= criteria.goodThreshold) return 'good';
    if (value >= criteria.badThreshold) return 'bad';
  } else {
    // For normal metrics, higher is better
    if (value >= criteria.goodThreshold) return 'good';
    if (value <= criteria.badThreshold) return 'bad';
  }
  
  return 'neutral';
}

/**
 * Get score label
 */
export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Acceptable';
  if (score >= 60) return 'Needs Review';
  if (score >= 50) return 'Concerning';
  return 'Poor';
}

/**
 * Get score color (for UI)
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return '#10B981'; // Green
  if (score >= 60) return '#F59E0B'; // Yellow
  return '#EF4444'; // Red
}
