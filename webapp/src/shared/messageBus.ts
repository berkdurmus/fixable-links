import { PlsFixMessage, MessageType } from './types';

type MessageHandler = (message: PlsFixMessage) => void;

/**
 * MessageBus handles communication between the injected panel and content script
 * using postMessage API instead of chrome.runtime.sendMessage
 */
class MessageBus {
  private handlers: Map<MessageType, Set<MessageHandler>> = new Map();
  private source: 'plsfix-panel' | 'plsfix-content';
  private targetWindow: Window | null = null;
  private targetOrigin: string = '*';
  private isInitialized: boolean = false;

  constructor(source: 'plsfix-panel' | 'plsfix-content') {
    this.source = source;
  }

  /**
   * Initialize the message bus
   */
  init(targetWindow?: Window, targetOrigin?: string) {
    if (this.isInitialized) return;
    
    this.targetWindow = targetWindow || window.parent;
    this.targetOrigin = targetOrigin || '*';
    
    // Listen for incoming messages
    window.addEventListener('message', this.handleMessage);
    this.isInitialized = true;
    
    console.log(`[PlsFix MessageBus] Initialized as ${this.source}`);
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    window.removeEventListener('message', this.handleMessage);
    this.handlers.clear();
    this.isInitialized = false;
  }

  /**
   * Handle incoming messages
   */
  private handleMessage = (event: MessageEvent) => {
    const message = event.data as PlsFixMessage;
    
    // Verify it's a PlsFix message and not from ourselves
    if (!message?.type || message.source === this.source) return;
    
    // Only handle messages from PlsFix
    if (!message.type.startsWith('PLSFIX') && 
        !['ELEMENT_SELECTED', 'ELEMENT_HOVERED', 'ELEMENT_DESELECTED', 
          'CHANGE_RECORDED', 'APPLY_STYLE', 'APPLY_TEXT', 'REVERT_CHANGE',
          'TOGGLE_EDIT_MODE', 'TOGGLE_PANEL', 'PANEL_READY'].includes(message.type)) {
      return;
    }

    console.log(`[PlsFix MessageBus] Received:`, message.type, message.payload);
    
    // Notify all handlers for this message type
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }
    
    // Also notify wildcard handlers
    const wildcardHandlers = this.handlers.get('*' as MessageType);
    if (wildcardHandlers) {
      wildcardHandlers.forEach(handler => handler(message));
    }
  };

  /**
   * Send a message to the target window
   */
  send(type: MessageType, payload?: unknown) {
    const message: PlsFixMessage = {
      type,
      source: this.source,
      payload,
    };
    
    console.log(`[PlsFix MessageBus] Sending:`, type, payload);
    
    if (this.targetWindow) {
      this.targetWindow.postMessage(message, this.targetOrigin);
    } else {
      // If no target window, post to all frames
      window.postMessage(message, this.targetOrigin);
      
      // Also try to send to parent if we're in an iframe
      if (window.parent !== window) {
        window.parent.postMessage(message, this.targetOrigin);
      }
    }
  }

  /**
   * Subscribe to a specific message type
   */
  on(type: MessageType | '*', handler: MessageHandler): () => void {
    if (!this.handlers.has(type as MessageType)) {
      this.handlers.set(type as MessageType, new Set());
    }
    this.handlers.get(type as MessageType)!.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.handlers.get(type as MessageType)?.delete(handler);
    };
  }

  /**
   * Unsubscribe from a specific message type
   */
  off(type: MessageType, handler: MessageHandler) {
    this.handlers.get(type)?.delete(handler);
  }

  /**
   * Set the target window for sending messages
   */
  setTarget(targetWindow: Window, targetOrigin?: string) {
    this.targetWindow = targetWindow;
    if (targetOrigin) {
      this.targetOrigin = targetOrigin;
    }
  }
}

// Export singleton instances for panel and content script
export const panelMessageBus = new MessageBus('plsfix-panel');
export const contentMessageBus = new MessageBus('plsfix-content');

// Export the class for custom usage
export { MessageBus };
