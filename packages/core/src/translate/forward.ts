/**
 * Forward translation: English -> Ingglish/IPA.
 */

import { arpabetToFormat } from '../convert/to-ingglish';
import { lookupPronunciation } from '../dictionary/lookup';
import { detectCasePattern, applyCasePattern, splitCamelCase } from '../utils/case';
import { normalizeApostrophes, WORD_SPLIT_REGEX, WORD_TEST_REGEX } from '../utils/text';
import { translateContraction, setTranslateWordFn } from './contractions';
import { isInitialism, translateInitialism, setInitialismTranslateWordFn } from './initialisms';
import type { OutputFormat } from '../types';

// Import translateUnknown and translateAsAcronym for fallback handling
import { translateUnknown, translateAsAcronym } from '../fallback';

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
    // translateInitialism returns null for single-word expansions (like TV = television)
    // These should be spelled out letter-by-letter, not looked up in the dictionary
    const acronymResult = translateAsAcronym(word, format);
    // Apply case pattern (capitalize first letter for uppercase input like "TV" → "Teevee")
    if (format === 'ingglish') {
      const casePattern = detectCasePattern(word);
      return applyCasePattern(acronymResult, casePattern, word);
    }
    return acronymResult;
  }

  // Handle camelCase words by translating each component separately
  // This preserves case at component boundaries (e.g., "iCloud" -> "ieKlowd")
  const camelParts = splitCamelCase(word);
  if (camelParts !== null && camelParts.length > 1) {
    // Translate each part and preserve its case
    const translatedParts = camelParts.map((part) => {
      const partCasePattern = detectCasePattern(part);
      const partPhonemes = lookupPronunciation(part);
      let translated: string;

      if (partPhonemes) {
        translated = arpabetToFormat(partPhonemes, format);
      } else {
        translated = translateUnknown(part, format);
      }

      if (format === 'ingglish') {
        return applyCasePattern(translated, partCasePattern, part);
      }
      return translated;
    });

    return translatedParts.join('');
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
      // Skip case application if result already has mixed case (e.g., compound words)
      // This prevents re-applying position-based casing to properly-cased compounds
      const resultHasMixedCase =
        fallbackResult !== fallbackResult.toLowerCase() &&
        fallbackResult !== fallbackResult.toUpperCase() &&
        !/^[A-Z][a-z]*$/.test(fallbackResult);
      if (resultHasMixedCase) {
        return fallbackResult;
      }
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

  // Single pass: filter and map together
  const result: TranslatedToken[] = [];
  for (const token of tokens) {
    if (token.length > 0) {
      if (WORD_TEST_REGEX.test(token)) {
        result.push({
          original: token,
          translated: translateWord(token, format),
          isWord: true,
        });
      } else {
        result.push({
          original: token,
          translated: token,
          isWord: false,
        });
      }
    }
  }
  return result;
}
