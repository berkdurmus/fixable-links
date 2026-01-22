import { Router, Request, Response } from 'express';
import { requireAuth, getUser } from '../middleware/auth';
import { ChangeAnalyzer, createProvider, type ChangeInput, type AnalysisContext, type AnalysisStreamEvent } from '@plsfix/ai-comments';

export const aiCommentsRouter = Router();

/**
 * Analyze changes using AI
 * 
 * POST /api/ai-comments/analyze
 * 
 * Body: {
 *   changes: ChangeInput[],
 *   context: AnalysisContext
 * }
 * 
 * Returns: Server-Sent Events stream of AnalysisStreamEvent
 */
aiCommentsRouter.post('/analyze', async (req: Request, res: Response) => {
  console.log('=== AI Analysis Request Received ===');
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { changes, context } = req.body as {
      changes: ChangeInput[];
      context: AnalysisContext;
    };

    // Validate input
    if (!changes || !Array.isArray(changes) || changes.length === 0) {
      console.log('ERROR: No changes provided');
      return res.status(400).json({ error: 'Changes array is required' });
    }

    if (!context || !context.pageUrl) {
      console.log('ERROR: No context/pageUrl provided');
      return res.status(400).json({ error: 'Context with pageUrl is required' });
    }

    console.log(`Analyzing ${changes.length} changes for ${context.pageUrl}`);

    // Check for API key
    const provider = process.env.LLM_PROVIDER || 'openai';
    const apiKey = provider === 'openai' 
      ? process.env.OPENAI_API_KEY 
      : process.env.ANTHROPIC_API_KEY;

    console.log(`Provider: ${provider}, API Key present: ${!!apiKey}, Key length: ${apiKey?.length || 0}`);

    if (!apiKey) {
      console.log('ERROR: No API key configured');
      return res.status(500).json({ 
        error: `LLM API key not configured. Please set ${provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY'} environment variable.` 
      });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    console.log('Creating LLM provider...');
    
    // Create analyzer
    const llmProvider = createProvider(provider as 'openai' | 'anthropic', {
      apiKey,
      model: process.env.AI_COMMENTS_MODEL,
    });

    console.log('Creating analyzer...');
    
    const analyzer = new ChangeAnalyzer({
      provider: llmProvider,
      maxTokens: parseInt(process.env.AI_COMMENTS_MAX_TOKENS || '2000', 10),
    });

    console.log('Starting analysis stream...');
    
    // Stream results
    const stream = analyzer.analyzeStream(changes, context);

    for await (const event of stream) {
      console.log('Stream event:', event.type);
      
      // Check if client disconnected
      if (res.writableEnded) {
        console.log('Client disconnected');
        break;
      }

      const data = JSON.stringify(event);
      res.write(`data: ${data}\n\n`);

      // Flush to ensure data is sent immediately
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    }

    console.log('Analysis complete');
    res.end();
  } catch (error) {
    console.error('AI analysis error:', error);

    // If headers haven't been sent, send JSON error
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: 'Failed to analyze changes',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // If streaming has started, send error event
    const errorEvent: AnalysisStreamEvent = {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
    res.end();
  }
});

/**
 * Analyze a single change (non-streaming)
 * 
 * POST /api/ai-comments/analyze-single
 */
aiCommentsRouter.post('/analyze-single', requireAuth, async (req: Request, res: Response) => {
  try {
    const { change, context } = req.body as {
      change: ChangeInput;
      context: AnalysisContext;
    };

    if (!change || !change.id) {
      return res.status(400).json({ error: 'Change object is required' });
    }

    if (!context || !context.pageUrl) {
      return res.status(400).json({ error: 'Context with pageUrl is required' });
    }

    // Check for API key
    const provider = process.env.LLM_PROVIDER || 'openai';
    const apiKey = provider === 'openai' 
      ? process.env.OPENAI_API_KEY 
      : process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ 
        error: `LLM API key not configured` 
      });
    }

    const llmProvider = createProvider(provider as 'openai' | 'anthropic', {
      apiKey,
      model: process.env.AI_COMMENTS_MODEL,
    });

    const analyzer = new ChangeAnalyzer({
      provider: llmProvider,
    });

    const result = await analyzer.analyze(change, context);
    res.json(result);
  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze change',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Health check for AI comments service
 */
aiCommentsRouter.get('/health', (req: Request, res: Response) => {
  const provider = process.env.LLM_PROVIDER || 'openai';
  const hasApiKey = provider === 'openai' 
    ? !!process.env.OPENAI_API_KEY 
    : !!process.env.ANTHROPIC_API_KEY;

  res.json({
    status: hasApiKey ? 'configured' : 'not_configured',
    provider,
    model: process.env.AI_COMMENTS_MODEL || 'default',
  });
});
