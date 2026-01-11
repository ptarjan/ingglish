/**
 * Tooltip fragment creation utilities.
 */

import { translateSyncWithMapping } from '@ingglish/core';
import { normalizeApostrophes, detectCasePattern, applyCasePattern } from '@ingglish/core/internal';
import type { OutputFormat } from '../types';

/**
 * Creates a document fragment with tooltip spans for each translated word.
 * Words get wrapped in spans with data-original attributes for CSS tooltips.
 * Non-word tokens (punctuation, whitespace) are added as text nodes.
 */
export function createTooltipFragment(
  text: string,
  format: OutputFormat = 'ingglish'
): DocumentFragment {
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

/**
 * Creates a tooltip fragment from text using a pre-computed translations map.
 * This is used by the extension which fetches translations from the background worker.
 */
export function createTooltipFragmentFromMap(
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
        const pattern = detectCasePattern(token);
        span.textContent = applyCasePattern(translated, pattern, token);
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
