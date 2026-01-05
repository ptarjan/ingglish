// Background service worker for Inglish extension

// Track which tabs have translation enabled
const translatedTabs = new Set<number>();

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_STATE') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId) {
        sendResponse({ enabled: translatedTabs.has(tabId) });
      } else {
        sendResponse({ enabled: false });
      }
    });
    return true; // Keep channel open for async response
  }

  if (message.type === 'TOGGLE') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) {
        sendResponse({ success: false, error: 'No active tab' });
        return;
      }

      try {
        const isEnabled = translatedTabs.has(tabId);

        if (isEnabled) {
          // Disable translation - reload the page
          translatedTabs.delete(tabId);
          chrome.tabs.reload(tabId);
          sendResponse({ success: true, enabled: false });
        } else {
          // Enable translation
          translatedTabs.add(tabId);

          // Send message to content script
          chrome.tabs.sendMessage(tabId, { type: 'TRANSLATE' }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Error sending message:', chrome.runtime.lastError);
              translatedTabs.delete(tabId);
              sendResponse({ success: false, error: 'Could not communicate with page' });
            } else {
              sendResponse({ success: true, enabled: true });
            }
          });
        }
      } catch (error) {
        console.error('Error toggling translation:', error);
        sendResponse({ success: false, error: 'Unknown error' });
      }
    });
    return true; // Keep channel open for async response
  }
});

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

console.log('Inglish background service worker loaded');
