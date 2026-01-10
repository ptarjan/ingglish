// Lightweight content script for Ingglish extension
// Uses message passing to background for translations and shared DOM utilities

import type { OutputFormat } from '@ingglish/core';
import {
  applyTranslationsMap,
  restoreDOM,
  collectTextNodes,
  extractWordsFromNodes,
  injectTooltipStyles,
  DEFAULT_SKIP_TAGS,
  DEFAULT_SKIP_CLASSES,
} from '@ingglish/dom';
import type {
  RestoreMessage,
  RetranslateMessage,
  FormatResponse,
  TranslateWordsResponse,
} from './types';

// Additional tags to skip for extension (security-sensitive)
const EXTENSION_SKIP_TAGS = [...DEFAULT_SKIP_TAGS, 'IFRAME', 'OBJECT', 'EMBED', 'SELECT'];

// State management
interface IngglishState {
  injected: boolean;
  translated: boolean;
  observer: MutationObserver | null;
}

function getState(): IngglishState {
  const win = window as { __ingglishStateLite?: IngglishState };
  win.__ingglishStateLite ??= {
    injected: false,
    translated: false,
    observer: null,
  };
  return win.__ingglishStateLite;
}

const state = getState();

// Word batch size for translation requests
const WORD_BATCH_SIZE = 1000;

// Request batch translation from background script
async function translateWordsBatch(
  words: string[],
  format: OutputFormat
): Promise<Record<string, string>> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: 'TRANSLATE_WORDS', words, format },
      (response: TranslateWordsResponse | undefined) => {
        resolve(response?.translations ?? {});
      }
    );
  });
}

// Get output format from background
async function getOutputFormat(): Promise<OutputFormat> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_FORMAT' }, (response: FormatResponse | undefined) => {
      resolve(response?.format ?? 'ingglish');
    });
  });
}

// Translate words in batches to avoid overwhelming the message channel
async function translateWordsInBatches(
  words: string[],
  format: OutputFormat
): Promise<Record<string, string>> {
  const allTranslations: Record<string, string> = {};

  for (let i = 0; i < words.length; i += WORD_BATCH_SIZE) {
    const batch = words.slice(i, i + WORD_BATCH_SIZE);
    const batchTranslations = await translateWordsBatch(batch, format);
    Object.assign(allTranslations, batchTranslations);
  }

  return allTranslations;
}

// Core translation logic shared by translatePage and retranslatePage
async function performTranslation(format: OutputFormat): Promise<void> {
  const startTime = performance.now();
  injectTooltipStyles(document);

  const textNodes = collectTextNodes(document.body, EXTENSION_SKIP_TAGS, DEFAULT_SKIP_CLASSES);
  if (textNodes.length === 0) {
    // eslint-disable-next-line no-console
    console.log('Ingglish: No text nodes found');
    return;
  }

  const uniqueWords = extractWordsFromNodes(textNodes);

  // eslint-disable-next-line no-console
  console.log(
    `Ingglish: Translating ${uniqueWords.length} unique words across ${textNodes.length} nodes...`
  );

  const translations = await translateWordsInBatches(uniqueWords, format);

  await applyTranslationsMap(document.body, translations, {
    showTooltips: true,
    chunkSize: 100,
  });

  state.translated = true;
  addTranslationBadge(format);

  const elapsed = (performance.now() - startTime).toFixed(0);
  // eslint-disable-next-line no-console
  console.log(`Ingglish: Translation complete in ${elapsed}ms!`);

  setupObserver(format, translations);
}

// Main translation function
async function translatePage(): Promise<void> {
  if (state.translated) {
    // eslint-disable-next-line no-console
    console.log('Ingglish: Already translated');
    return;
  }

  // eslint-disable-next-line no-console
  console.log('Ingglish: Starting translation...');

  const format = await getOutputFormat();
  await performTranslation(format);
}

// Observe DOM for dynamic content
function setupObserver(format: OutputFormat, existingTranslations: Record<string, string>): void {
  if (state.observer) {
    return;
  }

  const translations = { ...existingTranslations };

  state.observer = new MutationObserver((mutations) => {
    const newNodes: Text[] = [];

    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = (node as Text).textContent?.trim() ?? '';
          if (text.length > 0) {
            newNodes.push(node as Text);
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const collected = collectTextNodes(
            node as Element,
            EXTENSION_SKIP_TAGS,
            DEFAULT_SKIP_CLASSES
          );
          newNodes.push(...collected);
        }
      }
    }

    if (newNodes.length === 0) {
      return;
    }

    // Get new words that aren't already translated
    const newWords = extractWordsFromNodes(newNodes).filter((word) => !(word in translations));

    // Fetch new translations if needed (fire and forget)
    void (async () => {
      if (newWords.length > 0) {
        const newTranslations = await translateWordsBatch([...new Set(newWords)], format);
        Object.assign(translations, newTranslations);
      }

      // Apply translations to new nodes
      for (const textNode of newNodes) {
        const parent = textNode.parentElement;
        if (parent) {
          // Use shared utility for applying translations
          await applyTranslationsMap(parent, translations, {
            showTooltips: true,
            chunkSize: 10, // Smaller chunks for dynamic content
          });
        }
      }
    })();
  });

  state.observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Restore original text
function restorePage(): void {
  // eslint-disable-next-line no-console
  console.log('Ingglish: Restoring original text...');

  if (state.observer) {
    state.observer.disconnect();
    state.observer = null;
  }

  // Use shared restore utility
  restoreDOM(document.body);

  // Remove badge
  document.getElementById('ingglish-badge')?.remove();

  state.translated = false;
  // eslint-disable-next-line no-console
  console.log('Ingglish: Restoration complete!');
}

// Retranslate page with a new format
async function retranslatePage(format: OutputFormat): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(`Ingglish: Retranslating with format: ${format}...`);

  // First restore to original text
  if (state.observer) {
    state.observer.disconnect();
    state.observer = null;
  }
  restoreDOM(document.body);
  document.getElementById('ingglish-badge')?.remove();
  state.translated = false;

  // Translate with the new format
  await performTranslation(format);
}

function addTranslationBadge(format: OutputFormat): void {
  if (document.getElementById('ingglish-badge')) {
    return;
  }

  const badge = document.createElement('div');
  badge.id = 'ingglish-badge';
  badge.textContent = format === 'ingglish' ? 'Ingglish' : 'IPA';
  badge.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #6366f1, #a855f7);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 600;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    cursor: pointer;
    transition: opacity 0.2s;
  `;

  badge.addEventListener('mouseenter', () => (badge.style.opacity = '0.8'));
  badge.addEventListener('mouseleave', () => (badge.style.opacity = '1'));
  badge.addEventListener('click', () => {
    badge.remove();
  });

  document.body?.appendChild(badge);
}

// Set up message listener (only once)
if (!state.injected) {
  state.injected = true;

  chrome.runtime.onMessage.addListener(
    (
      message: RestoreMessage | RetranslateMessage,
      _sender,
      sendResponse: (response: { success: boolean }) => void
    ) => {
      if (message.type === 'RESTORE') {
        restorePage();
        sendResponse({ success: true });
        return false;
      }
      if (message.type === 'RETRANSLATE') {
        // Only retranslate if currently translated
        if (state.translated) {
          void retranslatePage(message.format).then(() => {
            sendResponse({ success: true });
          });
          return true; // Keep channel open for async response
        }
        sendResponse({ success: false });
        return false;
      }
      return false;
    }
  );

  // eslint-disable-next-line no-console
  console.log('Ingglish: Lightweight content script initialized');
}

// Translate if not yet translated
if (!state.translated) {
  void translatePage();
}
