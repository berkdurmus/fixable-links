/**
 * PlsFix Injectable Entry Point
 * This is the main entry point for the script injected into proxied pages.
 * It initializes the content script and renders the sidepanel.
 */

import './contentScript';
import { renderPanel } from './panel';

// Get config from window (set by proxy injection)
declare global {
  interface Window {
    __PLSFIX_CONFIG__?: {
      shortCode: string;
      apiUrl: string;
      webappUrl: string;
      isProxied: boolean;
    };
  }
}

const config = window.__PLSFIX_CONFIG__;

if (config) {
  console.log('[PlsFix] Initializing with config:', config);
  
  // Render the sidepanel
  renderPanel(config);
} else {
  console.warn('[PlsFix] No config found, running in standalone mode');
}
