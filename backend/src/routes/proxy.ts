import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import path from 'path';
import fs from 'fs';

export const proxyRouter = Router();

const WEBAPP_URL = process.env.WEBAPP_URL || 'http://localhost:5173';
const IS_DEV = process.env.NODE_ENV !== 'production';

// Rewrite relative URLs to absolute
function rewriteUrls(html: string, baseUrl: string): string {
  const base = new URL(baseUrl);
  const baseOrigin = base.origin;
  const basePath = base.pathname.replace(/\/[^/]*$/, '/');

  // Rewrite href attributes
  html = html.replace(
    /(<[^>]+\s)(href=["'])(?!(?:https?:|mailto:|tel:|javascript:|#|data:))([^"']+)(["'])/gi,
    (match, prefix, attr, url, quote) => {
      if (url.startsWith('//')) {
        return `${prefix}${attr}${base.protocol}${url}${quote}`;
      }
      if (url.startsWith('/')) {
        return `${prefix}${attr}${baseOrigin}${url}${quote}`;
      }
      return `${prefix}${attr}${baseOrigin}${basePath}${url}${quote}`;
    }
  );

  // Rewrite src attributes
  html = html.replace(
    /(<[^>]+\s)(src=["'])(?!(?:https?:|data:|blob:))([^"']+)(["'])/gi,
    (match, prefix, attr, url, quote) => {
      if (url.startsWith('//')) {
        return `${prefix}${attr}${base.protocol}${url}${quote}`;
      }
      if (url.startsWith('/')) {
        return `${prefix}${attr}${baseOrigin}${url}${quote}`;
      }
      return `${prefix}${attr}${baseOrigin}${basePath}${url}${quote}`;
    }
  );

  // Rewrite srcset attributes
  html = html.replace(
    /(<[^>]+\s)(srcset=["'])([^"']+)(["'])/gi,
    (match, prefix, attr, srcset, quote) => {
      const rewrittenSrcset = srcset
        .split(',')
        .map((src: string) => {
          const parts = src.trim().split(/\s+/);
          let url = parts[0];
          const descriptor = parts.slice(1).join(' ');
          
          if (!url.match(/^(?:https?:|data:|blob:)/i)) {
            if (url.startsWith('//')) {
              url = `${base.protocol}${url}`;
            } else if (url.startsWith('/')) {
              url = `${baseOrigin}${url}`;
            } else {
              url = `${baseOrigin}${basePath}${url}`;
            }
          }
          return descriptor ? `${url} ${descriptor}` : url;
        })
        .join(', ');
      return `${prefix}${attr}${rewrittenSrcset}${quote}`;
    }
  );

  // Rewrite CSS url() references in style tags and attributes
  html = html.replace(
    /url\(["']?(?!(?:https?:|data:|blob:))([^"')]+)["']?\)/gi,
    (match, url) => {
      if (url.startsWith('//')) {
        return `url("${base.protocol}${url}")`;
      }
      if (url.startsWith('/')) {
        return `url("${baseOrigin}${url}")`;
      }
      return `url("${baseOrigin}${basePath}${url}")`;
    }
  );

  // Add base tag if not present (helps with remaining relative URLs)
  if (!html.includes('<base')) {
    html = html.replace(
      /<head([^>]*)>/i,
      `<head$1><base href="${baseOrigin}${basePath}">`
    );
  }

  return html;
}

// Generate the injection script with inline panel
function getInjectionScript(shortCode: string): string {
  const config = {
    shortCode,
    apiUrl: process.env.BACKEND_URL || 'http://localhost:3001',
    webappUrl: WEBAPP_URL,
    isProxied: true
  };

  // Fully self-contained injection - no external dependencies needed
  return `
<script>
  window.__PLSFIX_CONFIG__ = ${JSON.stringify(config)};
</script>

<style>
  /* PlsFix Edit Mode Styles */
  body.plsfix-edit-mode { cursor: crosshair; }
  body.plsfix-edit-mode * { cursor: crosshair !important; }
  [data-plsfix-selected="true"] { outline: 2px solid #3B82F6 !important; outline-offset: 2px; }
  [contenteditable="true"] { outline: 2px solid #10B981 !important; outline-offset: 2px; cursor: text !important; }
  
  /* Panel Styles */
  .plsfix-panel {
    position: fixed;
    top: 0;
    right: 0;
    width: 380px;
    height: 100vh;
    background: white;
    border-left: 1px solid #e5e7eb;
    box-shadow: -4px 0 20px rgba(0,0,0,0.1);
    z-index: 2147483647;
    display: flex;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
    transition: transform 0.3s ease;
  }
  .plsfix-panel.closed { transform: translateX(100%); }
  .plsfix-panel-header {
    padding: 12px 16px;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .plsfix-panel-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 14px;
    color: #130F18;
  }
  .plsfix-panel-close {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: none;
    background: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #646464;
    font-size: 18px;
  }
  .plsfix-panel-close:hover { background: #f3f4f6; color: #130F18; }
  .plsfix-panel-tabs {
    display: flex;
    border-bottom: 1px solid #e5e7eb;
  }
  .plsfix-panel-tab {
    flex: 1;
    padding: 10px 12px;
    font-size: 12px;
    font-weight: 500;
    color: #646464;
    border: none;
    background: none;
    cursor: pointer;
    border-bottom: 2px solid transparent;
  }
  .plsfix-panel-tab:hover { color: #130F18; background: #f9fafb; }
  .plsfix-panel-tab.active { color: #130F18; border-bottom-color: #10B981; }
  .plsfix-panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }
  .plsfix-empty {
    text-align: center;
    padding: 40px 20px;
    color: #646464;
  }
  .plsfix-empty-icon { font-size: 32px; margin-bottom: 12px; opacity: 0.5; }
  .plsfix-empty-text { font-size: 13px; line-height: 1.5; }
  .plsfix-section { margin-bottom: 20px; }
  .plsfix-section-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    color: #9ca3af;
    margin-bottom: 8px;
    letter-spacing: 0.5px;
  }
  .plsfix-input {
    width: 100%;
    padding: 8px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 12px;
    font-family: inherit;
    resize: vertical;
    min-height: 60px;
  }
  .plsfix-input:focus { outline: none; border-color: #3B82F6; box-shadow: 0 0 0 2px rgba(59,130,246,0.1); }
  .plsfix-prop-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .plsfix-prop-item { display: flex; flex-direction: column; gap: 4px; }
  .plsfix-prop-label { font-size: 11px; color: #646464; }
  .plsfix-prop-input {
    padding: 6px 8px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 12px;
    font-family: inherit;
  }
  .plsfix-prop-input:focus { outline: none; border-color: #3B82F6; }
  .plsfix-toggle {
    position: fixed;
    top: 50%;
    right: 380px;
    transform: translateY(-50%);
    width: 36px;
    height: 72px;
    background: #10B981;
    border: none;
    border-radius: 8px 0 0 8px;
    cursor: pointer;
    color: white;
    font-size: 18px;
    z-index: 2147483647;
    transition: right 0.3s ease;
  }
  .plsfix-toggle.closed { right: 0; }
  .plsfix-toggle:hover { background: #059669; }
  .plsfix-change {
    padding: 12px;
    background: #f9fafb;
    border-radius: 8px;
    margin-bottom: 8px;
  }
  .plsfix-change-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .plsfix-change-type {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 4px;
  }
  .plsfix-change-type.text { background: rgba(16,185,129,0.1); color: #10B981; }
  .plsfix-change-type.style { background: rgba(59,130,246,0.1); color: #3B82F6; }
  .plsfix-change-element { font-size: 12px; color: #646464; font-family: monospace; }
</style>

<script>
(function() {
  'use strict';
  
  const config = window.__PLSFIX_CONFIG__;
  let isOpen = true;
  let activeTab = 'design';
  let selectedElement = null;
  let changes = [];
  
  // Create panel HTML
  function createPanel() {
    const panel = document.createElement('div');
    panel.id = 'plsfix-panel-root';
    panel.innerHTML = getToggleHTML() + getPanelHTML();
    document.body.appendChild(panel);
    
    // Add event listeners
    document.getElementById('plsfix-toggle').addEventListener('click', togglePanel);
    document.getElementById('plsfix-close').addEventListener('click', () => { isOpen = false; updatePanel(); });
    document.querySelectorAll('.plsfix-panel-tab').forEach(tab => {
      tab.addEventListener('click', () => { activeTab = tab.dataset.tab; updatePanel(); });
    });
    
    // Listen for element selection messages
    window.addEventListener('message', handleMessage);
    
    console.log('[PlsFix] Panel initialized');
  }
  
  function getToggleHTML() {
    return '<button id="plsfix-toggle" class="plsfix-toggle' + (isOpen ? '' : ' closed') + '">' + (isOpen ? '→' : '←') + '</button>';
  }
  
  function getPanelHTML() {
    return '<div class="plsfix-panel' + (isOpen ? '' : ' closed') + '">' +
      '<div class="plsfix-panel-header">' +
        '<div class="plsfix-panel-logo"><span>🔧</span><span>plsfix</span></div>' +
        '<button id="plsfix-close" class="plsfix-panel-close">×</button>' +
      '</div>' +
      '<div class="plsfix-panel-tabs">' +
        '<button class="plsfix-panel-tab' + (activeTab === 'design' ? ' active' : '') + '" data-tab="design">Design</button>' +
        '<button class="plsfix-panel-tab' + (activeTab === 'changes' ? ' active' : '') + '" data-tab="changes">Changes' + (changes.length > 0 ? ' (' + changes.length + ')' : '') + '</button>' +
        '<button class="plsfix-panel-tab' + (activeTab === 'pr' ? ' active' : '') + '" data-tab="pr">PR</button>' +
        '<button class="plsfix-panel-tab' + (activeTab === 'ai' ? ' active' : '') + '" data-tab="ai">AI</button>' +
      '</div>' +
      '<div class="plsfix-panel-content">' + getTabContent() + '</div>' +
    '</div>';
  }
  
  function getTabContent() {
    if (activeTab === 'design') {
      if (!selectedElement) {
        return '<div class="plsfix-empty"><div class="plsfix-empty-icon">👆</div><p class="plsfix-empty-text">Click on any element on the page to select it and start editing</p></div>';
      }
      return getDesignContent();
    }
    if (activeTab === 'changes') {
      if (changes.length === 0) {
        return '<div class="plsfix-empty"><div class="plsfix-empty-icon">📝</div><p class="plsfix-empty-text">No changes yet. Start editing elements to see your changes here.</p></div>';
      }
      return getChangesContent();
    }
    if (activeTab === 'pr') {
      return '<div class="plsfix-empty"><div class="plsfix-empty-icon">🔗</div><p class="plsfix-empty-text">Connect a GitHub repository to create pull requests with your changes.</p></div>';
    }
    if (activeTab === 'ai') {
      return '<div class="plsfix-empty"><div class="plsfix-empty-icon">✨</div><p class="plsfix-empty-text">AI-powered code review and suggestions coming soon.</p></div>';
    }
    return '';
  }
  
  function getDesignContent() {
    const el = selectedElement;
    return '<div class="plsfix-section">' +
      '<div class="plsfix-section-title">Selected Element</div>' +
      '<span class="plsfix-change-element">&lt;' + el.tagName + '&gt;</span>' +
    '</div>' +
    '<div class="plsfix-section">' +
      '<div class="plsfix-section-title">Text</div>' +
      '<textarea id="plsfix-text-input" class="plsfix-input" placeholder="Edit text content...">' + (el.textContent || '') + '</textarea>' +
    '</div>' +
    '<div class="plsfix-section">' +
      '<div class="plsfix-section-title">Typography</div>' +
      '<div class="plsfix-prop-grid">' +
        '<div class="plsfix-prop-item"><label class="plsfix-prop-label">Font Size</label><input class="plsfix-prop-input" data-prop="fontSize" value="' + (el.computedStyles?.fontSize || '') + '"></div>' +
        '<div class="plsfix-prop-item"><label class="plsfix-prop-label">Font Weight</label><input class="plsfix-prop-input" data-prop="fontWeight" value="' + (el.computedStyles?.fontWeight || '') + '"></div>' +
        '<div class="plsfix-prop-item"><label class="plsfix-prop-label">Color</label><input class="plsfix-prop-input" data-prop="color" value="' + (el.computedStyles?.color || '') + '"></div>' +
        '<div class="plsfix-prop-item"><label class="plsfix-prop-label">Text Align</label><input class="plsfix-prop-input" data-prop="textAlign" value="' + (el.computedStyles?.textAlign || '') + '"></div>' +
      '</div>' +
    '</div>';
  }
  
  function getChangesContent() {
    return changes.map(function(change) {
      return '<div class="plsfix-change">' +
        '<div class="plsfix-change-header">' +
          '<span class="plsfix-change-type ' + change.type + '">' + change.type + '</span>' +
          '<span class="plsfix-change-element">&lt;' + change.elementTag + '&gt;</span>' +
        '</div>' +
      '</div>';
    }).join('');
  }
  
  function togglePanel() {
    isOpen = !isOpen;
    updatePanel();
  }
  
  function updatePanel() {
    const root = document.getElementById('plsfix-panel-root');
    if (root) {
      root.innerHTML = getToggleHTML() + getPanelHTML();
      
      // Re-add event listeners
      document.getElementById('plsfix-toggle').addEventListener('click', togglePanel);
      document.getElementById('plsfix-close').addEventListener('click', () => { isOpen = false; updatePanel(); });
      document.querySelectorAll('.plsfix-panel-tab').forEach(tab => {
        tab.addEventListener('click', () => { activeTab = tab.dataset.tab; updatePanel(); });
      });
      
      // Add input listeners for design tab
      if (activeTab === 'design' && selectedElement) {
        const textInput = document.getElementById('plsfix-text-input');
        if (textInput) {
          textInput.addEventListener('input', function() {
            sendMessage('APPLY_TEXT', { elementId: selectedElement.id, text: this.value });
          });
        }
        document.querySelectorAll('.plsfix-prop-input').forEach(input => {
          input.addEventListener('blur', function() {
            const prop = this.dataset.prop;
            const styles = {};
            styles[prop] = this.value;
            sendMessage('APPLY_STYLE', { elementId: selectedElement.id, styles: styles });
          });
        });
      }
    }
  }
  
  function handleMessage(event) {
    const msg = event.data;
    if (!msg || !msg.type || msg.source === 'plsfix-panel') return;
    
    if (msg.type === 'ELEMENT_SELECTED') {
      selectedElement = msg.payload.element;
      updatePanel();
    } else if (msg.type === 'ELEMENT_DESELECTED') {
      selectedElement = null;
      updatePanel();
    } else if (msg.type === 'CHANGE_RECORDED') {
      const change = msg.payload.change;
      const existing = changes.findIndex(c => c.elementId === change.elementId && c.type === change.type);
      if (existing >= 0) {
        changes[existing] = change;
      } else {
        changes.push(change);
      }
      updatePanel();
    }
  }
  
  function sendMessage(type, payload) {
    window.postMessage({ type: type, source: 'plsfix-panel', payload: payload }, '*');
  }
  
  // Initialize content script (element selection)
  function initContentScript() {
    let overlayContainer, hoverOverlay, selectedOverlay, editTooltip;
    const elementIdMap = new Map();
    const originalStates = new Map();
    
    function createOverlays() {
      overlayContainer = document.createElement('div');
      overlayContainer.id = 'plsfix-overlay-container';
      overlayContainer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2147483646;';
      document.body.appendChild(overlayContainer);
      
      hoverOverlay = document.createElement('div');
      hoverOverlay.style.cssText = 'position:absolute;border:2px dashed #3B82F6;background:rgba(59,130,246,0.05);pointer-events:none;display:none;border-radius:4px;';
      overlayContainer.appendChild(hoverOverlay);
      
      selectedOverlay = document.createElement('div');
      selectedOverlay.style.cssText = 'position:absolute;border:2px solid #3B82F6;background:rgba(59,130,246,0.05);pointer-events:none;display:none;border-radius:4px;';
      overlayContainer.appendChild(selectedOverlay);
      
      editTooltip = document.createElement('div');
      editTooltip.innerHTML = '<span style="display:flex;align-items:center;gap:4px;">Edit with AI<span style="opacity:0.7;font-size:10px;">⌘+K</span></span>';
      editTooltip.style.cssText = 'position:absolute;background:#130F18;color:white;padding:6px 10px;border-radius:6px;font-size:12px;font-weight:500;display:none;pointer-events:auto;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.15);white-space:nowrap;';
      overlayContainer.appendChild(editTooltip);
    }
    
    function isValidElement(el) {
      if (!el || !el.tagName) return false;
      if (el.closest('#plsfix-overlay-container') || el.closest('#plsfix-panel-root')) return false;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      const skipTags = ['SCRIPT','STYLE','NOSCRIPT','SVG','PATH','META','LINK','HEAD','HTML'];
      return !skipTags.includes(el.tagName);
    }
    
    function generateId() {
      return 'plsfix-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    function getElementInfo(el, id) {
      const cs = window.getComputedStyle(el);
      return {
        id: id,
        tagName: el.tagName.toLowerCase(),
        textContent: (el.textContent || '').trim().slice(0, 100),
        computedStyles: {
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          color: cs.color,
          backgroundColor: cs.backgroundColor,
          textAlign: cs.textAlign,
          paddingTop: cs.paddingTop,
          paddingRight: cs.paddingRight,
          paddingBottom: cs.paddingBottom,
          paddingLeft: cs.paddingLeft
        }
      };
    }
    
    function selectElement(el) {
      let id = el.getAttribute('data-plsfix-id');
      if (!id) {
        id = generateId();
        el.setAttribute('data-plsfix-id', id);
        elementIdMap.set(id, el);
        originalStates.set(id, { textContent: el.textContent || '' });
      }
      el.setAttribute('data-plsfix-selected', 'true');
      
      const rect = el.getBoundingClientRect();
      selectedOverlay.style.left = rect.left + 'px';
      selectedOverlay.style.top = rect.top + 'px';
      selectedOverlay.style.width = rect.width + 'px';
      selectedOverlay.style.height = rect.height + 'px';
      selectedOverlay.style.display = 'block';
      
      editTooltip.style.left = rect.left + 'px';
      editTooltip.style.top = (rect.top - 40) + 'px';
      editTooltip.style.display = 'block';
      
      hoverOverlay.style.display = 'none';
      
      window.postMessage({ type: 'ELEMENT_SELECTED', source: 'plsfix-content', payload: { element: getElementInfo(el, id) } }, '*');
    }
    
    document.addEventListener('mouseover', function(e) {
      const el = e.target;
      if (!isValidElement(el)) return;
      const rect = el.getBoundingClientRect();
      hoverOverlay.style.left = rect.left + 'px';
      hoverOverlay.style.top = rect.top + 'px';
      hoverOverlay.style.width = rect.width + 'px';
      hoverOverlay.style.height = rect.height + 'px';
      hoverOverlay.style.display = 'block';
    }, true);
    
    document.addEventListener('mouseout', function() {
      hoverOverlay.style.display = 'none';
    }, true);
    
    document.addEventListener('click', function(e) {
      const el = e.target;
      if (el.closest('#plsfix-overlay-container') || el.closest('#plsfix-panel-root')) return;
      if (!isValidElement(el)) return;
      e.preventDefault();
      e.stopPropagation();
      document.querySelectorAll('[data-plsfix-selected]').forEach(x => x.removeAttribute('data-plsfix-selected'));
      selectElement(el);
    }, true);
    
    document.addEventListener('dblclick', function(e) {
      const el = e.target;
      if (!el.hasAttribute('data-plsfix-selected')) return;
      e.preventDefault();
      const original = el.textContent;
      el.contentEditable = 'true';
      el.focus();
      el.addEventListener('blur', function onBlur() {
        el.contentEditable = 'false';
        el.removeEventListener('blur', onBlur);
        if (el.textContent !== original) {
          const id = el.getAttribute('data-plsfix-id');
          window.postMessage({ type: 'CHANGE_RECORDED', source: 'plsfix-content', payload: { change: { id: generateId(), type: 'text', elementId: id, elementTag: el.tagName.toLowerCase(), original: { textContent: original }, modified: { textContent: el.textContent } } } }, '*');
        }
      });
    }, true);
    
    window.addEventListener('message', function(e) {
      const msg = e.data;
      if (!msg || !msg.type || msg.source !== 'plsfix-panel') return;
      if (msg.type === 'APPLY_TEXT') {
        const el = elementIdMap.get(msg.payload.elementId);
        if (el) el.textContent = msg.payload.text;
      } else if (msg.type === 'APPLY_STYLE') {
        const el = elementIdMap.get(msg.payload.elementId);
        if (el) Object.assign(el.style, msg.payload.styles);
      }
    });
    
    createOverlays();
    document.body.classList.add('plsfix-edit-mode');
    console.log('[PlsFix] Content script initialized');
  }
  
  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { createPanel(); initContentScript(); });
  } else {
    createPanel();
    initContentScript();
  }
})();
</script>
`;
}

// Proxy endpoint - fetches page and injects scripts
proxyRouter.get('/:shortCode', async (req: Request, res: Response): Promise<void> => {
  try {
    const { shortCode } = req.params;

    // Get the fixable link
    const link = await prisma.fixableLink.findUnique({
      where: { shortCode },
    });

    if (!link) {
      res.status(404).send('Fixable link not found');
      return;
    }

    // Fetch the target page
    const response = await fetch(link.targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      res.status(response.status).send(`Failed to fetch target page: ${response.statusText}`);
      return;
    }

    const contentType = response.headers.get('content-type') || '';
    
    // Only process HTML content
    if (!contentType.includes('text/html')) {
      // For non-HTML content (CSS, JS, images), proxy as-is
      const buffer = await response.arrayBuffer();
      res.set('Content-Type', contentType);
      res.send(Buffer.from(buffer));
      return;
    }

    let html = await response.text();

    // Rewrite relative URLs to absolute
    html = rewriteUrls(html, link.targetUrl);

    // Inject our scripts before </body>
    const injectionScript = getInjectionScript(shortCode);
    
    if (html.includes('</body>')) {
      html = html.replace('</body>', `${injectionScript}</body>`);
    } else if (html.includes('</html>')) {
      html = html.replace('</html>', `${injectionScript}</html>`);
    } else {
      html += injectionScript;
    }

    // Remove X-Frame-Options and CSP headers that might interfere
    res.removeHeader('X-Frame-Options');
    res.removeHeader('Content-Security-Policy');
    
    // Set appropriate headers
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('X-PlsFix-Proxied', 'true');
    
    res.send(html);
  } catch (error) {
    console.error('Error proxying page:', error);
    res.status(500).send('Failed to load page');
  }
});

// Proxy resources (CSS, JS, images) from the target site
proxyRouter.get('/:shortCode/resource', async (req: Request, res: Response): Promise<void> => {
  try {
    const { shortCode } = req.params;
    const resourceUrl = req.query.url as string;

    if (!resourceUrl) {
      res.status(400).send('Resource URL required');
      return;
    }

    const link = await prisma.fixableLink.findUnique({
      where: { shortCode },
    });

    if (!link) {
      res.status(404).send('Fixable link not found');
      return;
    }

    // Validate the resource URL is from the same origin or a CDN
    const targetOrigin = new URL(link.targetUrl).origin;
    
    // Allow same origin and common CDNs
    const allowedOrigins = [
      targetOrigin,
      'https://cdnjs.cloudflare.com',
      'https://unpkg.com',
      'https://cdn.jsdelivr.net',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ];

    if (!allowedOrigins.some(origin => resourceUrl.startsWith(origin))) {
      // Still allow the request but log it
      console.log(`Resource from different origin: ${resourceUrl}`);
    }

    const response = await fetch(resourceUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': link.targetUrl,
      },
    });

    if (!response.ok) {
      res.status(response.status).send('Resource not found');
      return;
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = await response.arrayBuffer();

    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=31536000');
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Error proxying resource:', error);
    res.status(500).send('Failed to load resource');
  }
});
