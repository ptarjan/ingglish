/**
 * Forward translation: English -> Ingglish/IPA.
 */

import { arpabetToFormat } from '../convert/to-ingglish';
import { lookupPronunciation } from '../dictionary/lookup';
import { detectCasePattern, applyCasePattern } from '../utils/case';
import { normalizeApostrophes } from '../utils/text';
import { translateContraction, setTranslateWordFn } from './contractions';
import { isInitialism, translateInitialism, setInitialismTranslateWordFn } from './initialisms';
import type { OutputFormat } from '../types';

// Import translateUnknown - we'll set this up with proper dependency injection
import { translateUnknown } from '../fallback';

// Pre-compiled regex patterns for hot path performance
const WORD_SPLIT_REGEX = /(\b[a-zA-Z']+\b)/;
const WORD_TEST_REGEX = /^[a-zA-Z']+$/;

/**
 * Translates a single word (or contraction) to the specified format.
 * Handles contractions like "don't", "I'm", etc.
 *
 * @param word - The English word to translate
 * @param format - The output format ('ingglish' or 'ipa')
 * @returns The translated word, or the original word if not found
 */
export function translateWord(word: string, format: OutputFormat = 'ingglish'): string {
  // Handle empty strings
  if (!word) {
    return word;
  }

  // Check if word has any letters to translate
  if (!/[a-zA-Z]/.test(word)) {
    return word;
  }

  // Handle contractions (words with apostrophes)
  if (word.includes("'")) {
    return translateContraction(word, format);
  }

  // Handle known initialisms (UI, API, etc.) - translate to first letters of expansion
  if (isInitialism(word)) {
    const initialismResult = translateInitialism(word, format);
    if (initialismResult !== null) {
      return initialismResult;
    }
  }

  // Detect case pattern for preservation
  const casePattern = detectCasePattern(word);

  const phonemes = lookupPronunciation(word);

  if (!phonemes) {
    // Word not found in dictionary - try fallback strategies
    const fallbackResult = translateUnknown(word, format);

    // Return original if fallback failed
    if (!fallbackResult || fallbackResult.length === 0) {
      return word;
    }

    // Apply original case pattern to fallback result (only for Ingglish)
    if (format === 'ingglish') {
      return applyCasePattern(fallbackResult, casePattern, word);
    }
    return fallbackResult;
  }

  let result = arpabetToFormat(phonemes, format);

  // Apply original case pattern (only for Ingglish, IPA doesn't use case)
  if (format === 'ingglish') {
    result = applyCasePattern(result, casePattern, word);
  }

  return result;
}

// Register translateWord with modules to break circular dependencies
setTranslateWordFn(translateWord);
setInitialismTranslateWordFn(translateWord);

/**
 * Translates text containing multiple words to the specified format.
 * Preserves punctuation, whitespace, and non-word characters.
 *
 * @param text - The English text to translate
 * @param format - The output format ('ingglish' or 'ipa')
 * @returns The text with all words translated
 */
export function translateSync(text: string, format: OutputFormat = 'ingglish'): string {
  // Normalize curly apostrophes to straight ones
  const normalizedText = normalizeApostrophes(text);

  // Split on word boundaries, preserving punctuation, numbers, whitespace
  const tokens = normalizedText.split(WORD_SPLIT_REGEX);

  return tokens
    .map((token) => {
      // Only translate if it's a word (contains letters)
      if (WORD_TEST_REGEX.test(token)) {
        return translateWord(token, format);
      }
      return token;
    })
    .join('');
}

/**
 * Represents a translated token with original and translated text.
 */
export interface TranslatedToken {
  original: string;
  translated: string;
  isWord: boolean;
}

/**
 * Translates text and returns token-by-token mappings.
 * Used internally for DOM translation with tooltips.
 */
export function translateSyncWithMapping(
  text: string,
  format: OutputFormat = 'ingglish'
): TranslatedToken[] {
  const normalizedText = normalizeApostrophes(text);
  const tokens = normalizedText.split(WORD_SPLIT_REGEX);

  return tokens
    .filter((token) => token.length > 0)
    .map((token) => {
      if (WORD_TEST_REGEX.test(token)) {
        return {
          original: token,
          translated: translateWord(token, format),
          isWord: true,
        };
      }
      return {
        original: token,
        translated: token,
        isWord: false,
      };
    });
}
