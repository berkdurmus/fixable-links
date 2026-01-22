import type { AnalysisStreamEvent } from '../analyzer/types';

/**
 * Create a Server-Sent Events (SSE) formatted message
 */
export function createSSEMessage(event: AnalysisStreamEvent): string {
  const data = JSON.stringify(event);
  return `data: ${data}\n\n`;
}

/**
 * Parse SSE message back to event
 */
export function parseSSEMessage(message: string): AnalysisStreamEvent | null {
  const match = message.match(/^data: (.+)$/m);
  if (!match) return null;
  
  try {
    return JSON.parse(match[1]) as AnalysisStreamEvent;
  } catch {
    return null;
  }
}

/**
 * Create an SSE stream from an async generator
 */
export async function* createSSEStream(
  events: AsyncGenerator<AnalysisStreamEvent, void, unknown>
): AsyncGenerator<string, void, unknown> {
  for await (const event of events) {
    yield createSSEMessage(event);
  }
}

/**
 * Stream helper that buffers partial JSON responses
 */
export class JSONStreamBuffer {
  private buffer = '';
  
  /**
   * Add a chunk to the buffer
   */
  append(chunk: string): void {
    this.buffer += chunk;
  }
  
  /**
   * Try to extract complete JSON from buffer
   */
  tryParse<T>(): { success: boolean; data?: T; remaining: string } {
    // Try to find valid JSON
    let depth = 0;
    let inString = false;
    let escape = false;
    let jsonEnd = -1;
    
    for (let i = 0; i < this.buffer.length; i++) {
      const char = this.buffer[i];
      
      if (escape) {
        escape = false;
        continue;
      }
      
      if (char === '\\' && inString) {
        escape = true;
        continue;
      }
      
      if (char === '"' && !escape) {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{' || char === '[') {
          depth++;
        } else if (char === '}' || char === ']') {
          depth--;
          if (depth === 0) {
            jsonEnd = i;
            break;
          }
        }
      }
    }
    
    if (jsonEnd === -1) {
      return { success: false, remaining: this.buffer };
    }
    
    const jsonStr = this.buffer.substring(0, jsonEnd + 1);
    this.buffer = this.buffer.substring(jsonEnd + 1);
    
    try {
      const data = JSON.parse(jsonStr) as T;
      return { success: true, data, remaining: this.buffer };
    } catch {
      return { success: false, remaining: this.buffer };
    }
  }
  
  /**
   * Get current buffer contents
   */
  getBuffer(): string {
    return this.buffer;
  }
  
  /**
   * Clear the buffer
   */
  clear(): void {
    this.buffer = '';
  }
}
