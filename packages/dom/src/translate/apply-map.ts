/**
 * Apply pre-computed translations to DOM.
 */

import {
  requireBrowser,
  collectTextNodes,
  injectTooltipStyles,
  normalizeApostrophes,
  applyCase,
} from '../utils';
import { createTooltipFragmentFromMap } from './tooltip-fragment';

// Default chunk size for chunked DOM updates
const DEFAULT_CHUNK_SIZE = 100;

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
    injectTooltipStyles(targetDoc);
  }

  // Collect all text nodes
  const textNodes = collectTextNodes(root);
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
