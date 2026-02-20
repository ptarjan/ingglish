/**
 * Tooltip fragment creation utilities.
 */

import { translateSyncWithMapping } from 'ingglish';
import { normalizeApostrophes, detectCasePattern, applyCasePattern } from '@ingglish/normalize';
import { WORD_SPLIT_REGEX, WORD_TEST_REGEX } from '@ingglish/tokenize';
import { WORD_SPAN_CLASS, ATTR_ORIGINAL_WORD, FORMAT_DIFF_CLASS } from '../constants';
import type { OutputFormat } from '@ingglish/phonemes';

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

interface FragmentItem {
  text: string;
  tooltip?: string;
  isDiff?: boolean;
}

/**
 * Builds a DocumentFragment from a sequence of items.
 * Items with a tooltip get wrapped in a span; others are batched into text nodes.
 */
function buildTooltipFragment(items: FragmentItem[]): DocumentFragment {
  const fragment = document.createDocumentFragment();
  let pendingText = '';

  for (const item of items) {
    if (item.tooltip !== undefined) {
      if (pendingText) {
        fragment.appendChild(document.createTextNode(pendingText));
        pendingText = '';
      }
      const span = getTemplateSpan().cloneNode(false) as HTMLSpanElement;
      span.setAttribute(ATTR_ORIGINAL_WORD, item.tooltip);
      if (item.isDiff === true) {
        span.classList.add(FORMAT_DIFF_CLASS);
      }
      span.textContent = item.text;
      fragment.appendChild(span);
    } else {
      pendingText += item.text;
    }
  }

  if (pendingText) {
    fragment.appendChild(document.createTextNode(pendingText));
  }

  return fragment;
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
  const tokens = translateSyncWithMapping(text, format);

  // For non-default formats, get standard Ingglish tokens to detect format diffs
  const stdTokens = format !== 'ingglish' ? translateSyncWithMapping(text, 'ingglish') : null;

  return buildTooltipFragment(
    tokens.map((token, i) => {
      if (token.isWord && token.original !== token.translated) {
        const stdSpelling = stdTokens?.[i]?.translated;
        const isDiff =
          stdSpelling !== undefined && stdSpelling.toLowerCase() !== token.translated.toLowerCase();
        const tooltip = isDiff ? `${token.original} (Ingglish: ${stdSpelling})` : token.original;
        return { text: token.translated, tooltip, isDiff };
      }
      return { text: token.translated };
    })
  );
}

/**
 * Creates a tooltip fragment from text using a pre-computed translations map.
 * This is used by the extension which fetches translations from the background worker.
 */
export function createTooltipFragmentFromMap(
  text: string,
  translations: Record<string, string>
): DocumentFragment {
  const normalized = normalizeApostrophes(text);
  const tokens = normalized.split(WORD_SPLIT_REGEX);

  return buildTooltipFragment(
    tokens.filter(Boolean).map((token) => {
      if (WORD_TEST_REGEX.test(token)) {
        const lowerToken = token.toLowerCase();
        const translated = translations[lowerToken];
        if (translated !== undefined && translated !== lowerToken) {
          const pattern = detectCasePattern(token);
          return { text: applyCasePattern(translated, pattern, token), tooltip: token };
        }
      }
      return { text: token };
    })
  );
}
