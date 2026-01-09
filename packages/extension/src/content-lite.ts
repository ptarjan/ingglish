// Lightweight content script for Ingglish extension
// Uses message passing to background for translations (no dictionary bundled)

import type { OutputFormat } from '@ingglish/core';
import type { RestoreMessage, FormatResponse, TranslateWordsResponse } from './types';

// CSS styles for tooltips
const TOOLTIP_STYLES = `
.ingglish-word {
  position: relative;
  cursor: help;
}

.ingglish-word:hover::after {
  content: attr(data-ingglish-orig);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #333 !important;
  color: #fff !important;
  padding: 4px 8px !important;
  border-radius: 4px !important;
  font-size: 12px !important;
  font-family: system-ui, -apple-system, sans-serif !important;
  line-height: 1.4 !important;
  white-space: nowrap !important;
  z-index: 2147483647 !important;
  pointer-events: none !important;
  opacity: 0;
  animation: ingglish-tooltip-fade-in 0.15s ease-out forwards;
}

.ingglish-word:hover::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent !important;
  border-top-color: #333 !important;
  margin-bottom: -10px !important;
  z-index: 2147483647 !important;
  pointer-events: none !important;
  opacity: 0;
  animation: ingglish-tooltip-fade-in 0.15s ease-out forwards;
}

@keyframes ingglish-tooltip-fade-in {
  to { opacity: 1; }
}
`;

// Tags to skip during translation
const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'IFRAME',
  'OBJECT',
  'EMBED',
  'SVG',
  'MATH',
  'CODE',
  'PRE',
  'TEXTAREA',
  'INPUT',
  'SELECT',
]);

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

// Check if element should be skipped
function shouldSkip(element: Element): boolean {
  if (SKIP_TAGS.has(element.tagName)) {
    return true;
  }
  if (element.hasAttribute('data-ingglish-skip')) {
    return true;
  }
  if (element.classList?.contains('ingglish-word')) {
    return true;
  }
  return false;
}

// Collect all text nodes in the DOM
function collectTextNodes(root: Element): Text[] {
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node: Text): number {
      const text = node.textContent?.trim() ?? '';
      if (text.length === 0) {
        return NodeFilter.FILTER_SKIP;
      }

      let parent = node.parentElement;
      while (parent) {
        if (shouldSkip(parent)) {
          return NodeFilter.FILTER_SKIP;
        }
        parent = parent.parentElement;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }
  return textNodes;
}

// Extract unique words from text
function extractWords(text: string): string[] {
  const normalized = text.replace(/[\u2018\u2019\u02BC]/g, "'");
  const matches = normalized.match(/\b[a-zA-Z']+\b/g) ?? [];
  return [...new Set(matches.map((w) => w.toLowerCase()))];
}

// Apply case transformation
function applyCase(original: string, translated: string): string {
  if (original.length > 1 && original === original.toUpperCase() && /[A-Z]/.test(original)) {
    return translated.toUpperCase();
  }
  if (/^[A-Z]/.test(original) && original.slice(1) === original.slice(1).toLowerCase()) {
    return translated.charAt(0).toUpperCase() + translated.slice(1);
  }
  return translated;
}

// Translate a text node with tooltip spans
function translateTextNode(textNode: Text, translations: Record<string, string>): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const text = textNode.textContent ?? '';
  const normalized = text.replace(/[\u2018\u2019\u02BC]/g, "'");

  // Split into words and non-words
  const tokens = normalized.split(/(\b[a-zA-Z']+\b)/);

  for (const token of tokens) {
    if (!token) {
      continue;
    }

    if (/^[a-zA-Z']+$/.test(token)) {
      const lowerToken = token.toLowerCase();
      const translated = translations[lowerToken];

      if (translated && translated !== token.toLowerCase()) {
        // Word was translated - wrap in tooltip span
        const span = document.createElement('span');
        span.className = 'ingglish-word';
        span.setAttribute('data-ingglish-orig', token);
        span.textContent = applyCase(token, translated);
        fragment.appendChild(span);
      } else {
        // No translation - keep original
        fragment.appendChild(document.createTextNode(token));
      }
    } else {
      // Non-word (punctuation, space, etc.)
      fragment.appendChild(document.createTextNode(token));
    }
  }

  return fragment;
}

// Inject tooltip styles
function injectStyles(): void {
  if (document.getElementById('ingglish-tooltip-styles')) {
    return;
  }
  const style = document.createElement('style');
  style.id = 'ingglish-tooltip-styles';
  style.textContent = TOOLTIP_STYLES;
  document.head?.appendChild(style);
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
  injectStyles();

  // Collect all text nodes
  const textNodes = collectTextNodes(document.body);
  if (textNodes.length === 0) {
    // eslint-disable-next-line no-console
    console.log('Ingglish: No text nodes found');
    return;
  }

  // Extract all unique words
  const allWords: string[] = [];
  for (const node of textNodes) {
    const words = extractWords(node.textContent ?? '');
    allWords.push(...words);
  }
  const uniqueWords = [...new Set(allWords)];

  // eslint-disable-next-line no-console
  console.log(`Ingglish: Translating ${uniqueWords.length} unique words...`);

  // Batch translate all words via background script
  const translations = await translateWordsBatch(uniqueWords, format);

  // Apply translations to DOM
  for (const textNode of textNodes) {
    const parent = textNode.parentElement;
    if (parent && !parent.hasAttribute('data-ingglish-original')) {
      parent.setAttribute('data-ingglish-original', textNode.textContent ?? '');
    }
    const fragment = translateTextNode(textNode, translations);
    textNode.replaceWith(fragment);
  }

  state.translated = true;
  addTranslationBadge(format);

  // eslint-disable-next-line no-console
  console.log('Ingglish: Translation complete!');

  // Set up mutation observer for dynamic content
  setupObserver(format, translations);
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
          const collected = collectTextNodes(node as Element);
          newNodes.push(...collected);
        }
      }
    }

    if (newNodes.length === 0) {
      return;
    }

    // Get new words that aren't already translated
    const newWords: string[] = [];
    for (const node of newNodes) {
      const words = extractWords(node.textContent ?? '');
      for (const word of words) {
        if (!(word in translations)) {
          newWords.push(word);
        }
      }
    }

    // Fetch new translations if needed (fire and forget)
    void (async () => {
      if (newWords.length > 0) {
        const newTranslations = await translateWordsBatch([...new Set(newWords)], format);
        Object.assign(translations, newTranslations);
      }

      // Apply translations
      for (const textNode of newNodes) {
        const parent = textNode.parentElement;
        if (parent && !parent.hasAttribute('data-ingglish-original')) {
          parent.setAttribute('data-ingglish-original', textNode.textContent ?? '');
        }
        const fragment = translateTextNode(textNode, translations);
        textNode.replaceWith(fragment);
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

  // Restore elements with data-ingglish-original
  const elements = Array.from(document.querySelectorAll('[data-ingglish-original]'));
  for (const element of elements) {
    const htmlEl = element as HTMLElement;
    const original = htmlEl.getAttribute('data-ingglish-original');
    if (original !== null) {
      // Replace all child nodes with original text
      htmlEl.textContent = original;
      htmlEl.removeAttribute('data-ingglish-original');
    }
  }

  // Remove badge
  document.getElementById('ingglish-badge')?.remove();

  state.translated = false;
  // eslint-disable-next-line no-console
  console.log('Ingglish: Restoration complete!');
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
    (message: RestoreMessage, _sender, sendResponse: (response: { success: boolean }) => void) => {
      if (message.type === 'RESTORE') {
        restorePage();
        sendResponse({ success: true });
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
