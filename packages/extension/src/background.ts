// Background service worker for Ingglish extension

import type { ExtensionMessage, StateResponse, ToggleResponse } from './types';

// Track which tabs have translation enabled
const translatedTabs = new Set<number>();

// Update icon based on translation state
function updateIcon(tabId: number, enabled: boolean): void {
  const suffix = enabled ? '' : '-off';
  void chrome.action.setIcon({
    tabId,
    path: {
      16: `icons/icon16${suffix}.png`,
      48: `icons/icon48${suffix}.png`,
      128: `icons/icon128${suffix}.png`,
    },
  });
}

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    sender,
    sendResponse: (response: StateResponse | ToggleResponse) => void
  ) => {
    if (message.type === 'GET_STATE') {
      // Use sender's tab ID if available (from content script), otherwise query active tab (from popup)
      if (sender.tab?.id !== undefined) {
        sendResponse({ enabled: translatedTabs.has(sender.tab.id) });
        return false;
      }
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (tabId !== undefined) {
          sendResponse({ enabled: translatedTabs.has(tabId) });
        } else {
          sendResponse({ enabled: false });
        }
      });
      return true; // Keep channel open for async response
    }

    if (message.type === 'TOGGLE') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (tabId === undefined) {
          sendResponse({ success: false, error: 'No active tab' });
          return;
        }

        const isEnabled = translatedTabs.has(tabId);

        if (isEnabled) {
          // Disable translation - reload the page
          translatedTabs.delete(tabId);
          updateIcon(tabId, false);
          sendResponse({ success: true, enabled: false });
          void chrome.tabs.reload(tabId);
        } else {
          // Enable translation - respond immediately, translate async
          translatedTabs.add(tabId);
          updateIcon(tabId, true);
          sendResponse({ success: true, enabled: true });

          // Send message to content script (fire and forget)
          chrome.tabs.sendMessage(tabId, { type: 'TRANSLATE' }, () => {
            // If content script not available, revert state
            if (chrome.runtime.lastError) {
              translatedTabs.delete(tabId);
              updateIcon(tabId, false);
            }
          });
        }
      });
      return true; // Keep channel open for async response
    }

    return false;
  }
);

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  translatedTabs.delete(tabId);
});

// Note: We intentionally don't clear on navigation so translation persists across pages

// eslint-disable-next-line no-console
console.log('Ingglish background service worker loaded');
