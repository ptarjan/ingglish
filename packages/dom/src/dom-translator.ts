/**
 * Core DOM translation functionality.
 */
import { translate, translateSync, translateSyncWithMapping } from '@ingglish/core';
import type { DOMTranslatorOptions, OutputFormat } from './types';
import {
  DEFAULT_SKIP_TAGS,
  DEFAULT_SKIP_CLASSES,
  TRANSLATABLE_ATTRIBUTES,
  requireBrowser,
  shouldSkipElement,
  collectTextNodes as collectTextNodesUtil,
  normalizeApostrophes,
  applyCase,
  injectTooltipStyles as injectTooltipStylesUtil,
} from './dom-utils';

// Re-export types and utilities for convenience
export type { DOMTranslatorOptions };
export { skipElement, unskipElement } from './dom-utils';

/**
 * Creates a document fragment with tooltip spans for each translated word.
 * Words get wrapped in spans with data-original attributes for CSS tooltips.
 * Non-word tokens (punctuation, whitespace) are added as text nodes.
 */
function createTooltipFragment(text: string, format: OutputFormat = 'ingglish'): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const tokens = translateSyncWithMapping(text, format);

  for (const token of tokens) {
    if (token.isWord && token.original !== token.translated) {
      // Word that was translated - wrap in tooltip span
      // data-ingglish-orig stores original text AND marks as translated (prevents re-processing)
      const span = document.createElement('span');
      span.className = 'ingglish-word';
      span.setAttribute('data-ingglish-orig', token.original);
      span.textContent = token.translated;
      fragment.appendChild(span);
    } else {
      // Non-word or unchanged - just add as text
      fragment.appendChild(document.createTextNode(token.translated));
    }
  }

  return fragment;
}

// Default chunk size for chunked DOM updates
const DEFAULT_CHUNK_SIZE = 100;

/**
 * Translates a single text node (internal helper).
 */
function translateTextNode(
  textNode: Text,
  showTooltips: boolean,
  outputFormat: OutputFormat
): void {
  const originalText = textNode.textContent;
  if (!originalText) {
    return;
  }

  const parent = textNode.parentElement;

  if (showTooltips) {
    // Replace text node with tooltip spans
    const fragment = createTooltipFragment(originalText, outputFormat);
    // Store original text on parent for restoration
    if (parent && !parent.hasAttribute('data-ingglish-original')) {
      parent.setAttribute('data-ingglish-original', originalText);
    }
    textNode.replaceWith(fragment);
  } else {
    // Simple text replacement (original behavior)
    if (parent && !parent.hasAttribute('data-ingglish-original')) {
      parent.setAttribute('data-ingglish-original', originalText);
    }
    textNode.textContent = translateSync(originalText, outputFormat);
  }
}

/**
 * Processes text nodes in chunks using requestAnimationFrame for smooth rendering.
 */
function translateNodesChunked(
  textNodes: Text[],
  showTooltips: boolean,
  outputFormat: OutputFormat,
  chunkSize: number,
  onProgress?: (processed: number, total: number) => void
): Promise<void> {
  return new Promise((resolve) => {
    const totalNodes = textNodes.length;
    let index = 0;

    function processChunk(): void {
      const endIndex = Math.min(index + chunkSize, totalNodes);

      // Process this chunk
      while (index < endIndex) {
        translateTextNode(textNodes[index], showTooltips, outputFormat);
        index++;

        if (onProgress && totalNodes > 0) {
          onProgress(index, totalNodes);
        }
      }

      // Schedule next chunk or complete
      if (index < totalNodes) {
        requestAnimationFrame(processChunk);
      } else {
        resolve();
      }
    }

    // Start processing
    if (totalNodes > 0) {
      requestAnimationFrame(processChunk);
    } else {
      resolve();
    }
  });
}

/**
 * Translates all text content within a DOM element (sync version).
 * Dictionary must already be loaded via translateDOM() or translate().
 *
 * @param root The root element to translate
 * @param options Configuration options
 * @returns Promise when chunked=true, void otherwise
 */
export function translateDOMSync(
  root: Element | Document,
  options: DOMTranslatorOptions & { chunked: true }
): Promise<void>;
export function translateDOMSync(
  root: Element | Document,
  options?: DOMTranslatorOptions & { chunked?: false }
): void;
export function translateDOMSync(
  root: Element | Document,
  options: DOMTranslatorOptions = {}
): void | Promise<void> {
  requireBrowser();

  const {
    skipTags = DEFAULT_SKIP_TAGS,
    skipClasses = DEFAULT_SKIP_CLASSES,
    translateAttributes = true,
    showTooltips = false,
    onProgress,
    outputFormat = 'ingglish',
    chunked = false,
    chunkSize = DEFAULT_CHUNK_SIZE,
  } = options;

  // Get the document (works for both main document and iframes)
  const targetDoc = root instanceof Document ? root : root.ownerDocument;

  // Inject tooltip CSS if showing tooltips
  if (showTooltips && targetDoc !== null) {
    injectTooltipStylesUtil(targetDoc);
  }

  // Single walk to collect all text nodes
  const textNodes = collectTextNodesUtil(root, skipTags, skipClasses);
  const totalNodes = textNodes.length;

  // Translate attributes if enabled (do this first, it's fast)
  if (translateAttributes) {
    translateElementAttributes(root, skipTags, skipClasses, outputFormat);
  }

  // Chunked mode: use requestAnimationFrame for smooth rendering
  if (chunked) {
    return translateNodesChunked(textNodes, showTooltips, outputFormat, chunkSize, onProgress);
  }

  // Sync mode: translate all nodes immediately
  for (let i = 0; i < totalNodes; i++) {
    translateTextNode(textNodes[i], showTooltips, outputFormat);

    if (onProgress && totalNodes > 0) {
      onProgress(i + 1, totalNodes);
    }
  }
}

/**
 * Translates translatable attributes on elements.
 */
function translateElementAttributes(
  root: Element | Document,
  skipTags: string[],
  skipClasses: string[],
  format: OutputFormat = 'ingglish'
): void {
  const elements = Array.from(root.querySelectorAll('*'));

  for (const element of elements) {
    if (shouldSkipElement(element, skipTags, skipClasses)) {
      continue;
    }

    for (const attrName of TRANSLATABLE_ATTRIBUTES) {
      const attrValue = element.getAttribute(attrName);
      if (attrValue !== null && attrValue.length > 0) {
        // Store original attribute value for restoration
        const originalAttrName = `data-ingglish-original-${attrName}`;
        if (!element.hasAttribute(originalAttrName)) {
          element.setAttribute(originalAttrName, attrValue);
        }
        element.setAttribute(attrName, translateSync(attrValue, format));
      }
    }
  }
}

/**
 * Translates all text content within a DOM element (async, auto-loads dictionary).
 * This is the recommended entry point for DOM translation.
 */
export async function translateDOM(
  root: Element | Document,
  options: DOMTranslatorOptions = {}
): Promise<void> {
  // Ensure dictionary is loaded by calling translate
  await translate('');
  const result = translateDOMSync(root, options as DOMTranslatorOptions & { chunked: true });
  // If chunked mode returns a Promise, await it
  if (result instanceof Promise) {
    await result;
  }
}

/**
 * Restores original text content that was translated.
 * Uses the data-ingglish-original attributes stored during translation.
 *
 * @param root The root element to restore
 */
export function restoreDOM(root: Element | Document): void {
  requireBrowser();

  // Restore text content
  const elementsWithOriginal = Array.from(root.querySelectorAll('[data-ingglish-original]'));

  for (const element of elementsWithOriginal) {
    const originalText = element.getAttribute('data-ingglish-original');
    if (originalText !== null) {
      // Find the text node child and restore it
      for (const child of Array.from(element.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          child.textContent = originalText;
          break;
        }
      }
      element.removeAttribute('data-ingglish-original');
    }
  }

  // Restore attributes
  for (const attrName of TRANSLATABLE_ATTRIBUTES) {
    const originalAttrName = `data-ingglish-original-${attrName}`;
    const elementsWithAttr = Array.from(root.querySelectorAll(`[${originalAttrName}]`));

    for (const element of elementsWithAttr) {
      const originalValue = element.getAttribute(originalAttrName);
      if (originalValue !== null) {
        element.setAttribute(attrName, originalValue);
        element.removeAttribute(originalAttrName);
      }
    }
  }
}

/**
 * Options for applying pre-computed translations.
 */
export interface ApplyTranslationsOptions {
  /** Whether to show tooltips with original text on hover */
  showTooltips?: boolean;
  /** Number of text nodes to process per animation frame */
  chunkSize?: number;
  /** Callback for progress updates */
  onProgress?: (processed: number, total: number) => void;
}

/**
 * Creates a tooltip fragment from text using a pre-computed translations map.
 * This is used by the extension which fetches translations from the background worker.
 */
function createTooltipFragmentFromMap(
  text: string,
  translations: Record<string, string>
): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const normalized = normalizeApostrophes(text);

  // Split into words and non-words
  const tokens = normalized.split(/(\b[a-zA-Z']+\b)/);

  for (const token of tokens) {
    if (!token) {
      continue;
    }

    if (/^[a-zA-Z']+$/.test(token)) {
      const lowerToken = token.toLowerCase();
      const translated = translations[lowerToken];

      if (translated && translated !== lowerToken) {
        // Word was translated - wrap in tooltip span
        const span = document.createElement('span');
        span.className = 'ingglish-word';
        span.setAttribute('data-ingglish-orig', token);
        span.textContent = applyCase(token, translated);
        fragment.appendChild(span);
      } else {
        // No translation or unchanged - keep original
        fragment.appendChild(document.createTextNode(token));
      }
    } else {
      // Non-word (punctuation, space, etc.)
      fragment.appendChild(document.createTextNode(token));
    }
  }

  return fragment;
}

/**
 * Applies pre-computed translations to a DOM tree.
 * This is designed for use cases where translations are fetched externally
 * (e.g., from a service worker via message passing).
 *
 * @param root The root element to translate
 * @param translations Map of lowercase words to their translations
 * @param options Configuration options
 */
export function applyTranslationsMap(
  root: Element | Document,
  translations: Record<string, string>,
  options: ApplyTranslationsOptions = {}
): Promise<void> {
  requireBrowser();

  const { showTooltips = true, chunkSize = DEFAULT_CHUNK_SIZE, onProgress } = options;

  // Get the document for style injection
  const targetDoc = root instanceof Document ? root : root.ownerDocument;
  if (showTooltips && targetDoc !== null) {
    injectTooltipStylesUtil(targetDoc);
  }

  // Collect all text nodes
  const textNodes = collectTextNodesUtil(root);
  const totalNodes = textNodes.length;

  return new Promise((resolve) => {
    let index = 0;

    function processChunk(): void {
      const endIndex = Math.min(index + chunkSize, totalNodes);

      while (index < endIndex) {
        const textNode = textNodes[index];
        const parent = textNode.parentElement;

        if (parent && !parent.hasAttribute('data-ingglish-original')) {
          parent.setAttribute('data-ingglish-original', textNode.textContent ?? '');
        }

        if (showTooltips) {
          const fragment = createTooltipFragmentFromMap(textNode.textContent ?? '', translations);
          textNode.replaceWith(fragment);
        } else {
          // Simple text replacement without tooltips
          const text = textNode.textContent ?? '';
          const normalized = normalizeApostrophes(text);
          let result = '';
          const tokens = normalized.split(/(\b[a-zA-Z']+\b)/);
          for (const token of tokens) {
            if (!token) {
              continue;
            }
            if (/^[a-zA-Z']+$/.test(token)) {
              const translated = translations[token.toLowerCase()];
              result += translated ? applyCase(token, translated) : token;
            } else {
              result += token;
            }
          }
          textNode.textContent = result;
        }

        index++;

        if (onProgress && totalNodes > 0) {
          onProgress(index, totalNodes);
        }
      }

      if (index < totalNodes) {
        requestAnimationFrame(processChunk);
      } else {
        resolve();
      }
    }

    if (totalNodes > 0) {
      requestAnimationFrame(processChunk);
    } else {
      resolve();
    }
  });
}
