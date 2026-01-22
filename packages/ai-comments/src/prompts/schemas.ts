import { z } from 'zod';

/**
 * Component Impact Schema
 */
export const ComponentImpactSchema = z.object({
  componentName: z.string().describe('Name of the affected component'),
  filePath: z.string().optional().describe('Path to the component file if detectable'),
  impactLevel: z.enum(['high', 'medium', 'low']).describe('Severity of impact'),
  description: z.string().describe('Description of how the component is affected'),
  otherPagesAffected: z.array(z.string()).describe('List of other pages that might be affected'),
  confidence: z.number().min(0).max(1).describe('Confidence in this assessment (0-1)'),
});

export type ComponentImpact = z.infer<typeof ComponentImpactSchema>;

/**
 * Risk Schema
 */
export const RiskSchema = z.object({
  id: z.string().describe('Unique identifier for this risk'),
  severity: z.enum(['critical', 'high', 'medium', 'low']).describe('Risk severity level'),
  category: z.enum([
    'cascade',
    'responsive',
    'accessibility',
    'performance',
    'semantic',
    'compatibility',
    'design-consistency',
  ]).describe('Category of risk'),
  title: z.string().describe('Short title for the risk'),
  description: z.string().describe('Detailed description of the risk'),
  affectedBreakpoints: z.array(z.string()).optional().describe('Breakpoints affected (e.g., "mobile", "tablet")'),
  mitigation: z.string().optional().describe('Suggested mitigation'),
  confidence: z.number().min(0).max(1).describe('Confidence in this risk assessment'),
});

export type Risk = z.infer<typeof RiskSchema>;

/**
 * Suggestion Schema
 */
export const SuggestionSchema = z.object({
  id: z.string().describe('Unique identifier for this suggestion'),
  type: z.enum(['improvement', 'alternative', 'best-practice', 'optimization']).describe('Type of suggestion'),
  priority: z.enum(['high', 'medium', 'low']).describe('Priority level'),
  title: z.string().describe('Short title for the suggestion'),
  description: z.string().describe('Detailed description'),
  codeExample: z.string().optional().describe('Example code if applicable'),
  rationale: z.string().describe('Why this suggestion is beneficial'),
  confidence: z.number().min(0).max(1).describe('Confidence in this suggestion'),
});

export type Suggestion = z.infer<typeof SuggestionSchema>;

/**
 * Style Review Schema
 */
export const StyleReviewSchema = z.object({
  overallConsistency: z.number().min(0).max(100).describe('Overall style consistency score'),
  designSystemAlignment: z.number().min(0).max(100).describe('How well it aligns with detected design system'),
  colorConsistency: z.number().min(0).max(100).describe('Color usage consistency'),
  spacingConsistency: z.number().min(0).max(100).describe('Spacing/margin/padding consistency'),
  typographyConsistency: z.number().min(0).max(100).describe('Typography consistency'),
  issues: z.array(z.object({
    property: z.string(),
    issue: z.string(),
    suggestion: z.string(),
  })).describe('Specific style issues found'),
  confidence: z.number().min(0).max(1).describe('Confidence in style review'),
});

export type StyleReview = z.infer<typeof StyleReviewSchema>;

/**
 * PR Score Breakdown Schema
 */
export const PRScoreBreakdownSchema = z.object({
  codeConsistency: z.number().min(0).max(100).describe('Does it match surrounding code patterns?'),
  reuseScore: z.number().min(0).max(100).describe('Does it leverage existing utilities?'),
  aiDetectionRisk: z.number().min(0).max(100).describe('Risk of being flagged as AI-generated (lower is better)'),
  cascadeRisk: z.number().min(0).max(100).describe('Risk of unintended CSS cascade (lower is better)'),
  responsiveScore: z.number().min(0).max(100).describe('Responsive design quality'),
  semanticScore: z.number().min(0).max(100).describe('Semantic HTML preservation'),
  intentAlignment: z.number().min(0).max(100).describe('Alignment with likely user intent'),
});

export type PRScoreBreakdown = z.infer<typeof PRScoreBreakdownSchema>;

/**
 * Flag Schema
 */
export const FlagSchema = z.object({
  type: z.enum(['warning', 'suggestion', 'info']).describe('Type of flag'),
  message: z.string().describe('Flag message'),
  details: z.string().optional().describe('Additional details'),
  confidence: z.number().min(0).max(1).describe('Confidence in this flag'),
});

export type Flag = z.infer<typeof FlagSchema>;

/**
 * PR Score Schema
 */
export const PRScoreSchema = z.object({
  overall: z.number().min(0).max(100).describe('Overall PR quality score'),
  breakdown: PRScoreBreakdownSchema,
  flags: z.array(FlagSchema).describe('Important flags for reviewers'),
  summary: z.string().describe('Brief summary of the PR quality'),
  wouldApprove: z.boolean().describe('Would an AI reviewer approve this change?'),
  confidence: z.number().min(0).max(1).describe('Confidence in PR scoring'),
});

export type PRScore = z.infer<typeof PRScoreSchema>;

/**
 * Complete Analysis Result Schema
 */
export const AnalysisResultSchema = z.object({
  affectedComponents: z.array(ComponentImpactSchema),
  risks: z.array(RiskSchema),
  suggestions: z.array(SuggestionSchema),
  styleConsistency: StyleReviewSchema,
  prScore: PRScoreSchema,
});

export type AnalysisResultData = z.infer<typeof AnalysisResultSchema>;

/**
 * Validate and parse analysis result from LLM
 */
export function parseAnalysisResult(data: unknown): AnalysisResultData {
  return AnalysisResultSchema.parse(data);
}

/**
 * Safely parse with fallback for partial results
 */
export function safeParseAnalysisResult(data: unknown): {
  success: boolean;
  data?: AnalysisResultData;
  error?: z.ZodError;
} {
  const result = AnalysisResultSchema.safeParse(data);
  return {
    success: result.success,
    data: result.success ? result.data : undefined,
    error: result.success ? undefined : result.error,
  };
}

/**
 * Get JSON schema for prompts
 */
export function getAnalysisResultJsonSchema(): object {
  return {
    type: 'object',
    required: ['affectedComponents', 'risks', 'suggestions', 'styleConsistency', 'prScore'],
    properties: {
      affectedComponents: {
        type: 'array',
        items: {
          type: 'object',
          required: ['componentName', 'impactLevel', 'description', 'otherPagesAffected', 'confidence'],
          properties: {
            componentName: { type: 'string' },
            filePath: { type: 'string' },
            impactLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
            description: { type: 'string' },
            otherPagesAffected: { type: 'array', items: { type: 'string' } },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
          },
        },
      },
      risks: {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'severity', 'category', 'title', 'description', 'confidence'],
          properties: {
            id: { type: 'string' },
            severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
            category: { type: 'string', enum: ['cascade', 'responsive', 'accessibility', 'performance', 'semantic', 'compatibility', 'design-consistency'] },
            title: { type: 'string' },
            description: { type: 'string' },
            affectedBreakpoints: { type: 'array', items: { type: 'string' } },
            mitigation: { type: 'string' },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
          },
        },
      },
      suggestions: {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'type', 'priority', 'title', 'description', 'rationale', 'confidence'],
          properties: {
            id: { type: 'string' },
            type: { type: 'string', enum: ['improvement', 'alternative', 'best-practice', 'optimization'] },
            priority: { type: 'string', enum: ['high', 'medium', 'low'] },
            title: { type: 'string' },
            description: { type: 'string' },
            codeExample: { type: 'string' },
            rationale: { type: 'string' },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
          },
        },
      },
      styleConsistency: {
        type: 'object',
        required: ['overallConsistency', 'designSystemAlignment', 'colorConsistency', 'spacingConsistency', 'typographyConsistency', 'issues', 'confidence'],
        properties: {
          overallConsistency: { type: 'number', minimum: 0, maximum: 100 },
          designSystemAlignment: { type: 'number', minimum: 0, maximum: 100 },
          colorConsistency: { type: 'number', minimum: 0, maximum: 100 },
          spacingConsistency: { type: 'number', minimum: 0, maximum: 100 },
          typographyConsistency: { type: 'number', minimum: 0, maximum: 100 },
          issues: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                property: { type: 'string' },
                issue: { type: 'string' },
                suggestion: { type: 'string' },
              },
            },
          },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
        },
      },
      prScore: {
        type: 'object',
        required: ['overall', 'breakdown', 'flags', 'summary', 'wouldApprove', 'confidence'],
        properties: {
          overall: { type: 'number', minimum: 0, maximum: 100 },
          breakdown: {
            type: 'object',
            properties: {
              codeConsistency: { type: 'number', minimum: 0, maximum: 100 },
              reuseScore: { type: 'number', minimum: 0, maximum: 100 },
              aiDetectionRisk: { type: 'number', minimum: 0, maximum: 100 },
              cascadeRisk: { type: 'number', minimum: 0, maximum: 100 },
              responsiveScore: { type: 'number', minimum: 0, maximum: 100 },
              semanticScore: { type: 'number', minimum: 0, maximum: 100 },
              intentAlignment: { type: 'number', minimum: 0, maximum: 100 },
            },
          },
          flags: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['warning', 'suggestion', 'info'] },
                message: { type: 'string' },
                details: { type: 'string' },
                confidence: { type: 'number', minimum: 0, maximum: 1 },
              },
            },
          },
          summary: { type: 'string' },
          wouldApprove: { type: 'boolean' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
        },
      },
    },
  };
}
