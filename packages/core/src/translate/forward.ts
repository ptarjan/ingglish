/**
 * Forward translation: English -> Ingglish/IPA.
 */

import { arpabetToFormat } from '../convert/to-ingglish';
import { lookupPronunciation } from '../dictionary/lookup';
import { detectCasePattern, applyCasePattern, splitCamelCase } from '../utils/case';
import {
  normalizeApostrophes,
  WORD_SPLIT_REGEX,
  WORD_TEST_REGEX,
  extractPreservedPatterns,
  restorePreservedPatterns,
} from '../utils/text';
import { translateContraction, setTranslateWordFn } from './contractions';
import { isInitialism, translateInitialism, setInitialismTranslateWordFn } from './initialisms';
import type { OutputFormat } from '../types';

// Import translateUnknown and translateAsAcronym for fallback handling
import { translateUnknown, translateAsAcronym } from '../fallback';

// Common suffixes for initialisms (plural, possessive)
const INITIALISM_SUFFIXES = ["'s", 's'] as const;

/**
 * Checks if a word is an initialism with a suffix (e.g., "IDs", "TVs", "URLs", "API's").
 * Returns the base initialism and suffix if matched, null otherwise.
 */
function parseInitialismWithSuffix(word: string): { base: string; suffix: string } | null {
  for (const suffix of INITIALISM_SUFFIXES) {
    if (word.length > suffix.length && word.endsWith(suffix)) {
      const base = word.slice(0, -suffix.length);
      if (isInitialism(base)) {
        return { base, suffix };
      }
    }
  }
  return null;
}

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

  // Handle initialisms with suffixes FIRST (IDs, TVs, URLs, API's)
  // This must come before contraction handling to catch possessive initialisms like "API's"
  const initialismWithSuffix = parseInitialismWithSuffix(word);
  if (initialismWithSuffix !== null) {
    const { base, suffix } = initialismWithSuffix;
    const baseTranslated = translateWord(base, format);
    // Keep suffix lowercase for Ingglish (IDs → Aidees, TVs → Teevees)
    if (format === 'ingglish') {
      return baseTranslated + suffix.toLowerCase();
    }
    return baseTranslated + suffix;
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
 * Synchronous version of {@link translate}. Dictionary must already be loaded.
 */
export function translateSync(text: string, format: OutputFormat = 'ingglish'): string {
  // Normalize curly apostrophes to straight ones
  const normalizedText = normalizeApostrophes(text);

  // Extract URLs and emails to preserve them unchanged
  const { text: textWithPlaceholders, preserved } = extractPreservedPatterns(normalizedText);

  // Split on word boundaries, preserving punctuation, numbers, whitespace
  const tokens = textWithPlaceholders.split(WORD_SPLIT_REGEX);

  // Track sentence boundaries to capitalize the first word of each sentence.
  // Start as true so the very first word gets capitalized (beginning of text = sentence start).
  // Only applies to multi-word text to avoid changing single-word translation behavior.
  const hasMultipleWords = tokens.filter((t) => WORD_TEST_REGEX.test(t)).length > 1;
  let sentenceStart = hasMultipleWords;

  const translated = tokens
    .map((token) => {
      // Only translate if it's a word (contains letters)
      if (WORD_TEST_REGEX.test(token)) {
        let result = translateWord(token, format);
        // Capitalize first word of each sentence
        if (sentenceStart && format === 'ingglish' && result.length > 0) {
          result = result.charAt(0).toUpperCase() + result.slice(1);
        }
        sentenceStart = false;
        return result;
      }
      // Detect sentence-ending punctuation
      if (hasMultipleWords && /[.?!]/.test(token)) {
        sentenceStart = true;
      }
      return token;
    })
    .join('');

  // Restore URLs and emails
  return restorePreservedPatterns(translated, preserved);
}

/**
 * A single token from a translated text, preserving the mapping between
 * original and translated forms. Used by both forward and reverse translation.
 */
export interface TranslatedToken {
  /** The original text of this token (English for forward, Ingglish for reverse). */
  original: string;
  /** The translated text (Ingglish for forward, English for reverse). */
  translated: string;
  /** Whether this token is a word (true) or punctuation/whitespace (false). */
  isWord: boolean;
  /** Whether the word was found in the dictionary (false = heuristic fallback). */
  matched: boolean;
}

/**
 * Checks if a word has a known translation (dictionary, contraction, or initialism).
 * Words that fail this check are translated via heuristic fallbacks.
 */
function isWordKnown(word: string): boolean {
  if (!word || !/[a-zA-Z]/.test(word)) {
    return true;
  }
  if (parseInitialismWithSuffix(word) !== null) {
    return true;
  }
  if (word.includes("'")) {
    return true;
  }
  if (isInitialism(word)) {
    return true;
  }
  const camelParts = splitCamelCase(word);
  if (camelParts !== null && camelParts.length > 1) {
    return camelParts.every((part) => lookupPronunciation(part) !== null);
  }
  return lookupPronunciation(word) !== null;
}

/**
 * Like {@link translate}, but returns token-by-token mappings instead of a string.
 * Each token includes the original text, translation, and whether it matched
 * the dictionary. Dictionary must already be loaded.
 */
export function translateSyncWithMapping(
  text: string,
  format: OutputFormat = 'ingglish'
): TranslatedToken[] {
  const normalizedText = normalizeApostrophes(text);

  // Extract URLs and emails to preserve them unchanged
  const { text: textWithPlaceholders, preserved } = extractPreservedPatterns(normalizedText);
  const tokens = textWithPlaceholders.split(WORD_SPLIT_REGEX);

  // Single pass: filter and map together
  const result: TranslatedToken[] = [];
  for (const token of tokens) {
    if (token.length > 0) {
      // Check if this token contains a placeholder for a preserved pattern
      let foundPlaceholder = false;
      for (const [placeholder, original] of preserved) {
        if (token.includes(placeholder)) {
          // Token contains a placeholder - split it and handle parts
          const parts = token.split(placeholder);
          // Add leading non-placeholder part if present
          if (parts[0].length > 0) {
            result.push({
              original: parts[0],
              translated: parts[0],
              isWord: false,
              matched: true,
            });
          }
          // Add the preserved URL/email
          result.push({
            original: original,
            translated: original,
            isWord: false,
            matched: true,
          });
          // Add trailing non-placeholder part if present
          if (parts[1] && parts[1].length > 0) {
            result.push({
              original: parts[1],
              translated: parts[1],
              isWord: false,
              matched: true,
            });
          }
          foundPlaceholder = true;
          break;
        }
      }
      if (!foundPlaceholder) {
        if (WORD_TEST_REGEX.test(token)) {
          result.push({
            original: token,
            translated: translateWord(token, format),
            isWord: true,
            matched: isWordKnown(token),
          });
        } else {
          result.push({
            original: token,
            translated: token,
            isWord: false,
            matched: true,
          });
        }
      }
    }
  }
  return result;
}
