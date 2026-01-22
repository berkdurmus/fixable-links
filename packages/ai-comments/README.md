# @plsfix/ai-comments

AI-powered code review comments for DOM changes. Analyzes risks, style consistency, and provides comprehensive PR scoring.

## Features

- **Multi-Provider Support**: Works with OpenAI (GPT-4) and Anthropic (Claude)
- **Structured Output**: Type-safe analysis results with Zod schemas
- **PR Scoring**: Comprehensive scoring across 7 criteria
- **Risk Assessment**: Identifies cascade, responsive, accessibility, and other risks
- **Style Review**: Evaluates design system alignment and consistency
- **Confidence Scores**: Every assessment includes a confidence rating
- **Streaming Support**: SSE streaming for real-time progress updates

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         @plsfix/ai-comments                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │  ChangeAnalyzer  │───▶│  PromptManager   │───▶│  LLM Providers   │  │
│  │                  │    │                  │    │                  │  │
│  │  - analyze()     │    │  - Handlebars    │    │  - OpenAI        │  │
│  │  - analyzeStream │    │  - Templates     │    │  - Anthropic     │  │
│  │  - analyzeAll()  │    │  - JSON Schema   │    │                  │  │
│  └────────┬─────────┘    └──────────────────┘    └──────────────────┘  │
│           │                                                              │
│           ▼                                                              │
│  ┌──────────────────┐    ┌──────────────────┐                           │
│  │  ScoringEngine   │    │  OutputParsers   │                           │
│  │                  │    │                  │                           │
│  │  - Weights       │    │  - Zod Schemas   │                           │
│  │  - Criteria      │    │  - Validation    │                           │
│  │  - Aggregation   │    │  - Confidence    │                           │
│  └──────────────────┘    └──────────────────┘                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Change    │────▶│   Context   │────▶│   Prompt    │────▶│    LLM      │
│   Input     │     │   Builder   │     │   Manager   │     │   Provider  │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                    │
                                                                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Analysis   │◀────│  Scoring    │◀────│   Schema    │◀────│    JSON     │
│   Result    │     │   Engine    │     │  Validation │     │   Response  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

## Installation

```bash
npm install @plsfix/ai-comments
```

## Quick Start

```typescript
import { ChangeAnalyzer, createProvider } from '@plsfix/ai-comments';

// Create provider
const provider = createProvider('openai', {
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o', // optional, defaults to gpt-4o
});

// Create analyzer
const analyzer = new ChangeAnalyzer({
  provider,
  maxTokens: 2000,
  temperature: 0.3,
});

// Analyze a change
const result = await analyzer.analyze(
  {
    id: 'change-1',
    type: 'style',
    elementTag: 'h1',
    xpath: '/html/body/header/h1',
    selector: 'header > h1',
    original: {
      styles: { fontSize: '48px', color: '#000000' }
    },
    modified: {
      styles: { fontSize: '64px', color: '#1F2937' }
    },
  },
  {
    pageUrl: 'https://example.com',
    designSystem: 'tailwind',
    viewportWidth: 1920,
  }
);

console.log('PR Score:', result.prScore.overall);
console.log('Risks:', result.risks.length);
console.log('Confidence:', result.confidence);
```

## Streaming Analysis

For multiple changes with progress updates:

```typescript
const changes = [/* array of changes */];
const context = { pageUrl: 'https://example.com' };

for await (const event of analyzer.analyzeStream(changes, context)) {
  switch (event.type) {
    case 'start':
      console.log(`Starting analysis of ${event.totalChanges} changes`);
      break;
    case 'progress':
      console.log(`Progress: ${Math.round(event.progress! * 100)}%`);
      break;
    case 'result':
      console.log(`Change ${event.changeId} scored ${event.result!.prScore.overall}`);
      break;
    case 'complete':
      console.log('Analysis complete!');
      break;
  }
}
```

## Analysis Result Structure

```typescript
interface AnalysisResult {
  id: string;
  changeId: string;
  timestamp: number;
  
  // Components affected by this change
  affectedComponents: ComponentImpact[];
  
  // Identified risks
  risks: Risk[];
  
  // Improvement suggestions
  suggestions: Suggestion[];
  
  // Style consistency review
  styleConsistency: StyleReview;
  
  // PR score with breakdown
  prScore: PRScore;
  
  // Overall confidence (0-1)
  confidence: number;
  
  // Provider used
  provider: 'openai' | 'anthropic';
  
  // Tokens consumed
  tokensUsed: number;
}
```

## PR Score Breakdown

The PR score evaluates changes across 7 criteria:

| Criteria | Description |
|----------|-------------|
| **codeConsistency** | Does the change match surrounding code patterns? |
| **reuseScore** | Does it leverage existing utilities vs creating redundant ones? |
| **aiDetectionRisk** | Would a reviewer flag this as AI-generated? (lower is better) |
| **cascadeRisk** | Will CSS changes affect other elements unexpectedly? (lower is better) |
| **responsiveScore** | Are responsive breakpoints handled correctly? |
| **semanticScore** | Is semantic HTML structure preserved? |
| **intentAlignment** | Does this match what the user likely intended? |

## Risk Categories

- `cascade`: CSS cascade effects on other elements
- `responsive`: Responsive design breakpoint issues
- `accessibility`: Accessibility concerns
- `performance`: Performance implications
- `semantic`: Semantic HTML structure issues
- `compatibility`: Browser compatibility
- `design-consistency`: Design system alignment

## Custom Scoring Weights

Override default weights to prioritize certain criteria:

```typescript
const analyzer = new ChangeAnalyzer({
  provider,
  scoring: {
    weights: {
      codeConsistency: 1.5,  // Prioritize code consistency
      cascadeRisk: 2.0,      // Weight cascade risk heavily
      responsiveScore: 1.2,  // Boost responsive importance
    }
  }
});
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LLM_PROVIDER` | Provider to use (`openai` or `anthropic`) | `openai` |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `ANTHROPIC_API_KEY` | Anthropic API key | - |
| `AI_COMMENTS_MODEL` | Model to use | Provider default |
| `AI_COMMENTS_MAX_TOKENS` | Max response tokens | `2000` |

## API Reference

### ChangeAnalyzer

```typescript
class ChangeAnalyzer {
  constructor(config: AnalyzerConfig);
  
  // Analyze a single change
  analyze(change: ChangeInput, context: AnalysisContext): Promise<AnalysisResult>;
  
  // Stream analysis of multiple changes
  analyzeStream(
    changes: ChangeInput[],
    context: AnalysisContext,
    options?: BatchAnalysisOptions
  ): AsyncGenerator<AnalysisStreamEvent>;
  
  // Analyze all and return results array
  analyzeAll(
    changes: ChangeInput[],
    context: AnalysisContext,
    options?: BatchAnalysisOptions
  ): Promise<AnalysisResult[]>;
}
```

### createProvider

```typescript
function createProvider(
  type: 'openai' | 'anthropic',
  config: LLMProviderConfig
): LLMProvider;
```

### ScoringEngine

```typescript
class ScoringEngine {
  constructor(customWeights?: Partial<ScoringWeights>);
  
  calculateOverallScore(breakdown: PRScoreBreakdown): number;
  validateAndRecalculate(prScore: PRScore): PRScore;
  generateFlags(breakdown: PRScoreBreakdown): Flag[];
  getSummary(overall: number, breakdown: PRScoreBreakdown): string;
  shouldApprove(overall: number, breakdown: PRScoreBreakdown): boolean;
}
```

## License

MIT
