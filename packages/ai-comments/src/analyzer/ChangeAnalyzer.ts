import { v4 as uuidv4 } from 'uuid';
import type { LLMProvider } from '../providers/base';
import { PromptManager } from '../prompts/PromptManager';
import { safeParseAnalysisResult, getAnalysisResultJsonSchema, type AnalysisResultData } from '../prompts/schemas';
import { ScoringEngine } from '../scoring/ScoringEngine';
import { calculateConfidence, extractAverageConfidence } from '../utils/confidence';
import { buildPromptContext, estimateChangeComplexity, estimateContextQuality } from './context';
import type {
  AnalyzerConfig,
  AnalysisContext,
  ChangeInput,
  AnalysisResult,
  AnalysisStreamEvent,
  BatchAnalysisOptions,
} from './types';

/**
 * Main analyzer class for processing DOM changes
 */
export class ChangeAnalyzer {
  private provider: LLMProvider;
  private promptManager: PromptManager;
  private scoringEngine: ScoringEngine;
  private maxTokens: number;
  private temperature: number;
  
  constructor(config: AnalyzerConfig) {
    this.provider = config.provider;
    this.promptManager = new PromptManager();
    this.scoringEngine = new ScoringEngine(config.scoring?.weights);
    this.maxTokens = config.maxTokens || 2000;
    this.temperature = config.temperature ?? 0.3;
  }
  
  /**
   * Analyze a single change
   */
  async analyze(
    change: ChangeInput,
    context: AnalysisContext
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    // Build prompt context
    const promptContext = buildPromptContext(change, context);
    
    // Get prompts
    const systemPrompt = this.promptManager.render('system', {});
    const userPrompt = this.promptManager.render('analysis', {
      ...promptContext,
      outputSchema: getAnalysisResultJsonSchema(),
    });
    
    // Call LLM
    const response = await this.provider.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      jsonMode: true,
    });
    
    // Parse response
    let analysisData: AnalysisResultData;
    let schemaValidation = 1;
    
    try {
      const parsed = JSON.parse(response.content);
      const result = safeParseAnalysisResult(parsed);
      
      if (result.success && result.data) {
        analysisData = result.data;
      } else {
        // Partial parse - try to use what we got
        schemaValidation = 0.5;
        analysisData = this.createFallbackResult(parsed) as AnalysisResultData;
      }
    } catch (error) {
      schemaValidation = 0;
      analysisData = this.createDefaultResult() as AnalysisResultData;
    }
    
    // Validate and recalculate scores
    const validatedPrScore = this.scoringEngine.validateAndRecalculate(analysisData.prScore);
    analysisData = { ...analysisData, prScore: validatedPrScore };
    
    // Calculate overall confidence
    const llmConfidence = extractAverageConfidence(analysisData);
    const confidence = calculateConfidence({
      contextAvailable: estimateContextQuality(context),
      changeComplexity: estimateChangeComplexity(change),
      llmConfidence,
      schemaValidation,
      tokenUsageRatio: response.totalTokens / this.maxTokens,
    });
    
    return {
      id: uuidv4(),
      changeId: change.id,
      timestamp: startTime,
      affectedComponents: analysisData.affectedComponents,
      risks: analysisData.risks,
      suggestions: analysisData.suggestions,
      styleConsistency: analysisData.styleConsistency,
      prScore: analysisData.prScore,
      confidence,
      provider: this.provider.name,
      tokensUsed: response.totalTokens,
      rawResponse: response.content,
    };
  }
  
  /**
   * Analyze multiple changes with streaming progress
   */
  async *analyzeStream(
    changes: ChangeInput[],
    context: AnalysisContext,
    options?: BatchAnalysisOptions
  ): AsyncGenerator<AnalysisStreamEvent, void, unknown> {
    yield {
      type: 'start',
      totalChanges: changes.length,
      completedChanges: 0,
    };
    
    let completed = 0;
    
    if (options?.parallel) {
      // Parallel processing with concurrency limit
      const concurrency = options.concurrency || 3;
      const results: Promise<AnalysisResult>[] = [];
      
      for (let i = 0; i < changes.length; i += concurrency) {
        const batch = changes.slice(i, i + concurrency);
        const batchPromises = batch.map(change => this.analyze(change, context));
        
        const batchResults = await Promise.all(batchPromises);
        
        for (const result of batchResults) {
          completed++;
          yield {
            type: 'result',
            changeId: result.changeId,
            result,
            progress: completed / changes.length,
            totalChanges: changes.length,
            completedChanges: completed,
          };
          
          options.onProgress?.({
            type: 'progress',
            changeId: result.changeId,
            progress: completed / changes.length,
            totalChanges: changes.length,
            completedChanges: completed,
          });
        }
      }
    } else {
      // Sequential processing
      for (const change of changes) {
        try {
          yield {
            type: 'progress',
            changeId: change.id,
            progress: completed / changes.length,
            totalChanges: changes.length,
            completedChanges: completed,
          };
          
          const result = await this.analyze(change, context);
          completed++;
          
          yield {
            type: 'result',
            changeId: change.id,
            result,
            progress: completed / changes.length,
            totalChanges: changes.length,
            completedChanges: completed,
          };
          
          options?.onProgress?.({
            type: 'result',
            changeId: change.id,
            result,
            progress: completed / changes.length,
            totalChanges: changes.length,
            completedChanges: completed,
          });
        } catch (error) {
          yield {
            type: 'error',
            changeId: change.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            totalChanges: changes.length,
            completedChanges: completed,
          };
        }
      }
    }
    
    yield {
      type: 'complete',
      totalChanges: changes.length,
      completedChanges: completed,
    };
  }
  
  /**
   * Analyze multiple changes and return all results
   */
  async analyzeAll(
    changes: ChangeInput[],
    context: AnalysisContext,
    options?: BatchAnalysisOptions
  ): Promise<AnalysisResult[]> {
    const results: AnalysisResult[] = [];
    
    for await (const event of this.analyzeStream(changes, context, options)) {
      if (event.type === 'result' && event.result) {
        results.push(event.result);
      }
    }
    
    return results;
  }
  
  /**
   * Create a fallback result from partial data
   */
  private createFallbackResult(partial: Record<string, unknown>) {
    return {
      affectedComponents: Array.isArray(partial.affectedComponents) 
        ? partial.affectedComponents 
        : [],
      risks: Array.isArray(partial.risks) ? partial.risks : [],
      suggestions: Array.isArray(partial.suggestions) ? partial.suggestions : [],
      styleConsistency: (partial.styleConsistency as Record<string, unknown>) || this.createDefaultStyleReview(),
      prScore: (partial.prScore as Record<string, unknown>) || this.createDefaultPRScore(),
    } as ReturnType<typeof safeParseAnalysisResult>['data'];
  }
  
  /**
   * Create a default result when parsing fails completely
   */
  private createDefaultResult() {
    return {
      affectedComponents: [],
      risks: [{
        id: 'parse-error',
        severity: 'medium' as const,
        category: 'compatibility' as const,
        title: 'Analysis Parse Error',
        description: 'Could not fully parse the analysis result. Review manually.',
        confidence: 0.5,
      }],
      suggestions: [],
      styleConsistency: this.createDefaultStyleReview(),
      prScore: this.createDefaultPRScore(),
    };
  }
  
  private createDefaultStyleReview() {
    return {
      overallConsistency: 70,
      designSystemAlignment: 70,
      colorConsistency: 70,
      spacingConsistency: 70,
      typographyConsistency: 70,
      issues: [],
      confidence: 0.5,
    };
  }
  
  private createDefaultPRScore() {
    return {
      overall: 70,
      breakdown: {
        codeConsistency: 70,
        reuseScore: 70,
        aiDetectionRisk: 30,
        cascadeRisk: 30,
        responsiveScore: 70,
        semanticScore: 70,
        intentAlignment: 70,
      },
      flags: [],
      summary: 'Analysis incomplete. Manual review recommended.',
      wouldApprove: true,
      confidence: 0.5,
    };
  }
}
