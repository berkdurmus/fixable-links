/**
 * PlsFix Content Script - Adapted for web (no chrome.runtime)
 * This script is injected into proxied pages and handles:
 * - Element selection and highlighting
 * - Inline text editing
 * - Style application
 * - Communication with the sidepanel via postMessage
 */

import { Change, ElementInfo, ComputedStyleInfo, PlsFixMessage } from '../shared/types';

// State
let isEditModeEnabled = false;
let selectedElement: HTMLElement | null = null;
let hoveredElement: HTMLElement | null = null;
let overlayContainer: HTMLDivElement | null = null;
let selectedOverlay: HTMLDivElement | null = null;
let hoverOverlay: HTMLDivElement | null = null;
let editTooltip: HTMLDivElement | null = null;
const elementIdMap = new Map<string, HTMLElement>();
const originalStates = new Map<string, { textContent: string; styles: Record<string, string> }>();

// Generate unique ID
function generateId(): string {
  return `plsfix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create element info object
function createElementInfo(element: HTMLElement, elementId: string): ElementInfo {
  const computedStyle = window.getComputedStyle(element);
  
  return {
    id: elementId,
    tagName: element.tagName.toLowerCase(),
    xpath: getXPath(element),
    selector: getSelector(element),
    textContent: element.textContent?.trim().slice(0, 100) || '',
    computedStyles: {
      fontFamily: computedStyle.fontFamily,
      fontWeight: computedStyle.fontWeight,
      fontSize: computedStyle.fontSize,
      color: computedStyle.color,
      backgroundColor: computedStyle.backgroundColor,
      textAlign: computedStyle.textAlign,
      fontStyle: computedStyle.fontStyle,
      textDecoration: computedStyle.textDecoration,
      width: computedStyle.width,
      height: computedStyle.height,
      paddingTop: computedStyle.paddingTop,
      paddingRight: computedStyle.paddingRight,
      paddingBottom: computedStyle.paddingBottom,
      paddingLeft: computedStyle.paddingLeft,
      marginTop: computedStyle.marginTop,
      marginRight: computedStyle.marginRight,
      marginBottom: computedStyle.marginBottom,
      marginLeft: computedStyle.marginLeft,
    },
    boundingRect: element.getBoundingClientRect(),
  };
}

// Get XPath for element
function getXPath(element: HTMLElement): string {
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }
  
  const parts: string[] = [];
  let current: HTMLElement | null = element;
  
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 1;
    let sibling = current.previousElementSibling;
    
    while (sibling) {
      if (sibling.tagName === current.tagName) {
        index++;
      }
      sibling = sibling.previousElementSibling;
    }
    
    const tagName = current.tagName.toLowerCase();
    parts.unshift(`${tagName}[${index}]`);
    current = current.parentElement;
  }
  
  return '/' + parts.join('/');
}

// Get CSS selector for element
function getSelector(element: HTMLElement): string {
  if (element.id) {
    return `#${element.id}`;
  }
  
  const classes = Array.from(element.classList)
    .filter(c => !c.startsWith('plsfix-'))
    .slice(0, 2)
    .join('.');
  
  const tag = element.tagName.toLowerCase();
  
  if (classes) {
    return `${tag}.${classes}`;
  }
  
  return tag;
}

// Initialize
function init() {
  console.log('[PlsFix Content] Initializing...');
  createOverlayContainer();
  setupMessageListener();
  
  // Auto-enable edit mode when loaded via fixable link
  const config = (window as unknown as { __PLSFIX_CONFIG__?: { shortCode: string } }).__PLSFIX_CONFIG__;
  if (config?.shortCode) {
    console.log('[PlsFix Content] Loaded via fixable link:', config.shortCode);
    // Wait for panel to be ready
    setTimeout(() => enableEditMode(), 500);
  }
  
  sendMessage('PLSFIX_READY', { ready: true });
}

// Create overlay container for selection highlights
function createOverlayContainer() {
  if (overlayContainer) return;

  overlayContainer = document.createElement('div');
  overlayContainer.id = 'plsfix-overlay-container';
  overlayContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2147483646;
  `;
  document.body.appendChild(overlayContainer);

  // Create hover overlay
  hoverOverlay = document.createElement('div');
  hoverOverlay.id = 'plsfix-hover-overlay';
  hoverOverlay.style.cssText = `
    position: absolute;
    border: 2px dashed #3B82F6;
    background-color: rgba(59, 130, 246, 0.05);
    pointer-events: none;
    display: none;
    transition: all 0.1s ease;
    border-radius: 4px;
  `;
  overlayContainer.appendChild(hoverOverlay);

  // Create selected overlay
  selectedOverlay = document.createElement('div');
  selectedOverlay.id = 'plsfix-selected-overlay';
  selectedOverlay.style.cssText = `
    position: absolute;
    border: 2px solid #3B82F6;
    background-color: rgba(59, 130, 246, 0.05);
    pointer-events: none;
    display: none;
    border-radius: 4px;
  `;
  overlayContainer.appendChild(selectedOverlay);

  // Create edit tooltip
  editTooltip = document.createElement('div');
  editTooltip.id = 'plsfix-edit-tooltip';
  editTooltip.innerHTML = `
    <span style="display: flex; align-items: center; gap: 4px;">
      Edit with AI
      <span style="opacity: 0.7; font-size: 10px;">⌘+K</span>
    </span>
  `;
  editTooltip.style.cssText = `
    position: absolute;
    background-color: #130F18;
    color: white;
    padding: 6px 10px;
    border-radius: 6px;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
    font-size: 12px;
    font-weight: 500;
    display: none;
    pointer-events: auto;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    white-space: nowrap;
  `;
  overlayContainer.appendChild(editTooltip);
}

// Setup message listener for postMessage
function setupMessageListener() {
  window.addEventListener('message', (event: MessageEvent) => {
    const message = event.data as PlsFixMessage;
    
    // Only handle messages from plsfix-panel
    if (!message?.type || message.source !== 'plsfix-panel') return;
    
    console.log('[PlsFix Content] Received message:', message.type);
    
    switch (message.type) {
      case 'TOGGLE_EDIT_MODE': {
        const { enabled } = message.payload as { enabled: boolean };
        if (enabled) {
          enableEditMode();
        } else {
          disableEditMode();
        }
        break;
      }

      case 'APPLY_STYLE': {
        const { elementId, styles } = message.payload as { elementId: string; styles: Partial<ComputedStyleInfo> };
        applyStyle(elementId, styles as Record<string, string>);
        break;
      }

      case 'APPLY_TEXT': {
        const { elementId, text } = message.payload as { elementId: string; text: string };
        applyText(elementId, text);
        break;
      }

      case 'REVERT_CHANGE': {
        const { changeId } = message.payload as { changeId: string };
        revertChange(changeId);
        break;
      }
    }
  });
}

// Enable edit mode
function enableEditMode() {
  if (isEditModeEnabled) return;
  isEditModeEnabled = true;
  
  console.log('[PlsFix Content] Edit mode enabled');

  document.addEventListener('mouseover', handleMouseOver, true);
  document.addEventListener('mouseout', handleMouseOut, true);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('dblclick', handleDoubleClick, true);
  document.addEventListener('keydown', handleKeyDown, true);
  
  // Add body class for styling
  document.body.classList.add('plsfix-edit-mode');
}

// Disable edit mode
function disableEditMode() {
  if (!isEditModeEnabled) return;
  isEditModeEnabled = false;
  
  console.log('[PlsFix Content] Edit mode disabled');

  document.removeEventListener('mouseover', handleMouseOver, true);
  document.removeEventListener('mouseout', handleMouseOut, true);
  document.removeEventListener('click', handleClick, true);
  document.removeEventListener('dblclick', handleDoubleClick, true);
  document.removeEventListener('keydown', handleKeyDown, true);

  clearSelection();
  hideHoverOverlay();
  
  document.body.classList.remove('plsfix-edit-mode');
}

// Handle mouse over
function handleMouseOver(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!isValidElement(target)) return;

  hoveredElement = target;
  showHoverOverlay(target);
}

// Handle mouse out
function handleMouseOut(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (target === hoveredElement) {
    hoveredElement = null;
    hideHoverOverlay();
  }
}

// Handle click
function handleClick(e: MouseEvent) {
  const target = e.target as HTMLElement;

  // Ignore clicks on our own UI
  if (target.closest('#plsfix-overlay-container') || target.closest('#plsfix-panel-root')) return;

  if (!isValidElement(target)) return;

  e.preventDefault();
  e.stopPropagation();

  selectElement(target);
}

// Handle double click for inline editing
function handleDoubleClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!isValidElement(target)) return;
  if (!selectedElement || selectedElement !== target) return;

  e.preventDefault();
  e.stopPropagation();

  enableInlineEditing(target);
}

// Handle keyboard shortcuts
function handleKeyDown(e: KeyboardEvent) {
  // Cmd+K or Ctrl+K for AI edit
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    console.log('[PlsFix Content] AI Edit triggered');
    // TODO: Trigger AI edit modal
  }

  // Escape to deselect
  if (e.key === 'Escape') {
    clearSelection();
  }
}

// Check if element is valid for selection
function isValidElement(element: HTMLElement): boolean {
  if (!element || !element.tagName) return false;

  // Skip our own elements
  if (element.closest('#plsfix-overlay-container') || element.closest('#plsfix-panel-root')) return false;

  // Skip invisible elements
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') return false;

  // Skip script, style, etc.
  const skipTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH', 'META', 'LINK', 'HEAD', 'HTML'];
  if (skipTags.includes(element.tagName)) return false;

  return true;
}

// Select an element
function selectElement(element: HTMLElement) {
  // Clear previous selection
  if (selectedElement && selectedElement !== element) {
    selectedElement.removeAttribute('data-plsfix-selected');
  }

  selectedElement = element;

  // Generate or get element ID
  let elementId = element.getAttribute('data-plsfix-id');
  if (!elementId) {
    elementId = generateId();
    element.setAttribute('data-plsfix-id', elementId);
    elementIdMap.set(elementId, element);

    // Store original state
    const computedStyle = window.getComputedStyle(element);
    originalStates.set(elementId, {
      textContent: element.textContent || '',
      styles: {
        color: computedStyle.color,
        backgroundColor: computedStyle.backgroundColor,
        fontSize: computedStyle.fontSize,
        fontWeight: computedStyle.fontWeight,
        fontFamily: computedStyle.fontFamily,
        textAlign: computedStyle.textAlign,
        fontStyle: computedStyle.fontStyle,
        textDecoration: computedStyle.textDecoration,
        width: computedStyle.width,
        height: computedStyle.height,
        paddingTop: computedStyle.paddingTop,
        paddingRight: computedStyle.paddingRight,
        paddingBottom: computedStyle.paddingBottom,
        paddingLeft: computedStyle.paddingLeft,
        marginTop: computedStyle.marginTop,
        marginRight: computedStyle.marginRight,
        marginBottom: computedStyle.marginBottom,
        marginLeft: computedStyle.marginLeft,
      },
    });
  }

  element.setAttribute('data-plsfix-selected', 'true');
  showSelectedOverlay(element);
  showEditTooltip(element);
  hideHoverOverlay();

  // Send to panel
  const elementInfo = createElementInfo(element, elementId);
  sendMessage('ELEMENT_SELECTED', { element: elementInfo });
}

// Clear selection
function clearSelection() {
  if (selectedElement) {
    selectedElement.removeAttribute('data-plsfix-selected');
    selectedElement = null;
  }
  hideSelectedOverlay();
  hideEditTooltip();
  sendMessage('ELEMENT_DESELECTED', {});
}

// Show hover overlay
function showHoverOverlay(element: HTMLElement) {
  if (!hoverOverlay || element === selectedElement) return;

  const rect = element.getBoundingClientRect();
  hoverOverlay.style.left = `${rect.left}px`;
  hoverOverlay.style.top = `${rect.top}px`;
  hoverOverlay.style.width = `${rect.width}px`;
  hoverOverlay.style.height = `${rect.height}px`;
  hoverOverlay.style.display = 'block';
}

// Hide hover overlay
function hideHoverOverlay() {
  if (hoverOverlay) {
    hoverOverlay.style.display = 'none';
  }
}

// Show selected overlay
function showSelectedOverlay(element: HTMLElement) {
  if (!selectedOverlay) return;

  const rect = element.getBoundingClientRect();
  selectedOverlay.style.left = `${rect.left}px`;
  selectedOverlay.style.top = `${rect.top}px`;
  selectedOverlay.style.width = `${rect.width}px`;
  selectedOverlay.style.height = `${rect.height}px`;
  selectedOverlay.style.display = 'block';

  // Update position on scroll
  const updatePosition = () => {
    if (!selectedElement) return;
    const newRect = selectedElement.getBoundingClientRect();
    selectedOverlay!.style.left = `${newRect.left}px`;
    selectedOverlay!.style.top = `${newRect.top}px`;
    selectedOverlay!.style.width = `${newRect.width}px`;
    selectedOverlay!.style.height = `${newRect.height}px`;

    if (editTooltip && editTooltip.style.display !== 'none') {
      editTooltip.style.left = `${newRect.left}px`;
      editTooltip.style.top = `${newRect.top - 40}px`;
    }
  };

  window.addEventListener('scroll', updatePosition, true);
  window.addEventListener('resize', updatePosition);
}

// Hide selected overlay
function hideSelectedOverlay() {
  if (selectedOverlay) {
    selectedOverlay.style.display = 'none';
  }
}

// Show edit tooltip
function showEditTooltip(element: HTMLElement) {
  if (!editTooltip) return;

  const rect = element.getBoundingClientRect();
  editTooltip.style.left = `${rect.left}px`;
  editTooltip.style.top = `${rect.top - 40}px`;
  editTooltip.style.display = 'block';
}

// Hide edit tooltip
function hideEditTooltip() {
  if (editTooltip) {
    editTooltip.style.display = 'none';
  }
}

// Enable inline editing
function enableInlineEditing(element: HTMLElement) {
  const originalText = element.textContent || '';
  element.contentEditable = 'true';
  element.focus();

  // Select all text
  const range = document.createRange();
  range.selectNodeContents(element);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);

  const handleBlur = () => {
    element.contentEditable = 'false';
    element.removeEventListener('blur', handleBlur);
    element.removeEventListener('keydown', handleKeyDownInline);

    const newText = element.textContent || '';
    if (newText !== originalText) {
      recordTextChange(element, originalText, newText);
    }
  };

  const handleKeyDownInline = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      element.blur();
    }
    if (e.key === 'Escape') {
      element.textContent = originalText;
      element.blur();
    }
  };

  element.addEventListener('blur', handleBlur);
  element.addEventListener('keydown', handleKeyDownInline);
}

// Apply style to element
function applyStyle(elementId: string, styles: Record<string, string>) {
  const element = elementIdMap.get(elementId);
  if (!element) return;

  const original = originalStates.get(elementId);
  const changedStyles: Record<string, string> = {};

  for (const [key, value] of Object.entries(styles)) {
    const styleObj = element.style as unknown as Record<string, string>;
    changedStyles[key] = styleObj[key] || original?.styles[key] || '';
    styleObj[key] = value;
  }

  // Record change
  recordStyleChange(element, changedStyles, styles);
}

// Apply text to element
function applyText(elementId: string, text: string) {
  const element = elementIdMap.get(elementId);
  if (!element) return;

  const originalText = element.textContent || '';
  element.textContent = text;

  if (text !== originalText) {
    recordTextChange(element, originalText, text);
  }
}

// Record text change
function recordTextChange(element: HTMLElement, original: string, modified: string) {
  const elementId = element.getAttribute('data-plsfix-id') || generateId();

  const change: Change = {
    id: generateId(),
    type: 'text',
    elementId,
    elementTag: element.tagName.toLowerCase(),
    xpath: getXPath(element),
    selector: getSelector(element),
    timestamp: Date.now(),
    original: { textContent: original },
    modified: { textContent: modified },
  };

  sendMessage('CHANGE_RECORDED', { change });

  // Add visual indicator
  element.style.outline = '2px solid #10B981';
  setTimeout(() => {
    element.style.outline = '';
  }, 1000);
}

// Record style change
function recordStyleChange(
  element: HTMLElement,
  original: Record<string, string>,
  modified: Record<string, string>
) {
  const elementId = element.getAttribute('data-plsfix-id') || generateId();

  const change: Change = {
    id: generateId(),
    type: 'style',
    elementId,
    elementTag: element.tagName.toLowerCase(),
    xpath: getXPath(element),
    selector: getSelector(element),
    timestamp: Date.now(),
    original: { styles: original as Partial<ComputedStyleInfo> },
    modified: { styles: modified as Partial<ComputedStyleInfo> },
  };

  sendMessage('CHANGE_RECORDED', { change });
}

// Revert a change
function revertChange(changeId: string) {
  console.log('[PlsFix Content] Reverting change:', changeId);
  // TODO: Implement change revert
}

// Send message to panel via postMessage
function sendMessage(type: string, payload: unknown) {
  const message: PlsFixMessage = {
    type: type as PlsFixMessage['type'],
    source: 'plsfix-content',
    payload,
  };
  
  // Send to parent window (in case we're in an iframe)
  if (window.parent !== window) {
    window.parent.postMessage(message, '*');
  }
  
  // Also send to same window (for the injected panel)
  window.postMessage(message, '*');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export { enableEditMode, disableEditMode };
