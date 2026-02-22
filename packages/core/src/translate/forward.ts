/**
 * Forward translation: English -> Ingglish/IPA.
 */

import { lookupPronunciation, getCustomPronunciation } from '@ingglish/dictionary';
import {
  translateUnknown,
  isInitialism,
  parseInitialismWithSuffix,
  translateAsAcronym,
} from '@ingglish/fallback';
import type { CasePattern } from '@ingglish/normalize';
import {
  applyCasePattern,
  detectCasePattern,
  extractPreservedPatterns,
  normalizeApostrophes,
  restorePreservedPatterns,
  splitCamelCase,
  stripDiacritics,
  WORD_SPLIT_REGEX,
  WORD_TEST_REGEX,
} from '@ingglish/normalize';
import type { OutputFormat } from '@ingglish/phonemes';
import {
  arpabetToFormat,
  getFormatIsLatinScript,
  getFormatPreservesCase,
} from '@ingglish/phonemes';
import { translateContraction } from './contractions';
import { expandPlaceholder } from './preserved';

// Pre-compiled regex patterns (avoid per-call RegExp object creation)
const HAS_LETTER = /[a-z]/i;
const ALL_UPPER = /^[A-Z]+$/;
const TRIPLE_CHAR = /(.)\1\1/;
const HAS_VOWEL = /[aeiouy]/i;
const TITLE_CASE = /^[A-Z][a-z]*$/;
const SENTENCE_END = /[.?!]/;

/**
 * A single token from a translated text, preserving the mapping between
 * original and translated forms. Used by both forward and reverse translation.
 */
export interface TranslatedToken {
  /** Whether this token is a word (true) or punctuation/whitespace (false). */
  isWord: boolean;
  /** Whether the word was found in the dictionary (false = heuristic fallback). */
  matched: boolean;
  /** The original text of this token (English for forward, Ingglish for reverse). */
  original: string;
  /** The translated text (Ingglish for forward, English for reverse). */
  translated: string;
}

// ============================================================================
// Word Translation Helpers
// ============================================================================

interface TranslateResult {
  matched: boolean;
  translated: string;
}

/**
 * Synchronous version of {@link translate}. Dictionary must already be loaded.
 */
export function translateSync(text: string, format: OutputFormat = 'ingglish'): string {
  // Normalize curly apostrophes (diacritics are stripped per-word in translateWord)
  const normalizedText = normalizeApostrophes(text);

  // Extract URLs and emails to preserve them unchanged
  const { preserved, text: textWithPlaceholders } = extractPreservedPatterns(normalizedText);

  // Split on word boundaries, preserving punctuation, numbers, whitespace
  const tokens = textWithPlaceholders.split(WORD_SPLIT_REGEX);

  // Track sentence boundaries to capitalize the first word of each sentence.
  // Start as true so the very first word gets capitalized (beginning of text = sentence start).
  // Only applies to multi-word text to avoid changing single-word translation behavior.
  let wordCount = 0;
  for (const t of tokens) {
    if (WORD_TEST_REGEX.test(t) && ++wordCount > 1) {
      break;
    }
  }
  const hasMultipleWords = wordCount > 1;
  let sentenceStart = hasMultipleWords;

  const translated = tokens
    .map((token) => {
      // Only translate if it's a word (contains letters)
      if (WORD_TEST_REGEX.test(token)) {
        let result = translateWord(token, format);
        // Capitalize first word of each sentence
        if (sentenceStart && getFormatPreservesCase(format) && result.length > 0) {
          result = result.charAt(0).toUpperCase() + result.slice(1);
        }
        sentenceStart = false;
        return result;
      }
      // Detect sentence-ending punctuation
      if (hasMultipleWords && SENTENCE_END.test(token)) {
        sentenceStart = true;
      }
      return token;
    })
    .join('');

  // Restore URLs and emails
  return restorePreservedPatterns(translated, preserved);
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
  const { preserved, text: textWithPlaceholders } = extractPreservedPatterns(normalizedText);
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
          const { matched, translated } = translateWordInternal(token, format);
          result.push({
            isWord: true,
            matched,
            original: token,
            translated,
          });
        } else {
          result.push({
            isWord: false,
            matched: true,
            original: token,
            translated: token,
          });
        }
      }
    }
  }
  return result;
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

/**
 * Translate an unknown word using fallback strategies (compounds, stemming, G2P, etc.).
 * Pass-through words that are clearly non-words (triple chars, no vowels).
 */
function translateWithFallback(
  word: string,
  format: OutputFormat,
  casePattern: CasePattern
): TranslateResult {
  // Pass through obvious non-words before running G2P:
  // - 3+ consecutive identical characters (e.g., "sssss", "hellooo")
  // - no vowels (a/e/i/o/u/y) — real vowelless words (hmm, shh) are in the dictionary
  if (TRIPLE_CHAR.test(word) || !HAS_VOWEL.test(word)) {
    return { matched: false, translated: word };
  }

  // Use stripped form so G2P gets clean ASCII (brûlée→brulee, piñata→pinata)
  const stripped = stripDiacritics(word);
  const fallbackResult = translateUnknown(stripped, format);

  if (!fallbackResult || fallbackResult.length === 0) {
    return { matched: false, translated: word };
  }

  if (getFormatPreservesCase(format)) {
    // Skip case application if result already has mixed case (e.g., compound words)
    const hasInternalMixedCase =
      fallbackResult !== fallbackResult.toLowerCase() &&
      fallbackResult !== fallbackResult.toUpperCase() &&
      !TITLE_CASE.test(fallbackResult);
    if (hasInternalMixedCase) {
      return { matched: false, translated: fallbackResult };
    }
    return { matched: false, translated: applyCasePattern(fallbackResult, casePattern, word) };
  }
  return { matched: false, translated: fallbackResult };
}

// ============================================================================
// Main Translation Pipeline
// ============================================================================

/**
 * Internal translation that returns both the translated word and whether it
 * was found in a known source (dictionary, contraction, initialism, custom).
 */
function translateWordInternal(word: string, format: OutputFormat): TranslateResult {
  if (!word || !HAS_LETTER.test(word)) {
    return { matched: true, translated: word };
  }

  const isLatinScript = getFormatIsLatinScript(format);

  // Initialisms with suffixes (IDs, TVs, API's) — must come before contractions
  const initialismSuffix = tryInitialismWithSuffix(word, format, isLatinScript);
  if (initialismSuffix) {
    return initialismSuffix;
  }

  // Contractions (don't, I'm, etc.)
  if (word.includes("'")) {
    return { matched: true, translated: translateContraction(word, format, translateWord) };
  }

  // Bare initialisms (UI, API, HTML)
  const initialism = tryInitialism(word, format, isLatinScript);
  if (initialism) {
    return initialism;
  }

  // All-caps words (≥2 chars) pass through for Latin scripts (acronyms, abbreviations)
  if (isLatinScript && word.length >= 2 && ALL_UPPER.test(word)) {
    return { matched: true, translated: word };
  }

  // CamelCase words (iPhone, MacBook, ChatGPT)
  const camel = tryCamelCase(word, format);
  if (camel) {
    return camel;
  }

  // Dictionary / custom pronunciation lookup (with diacritics fallback)
  const casePattern = detectCasePattern(word);
  const dictResult = tryDictionaryLookup(word, format, casePattern);
  if (dictResult) {
    return dictResult;
  }

  // Fallback strategies (compounds, stemming, G2P)
  return translateWithFallback(word, format, casePattern);
}

/**
 * Handle camelCase words by translating each component separately.
 * Returns null if not camelCase.
 */
function tryCamelCase(word: string, format: OutputFormat): null | TranslateResult {
  const parts = splitCamelCase(word);
  if (parts === null || parts.length <= 1) {
    return null;
  }

  let allMatched = true;
  const translatedParts = parts.map((part) => {
    // All-caps parts (≥2 chars) pass through unchanged — acronyms like "GPT" in "ChatGPT"
    if (part.length >= 2 && ALL_UPPER.test(part)) {
      return part;
    }
    const partCase = detectCasePattern(part);
    const phonemes = lookupPronunciation(part);
    let translated: string;
    if (phonemes) {
      translated = arpabetToFormat(phonemes, format);
    } else {
      allMatched = false;
      translated = translateUnknown(part, format);
    }
    return getFormatPreservesCase(format)
      ? applyCasePattern(translated, partCase, part)
      : translated;
  });

  return { matched: allMatched, translated: translatedParts.join('') };
}

/**
 * Look up a word in custom pronunciations or the dictionary.
 * Tries stripping diacritics as a fallback (café→cafe, naïve→naive).
 * Returns null if not found in any dictionary.
 */
function tryDictionaryLookup(
  word: string,
  format: OutputFormat,
  casePattern: CasePattern
): null | TranslateResult {
  const wordLower = word.toLowerCase();
  const phonemes = getCustomPronunciation(wordLower) ?? lookupPronunciation(wordLower);

  if (phonemes) {
    let result = arpabetToFormat(phonemes, format);
    if (getFormatPreservesCase(format)) {
      result = applyCasePattern(result, casePattern, word);
    }
    return { matched: true, translated: result };
  }

  // Try stripping diacritics (café→cafe, naïve→naive) before fallback
  const stripped = stripDiacritics(word);
  if (stripped !== word) {
    const strippedLower = stripped.toLowerCase();
    const strippedPhonemes =
      getCustomPronunciation(strippedLower) ?? lookupPronunciation(strippedLower);
    if (strippedPhonemes) {
      let result = arpabetToFormat(strippedPhonemes, format);
      if (getFormatPreservesCase(format)) {
        result = applyCasePattern(result, casePattern, word);
      }
      return { matched: true, translated: result };
    }
  }

  return null;
}

/**
 * Handle bare initialisms (UI, API, HTML, etc.).
 * Returns null if not an initialism or if it should fall through.
 */
function tryInitialism(
  word: string,
  format: OutputFormat,
  isLatinScript: boolean
): null | TranslateResult {
  if (!isInitialism(word)) {
    return null;
  }
  if (isLatinScript) {
    return { matched: true, translated: word };
  }
  if (word === word.toUpperCase()) {
    return { matched: true, translated: translateAsAcronym(word, format) };
  }
  return null;
}

/**
 * Handle initialisms with suffixes like IDs, TVs, URLs, API's.
 * Returns null if not an initialism+suffix.
 */
function tryInitialismWithSuffix(
  word: string,
  format: OutputFormat,
  isLatinScript: boolean
): null | TranslateResult {
  const parsed = parseInitialismWithSuffix(word);
  if (parsed === null) {
    return null;
  }
  // For Latin scripts, all initialism+suffix forms pass through.
  // For non-Latin scripts, only uppercase bases are initialisms —
  // lowercase "it's" should fall through to contraction handling.
  if (isLatinScript || parsed.base === parsed.base.toUpperCase()) {
    const baseTranslated = translateWord(parsed.base, format);
    return { matched: true, translated: baseTranslated + parsed.suffix };
  }
  return null;
}
