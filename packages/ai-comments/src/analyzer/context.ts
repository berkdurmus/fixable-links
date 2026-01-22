import type { ChangeInput, AnalysisContext } from './types';

/**
 * Builds context object for prompt templates
 */
export interface PromptContext {
  // Change details
  changeId: string;
  changeType: 'text' | 'style';
  elementTag: string;
  xpath: string;
  selector: string;
  
  // Original state
  original: {
    textContent?: string;
    styles?: Record<string, string>;
  };
  
  // Modified state
  modified: {
    textContent?: string;
    styles?: Record<string, string>;
  };
  
  // Page context
  pageUrl: string;
  surroundingHTML: string;
  designSystem: string;
  existingClasses: string[];
  viewportWidth: number;
  
  // Computed fields
  isTextChange: boolean;
  isStyleChange: boolean;
  styleChangeCount: number;
  changedStyleProperties: string[];
}

/**
 * Build context object for prompt templates
 */
export function buildPromptContext(
  change: ChangeInput,
  context: AnalysisContext
): PromptContext {
  const changedStyleProperties = getChangedStyleProperties(
    change.original.styles,
    change.modified.styles
  );
  
  return {
    // Change details
    changeId: change.id,
    changeType: change.type,
    elementTag: change.elementTag,
    xpath: change.xpath,
    selector: change.selector,
    
    // Original state
    original: {
      textContent: change.original.textContent,
      styles: change.original.styles,
    },
    
    // Modified state
    modified: {
      textContent: change.modified.textContent,
      styles: change.modified.styles,
    },
    
    // Page context
    pageUrl: context.pageUrl,
    surroundingHTML: context.surroundingHTML || '',
    designSystem: context.designSystem || 'unknown',
    existingClasses: context.existingClasses || [],
    viewportWidth: context.viewportWidth || 1920,
    
    // Computed fields
    isTextChange: change.type === 'text',
    isStyleChange: change.type === 'style',
    styleChangeCount: changedStyleProperties.length,
    changedStyleProperties,
  };
}

/**
 * Get list of style properties that changed
 */
function getChangedStyleProperties(
  original?: Record<string, string>,
  modified?: Record<string, string>
): string[] {
  if (!original || !modified) return [];
  
  const changed: string[] = [];
  const allKeys = new Set([...Object.keys(original), ...Object.keys(modified)]);
  
  for (const key of allKeys) {
    if (original[key] !== modified[key]) {
      changed.push(key);
    }
  }
  
  return changed;
}

/**
 * Estimate complexity of a change (0-1)
 */
export function estimateChangeComplexity(change: ChangeInput): number {
  let complexity = 0;
  
  // Text changes are simpler
  if (change.type === 'text') {
    const originalLen = change.original.textContent?.length || 0;
    const modifiedLen = change.modified.textContent?.length || 0;
    const diff = Math.abs(modifiedLen - originalLen);
    complexity = Math.min(diff / 100, 0.5);
  }
  
  // Style changes vary in complexity
  if (change.type === 'style') {
    const changedProps = getChangedStyleProperties(
      change.original.styles,
      change.modified.styles
    );
    
    // More properties = more complex
    complexity = Math.min(changedProps.length / 10, 0.7);
    
    // Certain properties are more impactful
    const highImpactProps = ['display', 'position', 'width', 'height', 'grid', 'flex'];
    const hasHighImpact = changedProps.some(p => 
      highImpactProps.some(hip => p.toLowerCase().includes(hip))
    );
    if (hasHighImpact) {
      complexity = Math.min(complexity + 0.2, 1);
    }
  }
  
  return complexity;
}

/**
 * Estimate available context quality (0-1)
 */
export function estimateContextQuality(context: AnalysisContext): number {
  let quality = 0.3; // Base quality
  
  if (context.surroundingHTML && context.surroundingHTML.length > 100) {
    quality += 0.3;
  }
  
  if (context.designSystem && context.designSystem !== 'unknown') {
    quality += 0.2;
  }
  
  if (context.existingClasses && context.existingClasses.length > 0) {
    quality += 0.1;
  }
  
  if (context.viewportWidth) {
    quality += 0.1;
  }
  
  return Math.min(quality, 1);
}
