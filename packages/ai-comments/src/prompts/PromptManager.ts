import Handlebars from 'handlebars';
import { getAnalysisResultJsonSchema } from './schemas';

/**
 * Template names
 */
export type TemplateName = 
  | 'system'
  | 'analysis'
  | 'component-analysis'
  | 'style-review'
  | 'risk-assessment'
  | 'pr-scoring';

/**
 * Manages prompt templates with Handlebars
 */
export class PromptManager {
  private templates: Map<TemplateName, Handlebars.TemplateDelegate> = new Map();
  
  constructor() {
    this.registerHelpers();
    this.loadDefaultTemplates();
  }
  
  /**
   * Register Handlebars helpers
   */
  private registerHelpers() {
    // JSON stringify helper
    Handlebars.registerHelper('json', function(context) {
      return JSON.stringify(context, null, 2);
    });
    
    // Conditional helper for checking if value exists
    Handlebars.registerHelper('ifExists', function(this: unknown, value, options) {
      if (value !== undefined && value !== null && value !== '') {
        return (options as Handlebars.HelperOptions).fn(this);
      }
      return (options as Handlebars.HelperOptions).inverse(this);
    });
    
    // Join array helper
    Handlebars.registerHelper('join', function(array, separator) {
      if (Array.isArray(array)) {
        return array.join(separator || ', ');
      }
      return '';
    });
    
    // Capitalize helper
    Handlebars.registerHelper('capitalize', function(str) {
      if (typeof str === 'string') {
        return str.charAt(0).toUpperCase() + str.slice(1);
      }
      return str;
    });
  }
  
  /**
   * Load default embedded templates
   */
  private loadDefaultTemplates() {
    // System prompt template
    this.templates.set('system', Handlebars.compile(SYSTEM_TEMPLATE));
    
    // Main analysis template
    this.templates.set('analysis', Handlebars.compile(ANALYSIS_TEMPLATE));
    
    // Component analysis template
    this.templates.set('component-analysis', Handlebars.compile(COMPONENT_ANALYSIS_TEMPLATE));
    
    // Style review template
    this.templates.set('style-review', Handlebars.compile(STYLE_REVIEW_TEMPLATE));
    
    // Risk assessment template
    this.templates.set('risk-assessment', Handlebars.compile(RISK_ASSESSMENT_TEMPLATE));
    
    // PR scoring template
    this.templates.set('pr-scoring', Handlebars.compile(PR_SCORING_TEMPLATE));
  }
  
  /**
   * Get a compiled template
   */
  getTemplate(name: TemplateName): Handlebars.TemplateDelegate {
    const template = this.templates.get(name);
    if (!template) {
      throw new Error(`Template "${name}" not found`);
    }
    return template;
  }
  
  /**
   * Render a template with context
   */
  render(name: TemplateName, context: Record<string, unknown>): string {
    const template = this.getTemplate(name);
    return template(context);
  }
  
  /**
   * Get the JSON schema for structured output
   */
  getOutputSchema(): object {
    return getAnalysisResultJsonSchema();
  }
  
  /**
   * Register a custom template
   */
  registerTemplate(name: TemplateName, templateString: string) {
    this.templates.set(name, Handlebars.compile(templateString));
  }
}

// ============================================================================
// EMBEDDED TEMPLATES
// ============================================================================

const SYSTEM_TEMPLATE = `You are an expert frontend code reviewer and design system analyst. You analyze DOM changes made through a visual editor and provide detailed, actionable feedback.

Your expertise includes:
- CSS architecture and cascade effects
- Responsive design and breakpoints
- Design system consistency
- Accessibility best practices
- Code quality and maintainability
- Semantic HTML structure

You always provide structured JSON responses matching the specified schema. Your analysis is thorough but practical, focusing on real risks and actionable suggestions.

When analyzing changes:
1. Consider the broader context of the page and design system
2. Think about responsive behavior across breakpoints
3. Evaluate accessibility implications
4. Assess consistency with existing patterns
5. Identify potential cascade effects

Be direct and specific. Avoid vague warnings. When you identify a risk, explain exactly what could go wrong and how to mitigate it.`;

const ANALYSIS_TEMPLATE = `Analyze the following DOM change and provide a comprehensive review.

## Change Details
- **Type**: {{changeType}} change
- **Element**: <{{elementTag}}>
- **Selector**: \`{{selector}}\`
- **Page URL**: {{pageUrl}}

## Original State
{{#if isTextChange}}
**Text Content**: "{{original.textContent}}"
{{/if}}
{{#if isStyleChange}}
**Styles**:
\`\`\`json
{{json original.styles}}
\`\`\`
{{/if}}

## Modified State
{{#if isTextChange}}
**Text Content**: "{{modified.textContent}}"
{{/if}}
{{#if isStyleChange}}
**Styles**:
\`\`\`json
{{json modified.styles}}
\`\`\`
{{/if}}

{{#ifExists surroundingHTML}}
## Surrounding Context
\`\`\`html
{{surroundingHTML}}
\`\`\`
{{/ifExists}}

{{#ifExists designSystem}}
## Design System
Detected: {{designSystem}}
{{/ifExists}}

{{#if existingClasses.length}}
## Existing CSS Classes on Page
{{join existingClasses ", "}}
{{/if}}

## Viewport
Width: {{viewportWidth}}px

---

Analyze this change and respond with a JSON object containing:
1. **affectedComponents**: Components impacted by this change
2. **risks**: Potential risks (cascade, responsive, accessibility, etc.)
3. **suggestions**: Improvement suggestions
4. **styleConsistency**: Style consistency review
5. **prScore**: Overall PR quality score with breakdown

Response must be valid JSON matching this schema:
\`\`\`json
{{json outputSchema}}
\`\`\``;

const COMPONENT_ANALYSIS_TEMPLATE = `Analyze the component impact of this DOM change.

## Change
- Element: <{{elementTag}}>
- Selector: {{selector}}
- Change Type: {{changeType}}

## Context
{{#ifExists surroundingHTML}}
\`\`\`html
{{surroundingHTML}}
\`\`\`
{{/ifExists}}

Identify:
1. What component is this element part of?
2. Are there other instances of this component on the page?
3. What other pages might use this component?
4. What is the impact level (high/medium/low)?

Respond with JSON array of ComponentImpact objects.`;

const STYLE_REVIEW_TEMPLATE = `Review the style consistency of this change.

## Original Styles
\`\`\`json
{{json original.styles}}
\`\`\`

## Modified Styles
\`\`\`json
{{json modified.styles}}
\`\`\`

## Changed Properties
{{join changedStyleProperties ", "}}

{{#ifExists designSystem}}
## Design System: {{designSystem}}
{{/ifExists}}

Evaluate:
1. Color consistency with the design system
2. Spacing/padding alignment with existing patterns
3. Typography consistency
4. Overall style coherence

Respond with a StyleReview JSON object.`;

const RISK_ASSESSMENT_TEMPLATE = `Assess the risks of this DOM change.

## Change Details
- Element: <{{elementTag}}>
- Type: {{changeType}}
- Selector: {{selector}}

{{#if isStyleChange}}
## Style Changes
Changed properties: {{join changedStyleProperties ", "}}

Original:
\`\`\`json
{{json original.styles}}
\`\`\`

Modified:
\`\`\`json
{{json modified.styles}}
\`\`\`
{{/if}}

{{#if isTextChange}}
## Text Change
Original: "{{original.textContent}}"
Modified: "{{modified.textContent}}"
{{/if}}

## Context
Viewport: {{viewportWidth}}px
{{#ifExists surroundingHTML}}
Surrounding HTML available for context
{{/ifExists}}

Identify risks in these categories:
- **cascade**: CSS cascade effects on other elements
- **responsive**: Responsive design breakpoint issues
- **accessibility**: Accessibility concerns
- **performance**: Performance implications
- **semantic**: Semantic HTML structure
- **compatibility**: Browser compatibility
- **design-consistency**: Design system alignment

For each risk, provide:
- Severity (critical/high/medium/low)
- Clear description
- Specific mitigation steps

Respond with JSON array of Risk objects.`;

const PR_SCORING_TEMPLATE = `Score this change as if reviewing a pull request.

## Change Summary
- Element: <{{elementTag}}>
- Type: {{capitalize changeType}} change
- Selector: {{selector}}

{{#if isTextChange}}
Text changed from "{{original.textContent}}" to "{{modified.textContent}}"
{{/if}}

{{#if isStyleChange}}
Style properties changed: {{join changedStyleProperties ", "}}
{{/if}}

## Scoring Criteria (0-100 each)

1. **Code Consistency**: Does this match surrounding code patterns and conventions?
2. **Reuse Score**: Does it leverage existing utilities or create redundant styles?
3. **AI Detection Risk**: Would a reviewer flag this as AI-generated? (lower score = higher risk)
4. **Cascade Risk**: Will CSS changes affect other elements unexpectedly? (lower score = higher risk)
5. **Responsive Score**: Are there responsive breakpoint considerations handled?
6. **Semantic Score**: Is semantic HTML structure preserved?
7. **Intent Alignment**: Does this match what the user likely intended?

## Also Consider
- Would you approve this PR?
- What flags would you raise for reviewers?
- Brief summary of change quality

Respond with a PRScore JSON object including overall score, breakdown, and flags.`;
