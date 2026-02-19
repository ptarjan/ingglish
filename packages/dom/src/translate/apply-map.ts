/**
 * Apply pre-computed translations to DOM.
 */

import { detectCasePattern, applyCasePattern, normalizeApostrophes } from '@ingglish/normalize';
import {
  requireBrowser,
  collectTextNodes,
  injectTooltipStyles,
  injectTooltipBehavior,
} from '../utils';
import { ATTR_ORIGINAL_CONTENT } from '../constants';
import { createTooltipFragmentFromMap } from './tooltip-fragment';

// Default chunk size for chunked DOM updates (consistent with translator.ts)
const DEFAULT_CHUNK_SIZE = 100;

// Threshold for synchronous processing (avoid RAF overhead for small pages)
const SYNC_THRESHOLD = 500;

// Word matching regex for exec-based processing (faster than split+test)
const WORD_REGEX = /(?<!\d)[a-zA-Z\u00C0-\u024F']+(?!\d)/g;

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
    // Simple text replacement using regex exec (30% faster than split+test)
    const text = textNode.textContent ?? '';
    const normalized = normalizeApostrophes(text);
    let result = '';
    let lastIndex = 0;
    let match;

    // Reset regex state for each node
    WORD_REGEX.lastIndex = 0;

    while ((match = WORD_REGEX.exec(normalized)) !== null) {
      // Add text between matches (punctuation, spaces, etc.)
      result += normalized.slice(lastIndex, match.index);
      lastIndex = match.index + match[0].length;

      const word = match[0];
      const translated = translations[word.toLowerCase()];
      if (translated !== undefined) {
        const pattern = detectCasePattern(word);
        result += applyCasePattern(translated, pattern, word);
      } else {
        result += word;
      }
    }

    // Add remaining text after last match
    result += normalized.slice(lastIndex);
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
    showTooltips = false,
    chunkSize = DEFAULT_CHUNK_SIZE,
    textNodes: preCollectedNodes,
    onProgress,
  } = options;

  // Get the document for style injection
  const targetDoc = root instanceof Document ? root : root.ownerDocument;
  if (showTooltips && targetDoc !== null) {
    injectTooltipStyles(targetDoc);
    injectTooltipBehavior(targetDoc);
  }

  // Use pre-collected nodes if provided, otherwise collect them
  const textNodes = preCollectedNodes ?? collectTextNodes(root);
  const totalNodes = textNodes.length;

  // For small pages, process synchronously to avoid RAF overhead
  if (totalNodes <= SYNC_THRESHOLD) {
    for (let i = 0; i < totalNodes; i++) {
      processTextNode(textNodes[i]!, translations, showTooltips);
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
        processTextNode(textNodes[index]!, translations, showTooltips);
        index++;

        if (onProgress) {
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
