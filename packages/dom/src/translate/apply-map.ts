/**
 * Apply pre-computed translations to DOM.
 */

import {
  detectCasePattern,
  applyCasePattern,
  normalizeApostrophes,
  WORD_SPLIT_REGEX,
  WORD_TEST_REGEX,
} from '@ingglish/core/internal';
import { requireBrowser, collectTextNodes, injectTooltipStyles } from '../utils';
import { ATTR_ORIGINAL_CONTENT } from '../constants';
import { createTooltipFragmentFromMap } from './tooltip-fragment';

// Default chunk size for chunked DOM updates (consistent with translator.ts)
const DEFAULT_CHUNK_SIZE = 100;

// Threshold for synchronous processing (avoid RAF overhead for small pages)
const SYNC_THRESHOLD = 500;

/**
 * Options for applying pre-computed translations.
 */
export interface ApplyTranslationsOptions {
  /** Whether to show tooltips with original text on hover */
  showTooltips?: boolean;
  /** Number of text nodes to process per animation frame */
  chunkSize?: number;
  /** Pre-collected text nodes (avoids re-traversing DOM) */
  textNodes?: Text[];
  /** Callback for progress updates */
  onProgress?: (processed: number, total: number) => void;
}

/**
 * Process a single text node, applying translations.
 */
function processTextNode(
  textNode: Text,
  translations: Record<string, string>,
  showTooltips: boolean
): void {
  const parent = textNode.parentElement;

  if (parent && !parent.hasAttribute(ATTR_ORIGINAL_CONTENT)) {
    parent.setAttribute(ATTR_ORIGINAL_CONTENT, textNode.textContent ?? '');
  }

  if (showTooltips) {
    const fragment = createTooltipFragmentFromMap(textNode.textContent ?? '', translations);
    textNode.replaceWith(fragment);
  } else {
    // Simple text replacement without tooltips
    const text = textNode.textContent ?? '';
    const normalized = normalizeApostrophes(text);
    let result = '';
    const tokens = normalized.split(WORD_SPLIT_REGEX);
    for (const token of tokens) {
      if (!token) {
        continue;
      }
      if (WORD_TEST_REGEX.test(token)) {
        const translated = translations[token.toLowerCase()];
        if (translated) {
          const pattern = detectCasePattern(token);
          result += applyCasePattern(translated, pattern, token);
        } else {
          result += token;
        }
      } else {
        result += token;
      }
    }
    textNode.textContent = result;
  }
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

  const {
    showTooltips = true,
    chunkSize = DEFAULT_CHUNK_SIZE,
    textNodes: preCollectedNodes,
    onProgress,
  } = options;

  // Get the document for style injection
  const targetDoc = root instanceof Document ? root : root.ownerDocument;
  if (showTooltips && targetDoc !== null) {
    injectTooltipStyles(targetDoc);
  }

  // Use pre-collected nodes if provided, otherwise collect them
  const textNodes = preCollectedNodes ?? collectTextNodes(root);
  const totalNodes = textNodes.length;

  // For small pages, process synchronously to avoid RAF overhead
  if (totalNodes <= SYNC_THRESHOLD) {
    for (let i = 0; i < totalNodes; i++) {
      processTextNode(textNodes[i], translations, showTooltips);
      if (onProgress) {
        onProgress(i + 1, totalNodes);
      }
    }
    return Promise.resolve();
  }

  // For larger pages, chunk the work across animation frames
  return new Promise((resolve) => {
    let index = 0;

    function processChunk(): void {
      const endIndex = Math.min(index + chunkSize, totalNodes);

      while (index < endIndex) {
        processTextNode(textNodes[index], translations, showTooltips);
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

    requestAnimationFrame(processChunk);
  });
}
