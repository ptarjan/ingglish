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

// Inject the translation script into a tab
async function injectTranslator(tabId: number): Promise<boolean> {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.global.js'],
    });
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to inject translator:', error);
    return false;
  }
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
        const enabled = translatedTabs.has(sender.tab.id);
        sendResponse({ enabled });
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
          // Enable translation - inject script and translate
          translatedTabs.add(tabId);
          updateIcon(tabId, true);

          // Inject the translator script (async, don't block response)
          void injectTranslator(tabId).then((success) => {
            if (!success) {
              translatedTabs.delete(tabId);
              updateIcon(tabId, false);
            }
          });

          sendResponse({ success: true, enabled: true });
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

// Handle tab updates: restore icon and re-inject translator on navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  const enabled = translatedTabs.has(tabId);

  // Restore icon state (Chrome resets icons on navigation)
  if (changeInfo.status === 'loading' || changeInfo.status === 'complete') {
    updateIcon(tabId, enabled);
  }

  // Re-inject translator when page finishes loading on enabled tabs
  if (changeInfo.status === 'complete' && enabled) {
    void injectTranslator(tabId);
  }
});

// eslint-disable-next-line no-console
console.log('Ingglish background service worker loaded');
