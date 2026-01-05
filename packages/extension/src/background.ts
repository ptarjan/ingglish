// Background service worker for Ingglish extension

import type { ExtensionMessage, StateResponse, ToggleResponse } from './types';

// Track which tabs have translation enabled
const translatedTabs = new Set<number>();

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender,
    sendResponse: (response: StateResponse | ToggleResponse) => void
  ) => {
    if (message.type === 'GET_STATE') {
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
          void chrome.tabs.reload(tabId);
          sendResponse({ success: true, enabled: false });
        } else {
          // Enable translation
          translatedTabs.add(tabId);

          // Send message to content script
          chrome.tabs.sendMessage(tabId, { type: 'TRANSLATE' }, (_response) => {
            if (chrome.runtime.lastError) {
              // eslint-disable-next-line no-console
              console.error('Error sending message:', chrome.runtime.lastError);
              translatedTabs.delete(tabId);
              sendResponse({ success: false, error: 'Could not communicate with page' });
            } else {
              sendResponse({ success: true, enabled: true });
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

// Clean up when tabs navigate away
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    translatedTabs.delete(tabId);
  }
});

// eslint-disable-next-line no-console
console.log('Ingglish background service worker loaded');
