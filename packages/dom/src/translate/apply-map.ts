/**
 * Apply pre-computed translations to DOM.
 */

import { applyCasePattern, detectCasePattern, normalizeApostrophes } from '@ingglish/normalize';
import { ATTR_ORIGINAL_CONTENT } from '../constants';
import {
  collectTextNodes,
  injectTooltipBehavior,
  injectTooltipStyles,
  requireBrowser,
} from '../traversal';
import { processChunked } from './chunked';
import { rememberOriginalText } from './original-text';
import { createTooltipFragmentFromMap } from './tooltip-fragment';

// Default chunk size for chunked DOM updates (consistent with translator.ts)
const DEFAULT_CHUNK_SIZE = 100;

// Threshold for synchronous processing (avoid RAF overhead for small pages)
const SYNC_THRESHOLD = 500;

// Word matching regex for exec-based processing (faster than split+test)
const WORD_REGEX = /(?<!\d)[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF']+(?!\d)/g;

/**
 * Options for applying pre-computed translations.
 */
export interface ApplyTranslationsOptions {
  /** Number of text nodes to process per animation frame */
  chunkSize?: number;
  /** Callback for progress updates */
  onProgress?: (processed: number, total: number) => void;
  /** Whether to show tooltips with original text on hover */
  showTooltips?: boolean;
  /** Pre-collected text nodes (avoids re-traversing DOM) */
  textNodes?: Text[];
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
  root: Document | Element,
  translations: Record<string, string>,
  options: ApplyTranslationsOptions = {}
): Promise<void> {
  requireBrowser();

  const {
    chunkSize = DEFAULT_CHUNK_SIZE,
    onProgress,
    showTooltips = false,
    textNodes: preCollectedNodes,
  } = options;

  // Get the document for style injection
  const targetDoc = root instanceof Document ? root : root.ownerDocument;
  if (showTooltips && targetDoc !== null) {
    injectTooltipStyles(targetDoc);
    injectTooltipBehavior(targetDoc);
  }

  // Use pre-collected nodes if provided, otherwise collect them
  const textNodes = preCollectedNodes ?? collectTextNodes(root);

  return processChunked(
    textNodes,
    (node) => {
      processTextNode(node, translations, showTooltips);
    },
    chunkSize,
    onProgress,
    SYNC_THRESHOLD
  );
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
    rememberOriginalText(textNode, text);
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
      if (translated === undefined) {
        result += word;
      } else {
        const pattern = detectCasePattern(word);
        result += applyCasePattern(translated, pattern, word);
      }
    }

    // Add remaining text after last match
    result += normalized.slice(lastIndex);
    textNode.textContent = result;
  }
}
