/**
 * Forward translation: English -> Ingglish/IPA.
 */

import { arpabetToFormat } from '@ingglish/phonemes';
import type { OutputFormat } from '@ingglish/phonemes';
import { lookupPronunciation, getCustomPronunciation } from '@ingglish/dictionary';
import {
  detectCasePattern,
  applyCasePattern,
  splitCamelCase,
  normalizeApostrophes,
  stripDiacritics,
  extractPreservedPatterns,
  restorePreservedPatterns,
} from '@ingglish/normalize';
import { WORD_SPLIT_REGEX, WORD_TEST_REGEX } from '@ingglish/tokenize';
import { translateUnknown, isInitialism, parseInitialismWithSuffix } from '@ingglish/fallback';
import { translateContraction, setTranslateWordFn } from './contractions';
import { expandPlaceholder } from './preserved';

interface TranslateResult {
  translated: string;
  matched: boolean;
}

/**
 * Internal translation that returns both the translated word and whether it
 * was found in a known source (dictionary, contraction, initialism, custom).
 */
function translateWordInternal(word: string, format: OutputFormat): TranslateResult {
  // Handle empty strings
  if (!word) {
    return { translated: word, matched: true };
  }

  // Check if word has any letters to translate
  if (!/[a-zA-Z]/.test(word)) {
    return { translated: word, matched: true };
  }

  // Handle initialisms with suffixes FIRST (IDs, TVs, URLs, API's)
  // This must come before contraction handling to catch possessive initialisms like "API's"
  const initialismWithSuffix = parseInitialismWithSuffix(word);
  if (initialismWithSuffix !== null) {
    const { base, suffix } = initialismWithSuffix;
    const baseTranslated = translateWord(base, format);
    return { translated: baseTranslated + suffix, matched: true };
  }

  // Handle contractions (words with apostrophes)
  if (word.includes("'")) {
    return { translated: translateContraction(word, format), matched: true };
  }

  // Known initialisms (UI, API, HTML, US, etc.) pass through unchanged.
  // They're abbreviations, not words — translating them mangles them.
  if (isInitialism(word)) {
    return { translated: word, matched: true };
  }

  // All-caps words (≥2 chars) pass through unchanged — they're acronyms,
  // abbreviations, or intentional formatting (MQTT, USSR, NATO, HELLO).
  if (word.length >= 2 && /^[A-Z]+$/.test(word)) {
    return { translated: word, matched: true };
  }

  // Handle camelCase words by translating each component separately
  // This preserves case at component boundaries (e.g., "iCloud" -> "ieKlowd")
  const camelParts = splitCamelCase(word);
  if (camelParts !== null && camelParts.length > 1) {
    let allPartsMatched = true;

    // Translate each part and preserve its case
    const translatedParts = camelParts.map((part) => {
      // All-caps parts (≥2 chars) pass through unchanged — acronyms like "GPT" in "ChatGPT"
      if (part.length >= 2 && /^[A-Z]+$/.test(part)) {
        return part;
      }

      const partCasePattern = detectCasePattern(part);
      const partPhonemes = lookupPronunciation(part);
      let translated: string;

      if (partPhonemes) {
        translated = arpabetToFormat(partPhonemes, format);
      } else {
        allPartsMatched = false;
        translated = translateUnknown(part, format);
      }

      if (format === 'ingglish') {
        return applyCasePattern(translated, partCasePattern, part);
      }
      return translated;
    });

    return { translated: translatedParts.join(''), matched: allPartsMatched };
  }

  // Detect case pattern for preservation
  const casePattern = detectCasePattern(word);

  // Custom pronunciations override the dictionary (fixes CMU errors like "hors")
  const customPhonemes = getCustomPronunciation(word.toLowerCase());
  const phonemes = customPhonemes ?? lookupPronunciation(word);

  if (!phonemes) {
    // Try stripping diacritics (café→cafe, naïve→naive) before fallback.
    // This preserves accented forms as pronunciation signals (résumé ≠ resume).
    const stripped = stripDiacritics(word);
    if (stripped !== word) {
      const strippedCustom = getCustomPronunciation(stripped.toLowerCase());
      const strippedPhonemes = strippedCustom ?? lookupPronunciation(stripped);
      if (strippedPhonemes) {
        let strippedResult = arpabetToFormat(strippedPhonemes, format);
        if (format === 'ingglish') {
          strippedResult = applyCasePattern(strippedResult, casePattern, word);
        }
        return { translated: strippedResult, matched: true };
      }
    }

    // Word not found in dictionary - try fallback strategies.
    // Use stripped form so G2P gets clean ASCII (brûlée→brulee, piñata→pinata).
    const fallbackResult = translateUnknown(stripped, format);

    // Return original if fallback failed
    if (!fallbackResult || fallbackResult.length === 0) {
      return { translated: word, matched: false };
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
        return { translated: fallbackResult, matched: false };
      }
      return { translated: applyCasePattern(fallbackResult, casePattern, word), matched: false };
    }
    return { translated: fallbackResult, matched: false };
  }

  let result = arpabetToFormat(phonemes, format);

  // Apply original case pattern (only for Ingglish, IPA doesn't use case)
  if (format === 'ingglish') {
    result = applyCasePattern(result, casePattern, word);
  }

  return { translated: result, matched: true };
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
  return translateWordInternal(word, format).translated;
}

// Register translateWord with contractions module to break circular dependency
setTranslateWordFn(translateWord);

/**
 * Synchronous version of {@link translate}. Dictionary must already be loaded.
 */
export function translateSync(text: string, format: OutputFormat = 'ingglish'): string {
  // Normalize curly apostrophes (diacritics are stripped per-word in translateWord)
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
      const expanded = expandPlaceholder(token, preserved);
      if (expanded) {
        result.push(...expanded);
      } else {
        if (WORD_TEST_REGEX.test(token)) {
          const { translated, matched } = translateWordInternal(token, format);
          result.push({
            original: token,
            translated,
            isWord: true,
            matched,
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
