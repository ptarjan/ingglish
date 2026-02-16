/**
 * Tooltip fragment creation utilities.
 */

import { translateSyncWithMapping } from 'ingglish';
import { normalizeApostrophes, detectCasePattern, applyCasePattern } from '@ingglish/normalize';
import { WORD_SPLIT_REGEX, WORD_TEST_REGEX } from '@ingglish/tokenize';
import { WORD_SPAN_CLASS, ATTR_ORIGINAL_WORD } from '../constants';
import type { OutputFormat } from '../types';

// Template span for cloneNode (faster than createElement)
// Created lazily on first use
let templateSpan: HTMLSpanElement | null = null;

function getTemplateSpan(): HTMLSpanElement {
  if (templateSpan === null) {
    templateSpan = document.createElement('span');
    templateSpan.className = WORD_SPAN_CLASS;
  }
  return templateSpan;
}

/**
 * Creates a document fragment with tooltip spans for each translated word.
 * Words get wrapped in spans with data-original attributes for CSS tooltips.
 * Non-word tokens (punctuation, whitespace) are batched into single text nodes.
 */
export function createTooltipFragment(
  text: string,
  format: OutputFormat = 'ingglish'
): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const tokens = translateSyncWithMapping(text, format);

  // Accumulate adjacent non-translated text to reduce DOM node count
  let pendingText = '';

  for (const token of tokens) {
    if (token.isWord && token.original !== token.translated) {
      // Flush any pending text before the span
      if (pendingText) {
        fragment.appendChild(document.createTextNode(pendingText));
        pendingText = '';
      }

      // Word that was translated - wrap in tooltip span
      // ATTR_ORIGINAL_WORD stores original text AND marks as translated (prevents re-processing)
      // Use cloneNode for better performance than createElement
      const span = getTemplateSpan().cloneNode(false) as HTMLSpanElement;
      span.setAttribute(ATTR_ORIGINAL_WORD, token.original);
      span.textContent = token.translated;
      fragment.appendChild(span);
    } else {
      // Non-word or unchanged - accumulate as text
      pendingText += token.translated;
    }
  }

  // Flush any remaining text
  if (pendingText) {
    fragment.appendChild(document.createTextNode(pendingText));
  }

  return fragment;
}

/**
 * Creates a tooltip fragment from text using a pre-computed translations map.
 * This is used by the extension which fetches translations from the background worker.
 *
 * Optimization: batches adjacent non-word tokens into single text nodes to reduce
 * DOM operations. For text like "Hello, world!", creates 3 nodes instead of 4.
 */
export function createTooltipFragmentFromMap(
  text: string,
  translations: Record<string, string>
): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const normalized = normalizeApostrophes(text);

  // Split into words and non-words
  const tokens = normalized.split(WORD_SPLIT_REGEX);

  // Accumulate adjacent non-translated text to reduce DOM node count
  let pendingText = '';

  for (const token of tokens) {
    if (!token) {
      continue;
    }

    if (WORD_TEST_REGEX.test(token)) {
      const lowerToken = token.toLowerCase();
      const translated = translations[lowerToken];

      if (translated && translated !== lowerToken) {
        // Flush any pending text before the span
        if (pendingText) {
          fragment.appendChild(document.createTextNode(pendingText));
          pendingText = '';
        }

        // Word was translated - wrap in tooltip span
        // Use cloneNode for better performance than createElement
        const span = getTemplateSpan().cloneNode(false) as HTMLSpanElement;
        span.setAttribute(ATTR_ORIGINAL_WORD, token);
        const pattern = detectCasePattern(token);
        span.textContent = applyCasePattern(translated, pattern, token);
        fragment.appendChild(span);
      } else {
        // No translation or unchanged - accumulate as text
        pendingText += token;
      }
    } else {
      // Non-word (punctuation, space, etc.) - accumulate
      pendingText += token;
    }
  }

  // Flush any remaining text
  if (pendingText) {
    fragment.appendChild(document.createTextNode(pendingText));
  }

  return fragment;
}
