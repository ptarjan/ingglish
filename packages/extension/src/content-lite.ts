// Lightweight content script for Ingglish extension
// Uses message passing to background for translations and shared DOM utilities

import type { OutputFormat } from '@ingglish/core';
import { detectCasePattern, applyCasePattern } from '@ingglish/normalize';
import {
  applyTranslationsMap,
  restoreDOM,
  collectTextNodes,
  extractWordsFromNodes,
  injectTooltipStyles,
  injectTooltipBehavior,
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

// Check if extension context is still valid (not invalidated by extension reload)
function isContextValid(): boolean {
  try {
    return chrome.runtime?.id !== undefined;
  } catch {
    return false;
  }
}

// Show a message when the extension context is invalidated
function showContextInvalidMessage(): void {
  // Only show once
  if (document.getElementById('ingglish-refresh-notice')) {
    return;
  }

  const notice = document.createElement('div');
  notice.id = 'ingglish-refresh-notice';
  notice.innerHTML =
    'Ingglish extension was updated. <a href="#" style="color: white; text-decoration: underline;">Refresh page</a> to continue translating.';
  notice.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #ef4444;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    max-width: 300px;
  `;

  notice.querySelector('a')?.addEventListener('click', (e) => {
    e.preventDefault();
    location.reload();
  });

  document.body?.appendChild(notice);
}

// Request batch translation from background script
async function translateWordsBatch(
  words: string[],
  format: OutputFormat
): Promise<Record<string, string>> {
  if (!isContextValid()) {
    // eslint-disable-next-line no-console
    console.log('Ingglish: Extension context invalidated, please refresh the page');
    showContextInvalidMessage();
    return {};
  }

  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(
        { type: 'TRANSLATE_WORDS', words, format },
        (response: TranslateWordsResponse | undefined) => {
          if (chrome.runtime.lastError) {
            // Context was invalidated during the call
            resolve({});
            return;
          }
          resolve(response?.translations ?? {});
        }
      );
    } catch {
      // Extension context invalidated
      resolve({});
    }
  });
}

// Get output format from background
async function getOutputFormat(): Promise<OutputFormat> {
  if (!isContextValid()) {
    return 'ingglish';
  }

  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ type: 'GET_FORMAT' }, (response: FormatResponse | undefined) => {
        if (chrome.runtime.lastError) {
          resolve('ingglish');
          return;
        }
        resolve(response?.format ?? 'ingglish');
      });
    } catch {
      resolve('ingglish');
    }
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

// Wait for document.body to be available
async function waitForBody(): Promise<void> {
  if (document.body !== null) {
    return;
  }
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (document.body !== null) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(document.documentElement, { childList: true });
  });
}

// Core translation logic shared by translatePage and retranslatePage
async function performTranslation(format: OutputFormat): Promise<void> {
  await waitForBody();

  const perf = {
    start: performance.now(),
    collectNodes: 0,
    extractWords: 0,
    fetchTranslations: 0,
    applyDOM: 0,
    total: 0,
  };

  injectTooltipStyles(document);
  injectTooltipBehavior(document);

  const collectStart = performance.now();
  const textNodes = collectTextNodes(document.body, EXTENSION_SKIP_TAGS, DEFAULT_SKIP_CLASSES);
  perf.collectNodes = performance.now() - collectStart;

  if (textNodes.length === 0) {
    // eslint-disable-next-line no-console
    console.log('Ingglish: No text nodes found');
    return;
  }

  const extractStart = performance.now();
  const uniqueWords = extractWordsFromNodes(textNodes);
  perf.extractWords = performance.now() - extractStart;

  const fetchStart = performance.now();
  const translations = await translateWordsInBatches(uniqueWords, format);
  perf.fetchTranslations = performance.now() - fetchStart;

  const applyStart = performance.now();
  await applyTranslationsMap(document.body, translations, {
    showTooltips: true,
    textNodes, // Pass pre-collected nodes to avoid re-traversing DOM
  });
  perf.applyDOM = performance.now() - applyStart;

  // Reveal the page now that translation is complete (CSS hides body until this class is added)
  document.body.classList.add('ingglish-ready');

  state.translated = true;
  addTranslationBadge(format);

  perf.total = performance.now() - perf.start;

  // eslint-disable-next-line no-console
  console.log(
    `Ingglish Performance:\n` +
      `  Nodes: ${textNodes.length}, Words: ${uniqueWords.length}\n` +
      `  Collect nodes:      ${perf.collectNodes.toFixed(1)}ms\n` +
      `  Extract words:      ${perf.extractWords.toFixed(1)}ms\n` +
      `  Fetch translations: ${perf.fetchTranslations.toFixed(1)}ms\n` +
      `  Apply to DOM:       ${perf.applyDOM.toFixed(1)}ms\n` +
      `  Total:              ${perf.total.toFixed(1)}ms`
  );

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

  // Debounce and batch mutations to avoid overwhelming the browser
  let pendingNodes: Text[] = [];
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let isProcessing = false;

  async function processPendingNodes(): Promise<void> {
    if (isProcessing || pendingNodes.length === 0) {
      return;
    }

    isProcessing = true;
    const nodesToProcess = pendingNodes;
    pendingNodes = [];

    // Yield to browser first
    await new Promise((r) => requestAnimationFrame(r));

    // Get new words that aren't already translated
    const newWords = extractWordsFromNodes(nodesToProcess).filter(
      (word) => !(word in translations)
    );

    if (newWords.length > 0) {
      const newTranslations = await translateWordsBatch([...new Set(newWords)], format);
      Object.assign(translations, newTranslations);
    }

    // Apply translations in chunks with RAF
    const CHUNK_SIZE = 20;
    for (let i = 0; i < nodesToProcess.length; i += CHUNK_SIZE) {
      const chunk = nodesToProcess.slice(i, i + CHUNK_SIZE);
      for (const textNode of chunk) {
        const parent = textNode.parentElement;
        if (parent && !parent.closest('.ingglish-word')) {
          // Direct text replacement to avoid re-traversing
          await applyTranslationsMap(parent, translations, {
            showTooltips: true,
            textNodes: [textNode],
          });
        }
      }
      // Yield between chunks
      if (i + CHUNK_SIZE < nodesToProcess.length) {
        await new Promise((r) => requestAnimationFrame(r));
      }
    }

    isProcessing = false;

    // Process any nodes that accumulated while we were working
    if (pendingNodes.length > 0) {
      void processPendingNodes();
    }
  }

  state.observer = new MutationObserver((mutations) => {
    // Stop observing if extension context is invalidated
    if (!isContextValid()) {
      state.observer?.disconnect();
      state.observer = null;
      showContextInvalidMessage();
      return;
    }

    // Collect new nodes (Array.from needed for TypeScript type safety)
    for (const mutation of mutations) {
      const nodes: Node[] = Array.from(mutation.addedNodes);
      for (const node of nodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = (node as Text).textContent?.trim() ?? '';
          if (text.length > 0) {
            pendingNodes.push(node as Text);
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const collected = collectTextNodes(
            node as Element,
            EXTENSION_SKIP_TAGS,
            DEFAULT_SKIP_CLASSES
          );
          pendingNodes.push(...collected);
        }
      }
    }

    // Debounce processing (wait for mutations to settle)
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      void processPendingNodes();
    }, 100); // 100ms debounce
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

  // Remove badge (keep ingglish-ready class so page stays visible with injected CSS)
  document.getElementById('ingglish-badge')?.remove();

  state.translated = false;
  // eslint-disable-next-line no-console
  console.log('Ingglish: Restoration complete!');
}

// Retranslate page with a new format (in-place update, much faster than restore + re-translate)
async function retranslatePage(format: OutputFormat): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(`Ingglish: Retranslating with format: ${format}...`);

  const perf = { start: performance.now(), query: 0, collect: 0, fetch: 0, apply: 0 };

  // Find all translated word spans (yield first to let UI update)
  await new Promise((r) => requestAnimationFrame(r));

  const queryStart = performance.now();
  const wordSpans = document.querySelectorAll('.ingglish-word[data-ingglish-orig]');
  perf.query = performance.now() - queryStart;

  if (wordSpans.length === 0) {
    // No spans found, fall back to full re-translation
    if (state.observer) {
      state.observer.disconnect();
      state.observer = null;
    }
    restoreDOM(document.body);
    document.getElementById('ingglish-badge')?.remove();
    state.translated = false;
    await performTranslation(format);
    return;
  }

  // Convert to array with proper typing
  const spans = Array.from(wordSpans) as HTMLElement[];

  // Yield before heavy work
  await new Promise((r) => requestAnimationFrame(r));

  // Collect unique original words
  const collectStart = performance.now();
  const originalWords = new Set<string>();
  for (const span of spans) {
    const orig = span.getAttribute('data-ingglish-orig');
    if (orig !== null && orig !== '') {
      originalWords.add(orig.toLowerCase());
    }
  }
  perf.collect = performance.now() - collectStart;

  // Fetch new translations
  const fetchStart = performance.now();
  const translations = await translateWordsInBatches([...originalWords], format);
  perf.fetch = performance.now() - fetchStart;

  // Update spans in-place (chunked with RAF to avoid blocking)
  const CHUNK_SIZE = 50; // Small chunks to stay responsive

  await new Promise<void>((resolve) => {
    let index = 0;

    function processChunk(): void {
      const endIndex = Math.min(index + CHUNK_SIZE, spans.length);

      while (index < endIndex) {
        const span = spans[index];
        const orig = span.getAttribute('data-ingglish-orig');
        if (orig !== null && orig !== '') {
          const translated = translations[orig.toLowerCase()];
          if (translated !== undefined) {
            const pattern = detectCasePattern(orig);
            span.textContent = applyCasePattern(translated, pattern, orig);
          }
        }
        index++;
      }

      if (index < spans.length) {
        requestAnimationFrame(processChunk);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(processChunk);
  });

  perf.apply = performance.now() - fetchStart - perf.fetch;

  // Update badge
  const badge = document.getElementById('ingglish-badge');
  if (badge) {
    badge.textContent = format === 'ingglish' ? 'Ingglish' : 'IPA';
  }

  // Update observer with new translations
  if (state.observer) {
    state.observer.disconnect();
    state.observer = null;
  }
  setupObserver(format, translations);

  const total = performance.now() - perf.start;
  // eslint-disable-next-line no-console
  console.log(
    `Ingglish Format Switch:\n` +
      `  Spans: ${spans.length}, Unique words: ${originalWords.size}\n` +
      `  Query DOM:    ${perf.query.toFixed(1)}ms\n` +
      `  Collect words: ${perf.collect.toFixed(1)}ms\n` +
      `  Fetch:        ${perf.fetch.toFixed(1)}ms\n` +
      `  Apply:        ${perf.apply.toFixed(1)}ms\n` +
      `  Total:        ${total.toFixed(1)}ms`
  );
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

// Translate when DOM is ready
function startTranslation(): void {
  if (!state.translated) {
    void translatePage();
  }
}

// If DOM is already ready, translate immediately; otherwise wait for DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startTranslation);
} else {
  startTranslation();
}
