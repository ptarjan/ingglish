// Background service worker for Ingglish extension

import type { OutputFormat } from '@ingglish/phonemes';
import { translate, translateSync } from 'ingglish';
import { registerIPA } from '@ingglish/ipa';
import { registerShavian } from '@ingglish/shavian';
import { registerDeseret } from '@ingglish/deseret';

// Register format plugins
registerIPA();
registerShavian();
registerDeseret();

// Track dictionary loading state
let dictionaryLoaded = false;
import type {
  ExtensionMessage,
  StateResponse,
  ToggleResponse,
  FormatResponse,
  TranslateWordsResponse,
} from './types';

// Track which tabs have translation enabled (in-memory cache, backed by storage)
const translatedTabs = new Set<number>();

// Persist translatedTabs to storage (survives service worker suspension on mobile)
async function saveTranslatedTabs(): Promise<void> {
  try {
    await chrome.storage.local.set({ translatedTabs: [...translatedTabs] });
  } catch {
    // Ignore storage errors
  }
}

// Load translatedTabs from storage on startup
async function loadTranslatedTabs(): Promise<void> {
  try {
    const result = await chrome.storage.local.get('translatedTabs');
    if (Array.isArray(result.translatedTabs)) {
      for (const tabId of result.translatedTabs) {
        if (typeof tabId === 'number') {
          translatedTabs.add(tabId);
        }
      }
    }
  } catch {
    // Ignore storage errors
  }
}

// Add a tab to the translated set and persist
function addTranslatedTab(tabId: number): void {
  translatedTabs.add(tabId);
  void saveTranslatedTabs();
}

// Remove a tab from the translated set and persist
function removeTranslatedTab(tabId: number): void {
  translatedTabs.delete(tabId);
  void saveTranslatedTabs();
}

// Translation cache - persists across message calls for fast lookups
// Key: "format:word" (e.g., "ingglish:hello"), Value: translated word
const translationCache = new Map<string, string>();
const MAX_CACHE_SIZE = 50000; // ~2MB assuming avg 40 bytes per entry

// Cache statistics for testing/debugging
export const cacheStats = {
  hits: 0,
  misses: 0,
  size: () => translationCache.size,
  clear: () => {
    translationCache.clear();
    cacheStats.hits = 0;
    cacheStats.misses = 0;
  },
};

// Default format
const DEFAULT_FORMAT: OutputFormat = 'ingglish';

// Get the current format from storage
async function getFormat(): Promise<OutputFormat> {
  try {
    const result = await chrome.storage.sync.get('outputFormat');
    return (result.outputFormat as OutputFormat) ?? DEFAULT_FORMAT;
  } catch {
    return DEFAULT_FORMAT;
  }
}

// Set the format in storage
async function setFormat(format: OutputFormat): Promise<void> {
  await chrome.storage.sync.set({ outputFormat: format });
}

// Update icon based on translation state
function updateIcon(tabId: number, enabled: boolean): void {
  const suffix = enabled ? '' : '-off';
  chrome.action
    .setIcon({
      tabId,
      path: {
        16: `icons/icon16${suffix}.png`,
        48: `icons/icon48${suffix}.png`,
        128: `icons/icon128${suffix}.png`,
      },
    })
    .catch(() => {
      // Tab may have been closed - ignore
    });
}

// Check if we have permission to access a tab
async function hasTabPermission(tabId: number): Promise<boolean> {
  try {
    const tab = await chrome.tabs.get(tabId);
    const url = tab.url;
    if (url === undefined || url === '') {
      return false;
    }
    // Can't inject into chrome:// or chrome-extension:// pages
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
      return false;
    }
    return await chrome.permissions.contains({ origins: [url] });
  } catch {
    return false;
  }
}

// CSS to hide page content while translating (prevents flash of untranslated text)
const HIDE_CSS = `
  body {
    visibility: hidden !important;
  }
  body.ingglish-ready {
    visibility: visible !important;
  }
`;

// Inject the lightweight translation script into a tab
async function injectTranslator(tabId: number, checkPermission = true): Promise<boolean> {
  // Check permission first (skip for popup-initiated actions which use activeTab)
  if (checkPermission) {
    const hasPermission = await hasTabPermission(tabId);
    if (!hasPermission) {
      // eslint-disable-next-line no-console
      console.log('No permission to inject into tab', tabId);
      return false;
    }
  }

  try {
    // First inject CSS to hide content (prevents flash of untranslated text)
    await chrome.scripting.insertCSS({
      target: { tabId },
      css: HIDE_CSS,
    });

    // Then inject the translator script
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content-lite.global.js'],
    });
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to inject translator:', error);
    return false;
  }
}

// Get cached translation or compute and cache it
function getCachedTranslation(word: string, format: OutputFormat): string {
  const cacheKey = `${format}:${word}`;
  const cached = translationCache.get(cacheKey);

  if (cached !== undefined) {
    cacheStats.hits++;
    return cached;
  }

  cacheStats.misses++;
  const translated = translateSync(word, format);

  // Evict oldest entries if cache is full (simple FIFO eviction)
  if (translationCache.size >= MAX_CACHE_SIZE) {
    const firstKey = translationCache.keys().next().value;
    if (typeof firstKey === 'string') {
      translationCache.delete(firstKey);
    }
  }

  translationCache.set(cacheKey, translated);
  return translated;
}

// Translate a batch of words (used by lightweight content script)
function translateWords(words: string[], format: OutputFormat): Record<string, string> {
  if (!dictionaryLoaded) {
    return {};
  }

  const translations: Record<string, string> = {};
  for (const word of words) {
    const lowerWord = word.toLowerCase();
    // Only translate if not already in result (dedup within batch)
    if (!(lowerWord in translations)) {
      translations[lowerWord] = getCachedTranslation(lowerWord, format);
    }
  }
  return translations;
}

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    sender,
    sendResponse: (
      response: StateResponse | ToggleResponse | FormatResponse | TranslateWordsResponse
    ) => void
  ) => {
    if (message.type === 'GET_STATE') {
      // Use sender's tab ID if available (from content script), otherwise query active tab (from popup)
      void (async () => {
        const format = await getFormat();
        if (sender.tab?.id !== undefined) {
          const enabled = translatedTabs.has(sender.tab.id);
          sendResponse({ enabled, format });
          return;
        }
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tabId = tabs[0]?.id;
          if (tabId !== undefined) {
            sendResponse({ enabled: translatedTabs.has(tabId), format });
          } else {
            sendResponse({ enabled: false, format });
          }
        });
      })();
      return true; // Keep channel open for async response
    }

    if (message.type === 'GET_FORMAT') {
      void getFormat().then((format) => {
        sendResponse({ format });
      });
      return true;
    }

    if (message.type === 'SET_FORMAT') {
      void setFormat(message.format).then(() => {
        // Send response first
        sendResponse({ format: message.format });

        // Retranslate all currently translated tabs with the new format
        for (const tabId of translatedTabs) {
          chrome.tabs.sendMessage(tabId, { type: 'RETRANSLATE', format: message.format }, () => {
            // Ignore errors (tab may have been closed or script not injected)
            if (chrome.runtime.lastError) {
              // eslint-disable-next-line no-console
              console.log(`Retranslate message failed for tab ${tabId}`);
            }
          });
        }
      });
      return true;
    }

    if (message.type === 'TRANSLATE_WORDS') {
      // Ensure dictionary is loaded, then translate
      void translate('')
        .then(() => {
          dictionaryLoaded = true;
          const translations = translateWords(message.words, message.format);
          sendResponse({ translations });
        })
        .catch(() => {
          sendResponse({ translations: {} });
        });
      return true;
    }

    if (message.type === 'TOGGLE') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0]?.id;
        if (tabId === undefined) {
          sendResponse({ success: false, error: 'No active tab' });
          return;
        }

        const wasEnabled = translatedTabs.has(tabId);
        toggleTab(tabId);
        sendResponse({ success: true, enabled: !wasEnabled });
      });
      return true; // Keep channel open for async response
    }

    return false;
  }
);

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  removeTranslatedTab(tabId);
});

// Handle tab updates: restore icon and re-inject translator on navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  const enabled = translatedTabs.has(tabId);

  // Restore icon state (Chrome resets icons on navigation)
  if (changeInfo.status === 'loading' || changeInfo.status === 'complete') {
    updateIcon(tabId, enabled);
  }

  // Re-inject translator on navigation/refresh for enabled tabs
  // Inject as early as possible - when loading starts (covers both navigation and refresh)
  // Skip permission check - just try to inject and handle failure
  if (changeInfo.status === 'loading' && enabled) {
    void injectTranslator(tabId, false).then((success) => {
      if (!success) {
        // Injection failed (no permission for new URL) - disable translation
        removeTranslatedTab(tabId);
        updateIcon(tabId, false);
      }
    });
  }
});

// Toggle translation for a specific tab
function toggleTab(tabId: number): void {
  const isEnabled = translatedTabs.has(tabId);

  if (isEnabled) {
    // Disable translation - restore original text
    removeTranslatedTab(tabId);
    updateIcon(tabId, false);

    chrome.tabs.sendMessage(tabId, { type: 'RESTORE' }, () => {
      if (chrome.runtime.lastError) {
        // eslint-disable-next-line no-console
        console.log('Restore message failed, page may need refresh');
      }
    });
  } else {
    // Enable translation - inject script and translate
    // Keyboard shortcuts grant activeTab permission, so skip permission check
    addTranslatedTab(tabId);
    updateIcon(tabId, true);

    void injectTranslator(tabId, false).then((success) => {
      if (!success) {
        removeTranslatedTab(tabId);
        updateIcon(tabId, false);
      }
    });
  }
}

// Handle keyboard shortcut (Ctrl+Shift+I / Cmd+Shift+I)
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-translation') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId !== undefined) {
        toggleTab(tabId);
      }
    });
  }
});

// Load persisted state and pre-load dictionary on service worker startup
void (async () => {
  // Restore translated tabs from storage (important for mobile where service worker suspends)
  await loadTranslatedTabs();

  // Pre-load dictionary for faster translations
  await translate('');
  dictionaryLoaded = true;
  // eslint-disable-next-line no-console
  console.log('Ingglish: Dictionary loaded in background');
})();

// eslint-disable-next-line no-console
console.log('Ingglish background service worker loaded');
