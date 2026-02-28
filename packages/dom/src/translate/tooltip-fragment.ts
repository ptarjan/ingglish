/**
 * Tooltip fragment creation utilities.
 */

import { translateSyncWithMapping } from 'ingglish';
import { NOT_FOUND_MARKER } from '@ingglish/ipa';
import {
  applyCasePattern,
  detectCasePattern,
  normalizeApostrophes,
  WORD_SPLIT_REGEX,
  WORD_TEST_REGEX,
} from '@ingglish/normalize';
import type { OutputFormat } from '@ingglish/phonemes';
import {
  ATTR_ORIGINAL_WORD,
  FORMAT_DIFF_CLASS,
  NOT_FOUND_CLASS,
  WORD_SPAN_CLASS,
} from '../constants';

// Template span for cloneNode (faster than createElement)
// Created lazily on first use
let templateSpan: HTMLSpanElement | null = null;

interface FragmentItem {
  isDiff?: boolean;
  notFound?: boolean;
  text: string;
  tooltip?: string;
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
  const stdTokens = format === 'ingglish' ? null : translateSyncWithMapping(text, 'ingglish');

  return buildTooltipFragment(
    tokens.map((token, i) => {
      if (token.isWord && token.original !== token.translated) {
        const stdSpelling = stdTokens?.[i]?.translated;
        const isDiff =
          stdSpelling !== undefined && stdSpelling.toLowerCase() !== token.translated.toLowerCase();
        const notFound = !token.matched;
        const tooltip = isDiff ? `${token.original} (Ingglish: ${stdSpelling})` : token.original;
        return { isDiff, notFound, text: token.translated, tooltip };
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

/**
 * Creates a tooltip fragment using a custom translation function.
 * Translates the full text in one call (efficient), then splits both
 * original and result on whitespace to align words for tooltips.
 * Used for foreign language translation where translateSyncWithMapping isn't available.
 */
export function createTooltipFragmentWithFn(
  text: string,
  translateFn: (text: string, format: OutputFormat) => string,
  format: OutputFormat = 'ingglish'
): DocumentFragment {
  const WHITESPACE_SPLIT = /(\s+)/;

  // Translate the full text in one call (avoids N per-word calls)
  const translated = translateFn(text, format);

  // Split both on whitespace to align words positionally.
  // translateForeign preserves whitespace structure, so segments align 1:1.
  const origSegments = text.split(WHITESPACE_SPLIT).filter(Boolean);
  const transSegments = translated.split(WHITESPACE_SPLIT).filter(Boolean);

  const items: FragmentItem[] = [];
  for (const [i, transSegment] of transSegments.entries()) {
    const orig = origSegments[i];
    let trans = transSegment;
    // Detect NOT_FOUND_MARKER prefix from translateForeign
    let notFound = false;
    if (trans.includes(NOT_FOUND_MARKER)) {
      notFound = true;
      trans = trans.replaceAll(NOT_FOUND_MARKER, '');
    }
    // Show tooltip for all non-whitespace segments (even when translation matches
    // original, so users can see the foreign word on hover)
    if (orig !== undefined && !/^\s+$/.test(trans)) {
      items.push({ notFound, text: trans, tooltip: orig });
    } else {
      items.push({ text: trans });
    }
  }

  return buildTooltipFragment(items);
}

/**
 * Builds a DocumentFragment from a sequence of items.
 * Items with a tooltip get wrapped in a span; others are batched into text nodes.
 */
function buildTooltipFragment(items: FragmentItem[]): DocumentFragment {
  const fragment = document.createDocumentFragment();
  let pendingText = '';

  for (const item of items) {
    if (item.tooltip === undefined) {
      pendingText += item.text;
    } else {
      if (pendingText) {
        fragment.append(document.createTextNode(pendingText));
        pendingText = '';
      }
      const span = getTemplateSpan().cloneNode(false) as HTMLSpanElement;
      span.setAttribute(ATTR_ORIGINAL_WORD, item.tooltip);
      if (item.isDiff === true) {
        span.classList.add(FORMAT_DIFF_CLASS);
      }
      if (item.notFound === true) {
        span.classList.add(NOT_FOUND_CLASS);
      }
      span.textContent = item.text;
      fragment.append(span);
    }
  }

  if (pendingText) {
    fragment.append(document.createTextNode(pendingText));
  }

  return fragment;
}

function getTemplateSpan(): HTMLSpanElement {
  if (templateSpan === null) {
    templateSpan = document.createElement('span');
    templateSpan.className = WORD_SPAN_CLASS;
  }
  return templateSpan;
}
