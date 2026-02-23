/**
 * Shared pipeline stages for forward and reverse translation.
 *
 * Both directions follow the same structure:
 *   prepareText → mapTokens → (optional capitalizeSentences) → output
 */

import {
  extractPreservedPatterns,
  normalizeApostrophes,
  WORD_SPLIT_REGEX,
  WORD_TEST_REGEX,
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

/** Callback signature for translating a single word token. */
export type WordTranslator = (word: string) => TranslateResult;

// Pre-compiled regex patterns
const SENTENCE_END = /[.?!]/;
const HAS_LETTER = /[a-z]/i;

/**
 * Stage 3 (forward only): Capitalize the first word of each sentence.
 * Only applies when the format preserves case and the text has multiple words.
 * Returns tokens unmodified if no capitalization is needed.
 */
export function capitalizeSentences(
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
  for (const token of rawTokens) {
    if (token.length === 0) {
      continue;
    }

    // Check if this token contains a placeholder for a preserved pattern
    const expanded = expandPlaceholder(token, preserved);
    if (expanded) {
      result.push(...expanded);
      continue;
    }

    if (WORD_TEST_REGEX.test(token)) {
      const { matched, translated } = translateWord(token);
      result.push({ isWord: true, matched, original: token, translated });
    } else {
      result.push({ isWord: false, matched: true, original: token, translated: token });
    }
  }
  return result;
}

/**
 * Stage 1: Normalize text and extract preserved patterns (URLs, emails).
 * Returns the raw token strings and the preserved pattern map.
 */
export function prepareText(text: string): {
  preserved: Map<string, string>;
  rawTokens: string[];
} {
  const normalized = normalizeApostrophes(text);
  const { preserved, text: textWithPlaceholders } = extractPreservedPatterns(normalized);
  const rawTokens = textWithPlaceholders.split(WORD_SPLIT_REGEX);
  return { preserved, rawTokens };
}
