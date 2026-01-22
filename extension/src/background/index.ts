import { Message } from '../shared/types';

// Enable side panel on action click
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Failed to set panel behavior:', error));

// Track which tabs have edit mode enabled
const editModeTabs = new Set<number>();

// Listen for messages from content script and side panel
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  const tabId = sender.tab?.id;

  switch (message.type) {
    case 'SIDEPANEL_READY':
      // Side panel is ready, enable edit mode on the current tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          enableEditMode(tabs[0].id);
        }
      });
      break;

    case 'TOGGLE_EDIT_MODE':
      if (tabId) {
        if (editModeTabs.has(tabId)) {
          disableEditMode(tabId);
        } else {
          enableEditMode(tabId);
        }
      }
      break;

    case 'ELEMENT_SELECTED':
    case 'ELEMENT_HOVERED':
    case 'ELEMENT_DESELECTED':
    case 'CHANGE_RECORDED':
      // Forward to side panel
      forwardToSidePanel(message);
      break;

    case 'APPLY_STYLE':
    case 'APPLY_TEXT':
    case 'REVERT_CHANGE':
      // Forward to content script
      if (tabId) {
        forwardToContentScript(tabId, message);
      } else {
        // If message is from side panel, get current tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            forwardToContentScript(tabs[0].id, message);
          }
        });
      }
      break;
  }

  sendResponse({ success: true });
  return true;
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete' && editModeTabs.has(tabId)) {
    // Re-inject content script after navigation
    enableEditMode(tabId);
  }
});

// Listen for tab removal
chrome.tabs.onRemoved.addListener((tabId) => {
  editModeTabs.delete(tabId);
});

/**
 * Enable edit mode on a tab
 */
async function enableEditMode(tabId: number) {
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'TOGGLE_EDIT_MODE', payload: { enabled: true } });
    editModeTabs.add(tabId);
  } catch (error) {
    // Content script not loaded yet, that's okay
    console.log('Content script not ready yet');
  }
}

/**
 * Disable edit mode on a tab
 */
async function disableEditMode(tabId: number) {
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'TOGGLE_EDIT_MODE', payload: { enabled: false } });
    editModeTabs.delete(tabId);
  } catch (error) {
    console.error('Failed to disable edit mode:', error);
  }
}

/**
 * Forward message to side panel
 */
function forwardToSidePanel(message: Message) {
  chrome.runtime.sendMessage(message).catch(() => {
    // Side panel might not be open, that's okay
  });
}

/**
 * Forward message to content script
 */
async function forwardToContentScript(tabId: number, message: Message) {
  try {
    await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    console.error('Failed to forward message to content script:', error);
  }
}

// Export for module
export {};
