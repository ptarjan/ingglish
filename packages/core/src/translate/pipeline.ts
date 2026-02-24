/**
 * Shared pipeline stages for forward and reverse translation.
 *
 * Both directions follow the same structure:
 *   extractTokens → mapTokens → (optional sentenceCapitalize) → output
 *
 * Function names are chosen so alphabetical sort matches pipeline order (e < m < r < s).
 */

import {
  extractPreservedPatterns,
  normalizeApostrophes,
  WORD_SPLIT_REGEX,
} from '@ingglish/normalize';
import type { OutputFormat } from '@ingglish/phonemes';
import { getFormatPreservesCase } from '@ingglish/phonemes';
import type { TranslatedToken } from './forward';
import { expandPlaceholder } from './preserved';

/** Result from a word translator function. */
export interface TranslateResult {
  matched: boolean;
  translated: string;
}

/** Callback that returns just the translated string (used by renderText). */
export type WordRenderer = (word: string) => string;

/** Callback signature for translating a single word token. */
export type WordTranslator = (word: string) => TranslateResult;

// Pre-compiled regex patterns
const SENTENCE_END = /[.?!]/;
const HAS_LETTER = /[a-z]/i;

/**
 * Stage 1: Normalize text and extract preserved patterns (URLs, emails).
 * Returns the raw token strings and the preserved pattern map.
 */
export function extractTokens(text: string): {
  preserved: Map<string, string>;
  rawTokens: string[];
} {
  const normalized = normalizeApostrophes(text);
  const { preserved, text: textWithPlaceholders } = extractPreservedPatterns(normalized);
  const rawTokens = textWithPlaceholders.split(WORD_SPLIT_REGEX);
  return { preserved, rawTokens };
}

/**
 * Stage 2: Map raw token strings into TranslatedToken[], routing words
 * through the provided translator and expanding preserved pattern placeholders.
 */
export function mapTokens(
  rawTokens: string[],
  preserved: Map<string, string>,
  translateWord: WordTranslator
): TranslatedToken[] {
  const result: TranslatedToken[] = [];
  const hasPreserved = preserved.size > 0;

  // WORD_SPLIT_REGEX is a capturing group, so split() places word matches
  // at odd indices and separators (punctuation/whitespace) at even indices.
  // This lets us use index parity instead of a per-token regex test.
  for (const [i, token] of rawTokens.entries()) {
    if (token.length === 0) {
      continue;
    }

    // Check if this token contains a placeholder for a preserved pattern
    if (hasPreserved) {
      const expanded = expandPlaceholder(token, preserved);
      if (expanded) {
        result.push(...expanded);
        continue;
      }
    }

    if (i % 2 === 1) {
      const { matched, translated } = translateWord(token);
      result.push({ isWord: true, matched, original: token, translated });
    } else {
      result.push({ isWord: false, matched: true, original: token, translated: token });
    }
  }
  return result;
}

/**
 * String-only version of expandPlaceholder: replaces placeholder keys with their
 * original text in-place. Returns null if no placeholders found in the token.
 */
const expandPlaceholderText = (token: string, preserved: Map<string, string>): null | string => {
  let found = false;
  let result = token;
  for (const [placeholder, original] of preserved) {
    const idx = result.indexOf(placeholder);
    if (idx !== -1) {
      result = result.slice(0, idx) + original + result.slice(idx + placeholder.length);
      found = true;
    }
  }
  return found ? result : null;
};

/**
 * Fused single-pass string builder: combines mapTokens + sentenceCapitalize + join
 * into one function that directly builds the output string. Eliminates intermediate
 * TranslatedToken[] arrays and extra iteration passes.
 */
export function renderText(
  rawTokens: string[],
  preserved: Map<string, string>,
  translateWord: WordRenderer,
  format: OutputFormat
): string {
  const preservesCase = getFormatPreservesCase(format);
  const hasPreserved = preserved.size > 0;

  let result = '';
  let wordCount = 0;
  let sentenceStart = true;
  let firstWordStart = -1;

  // WORD_SPLIT_REGEX is a capturing group, so split() places word matches
  // at odd indices and separators (punctuation/whitespace) at even indices.
  // This lets us use index parity instead of a per-token regex test.
  for (const [i, token] of rawTokens.entries()) {
    if (token.length === 0) {
      continue;
    }

    // Check for preserved patterns (URLs, emails)
    if (hasPreserved) {
      const expanded = expandPlaceholderText(token, preserved);
      if (expanded !== null) {
        result += expanded;
        continue;
      }
    }

    if (i % 2 === 1) {
      const translated = translateWord(token);
      wordCount++;

      if (preservesCase && sentenceStart && translated.length > 0) {
        if (wordCount === 1) {
          // First sentence-start word — defer capitalization until we
          // know there are multiple words (single words stay lowercase)
          firstWordStart = result.length;
          result += translated;
        } else {
          // Subsequent sentence-start word — capitalize immediately
          result += translated.charAt(0).toUpperCase() + translated.slice(1);
        }
      } else {
        result += translated;
      }
      sentenceStart = false;
    } else {
      // Non-word token — check for sentence-end punctuation.
      // Only on pure punctuation/whitespace tokens (no letters), since
      // digit-adjacent words like "3rd" stay in separator tokens.
      if (preservesCase && SENTENCE_END.test(token) && !HAS_LETTER.test(token)) {
        sentenceStart = true;
      }
      result += token;
    }
  }

  // Capitalize first word only if there were multiple words
  if (preservesCase && wordCount > 1 && firstWordStart !== -1) {
    const firstChar = result.charAt(firstWordStart);
    const upper = firstChar.toUpperCase();
    if (upper !== firstChar) {
      result = result.slice(0, firstWordStart) + upper + result.slice(firstWordStart + 1);
    }
  }

  return result;
}

/**
 * Stage 3 (forward only): Capitalize the first word of each sentence.
 * Only applies when the format preserves case and the text has multiple words.
 * Returns tokens unmodified if no capitalization is needed.
 */
export function sentenceCapitalize(
  tokens: TranslatedToken[],
  format: OutputFormat
): TranslatedToken[] {
  if (!getFormatPreservesCase(format)) {
    return tokens;
  }

  // Count words — only capitalize if there are multiple words
  let wordCount = 0;
  for (const t of tokens) {
    if (t.isWord && ++wordCount > 1) {
      break;
    }
  }
  if (wordCount <= 1) {
    return tokens;
  }

  let sentenceStart = true;
  const result: TranslatedToken[] = [];
  for (const token of tokens) {
    if (token.isWord) {
      if (sentenceStart && token.translated.length > 0) {
        const capitalized = token.translated.charAt(0).toUpperCase() + token.translated.slice(1);
        if (capitalized === token.translated) {
          result.push(token);
        } else {
          result.push({ ...token, translated: capitalized });
        }
      } else {
        result.push(token);
      }
      sentenceStart = false;
    } else {
      // Only detect sentence-end on pure punctuation/whitespace tokens.
      // Preserved patterns (URLs, emails) contain letters and periods
      // (e.g., ".com") that shouldn't trigger sentence capitalization.
      if (SENTENCE_END.test(token.translated) && !HAS_LETTER.test(token.translated)) {
        sentenceStart = true;
      }
      result.push(token);
    }
  }
  return result;
}
