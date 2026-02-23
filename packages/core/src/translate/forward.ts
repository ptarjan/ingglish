/**
 * Forward translation: English -> Ingglish/IPA.
 *
 * Pipeline: English word → routing (dictionary, initialism, contraction,
 * camelCase, fallback) → ARPAbet `string[]` (the IR) → `arpabetToFormat()` → output.
 *
 * Every code path converges on an ARPAbet phoneme array before converting to
 * the requested output format. See `translateWordInternal()` for routing.
 */

import { lookupPronunciation } from '@ingglish/dictionary';
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
  splitCamelCase,
  stripDiacritics,
} from '@ingglish/normalize';
import type { OutputFormat } from '@ingglish/phonemes';
import {
  arpabetToFormat,
  getFormatIsLatinScript,
  getFormatPreservesCase,
} from '@ingglish/phonemes';
import { translateContraction } from './contractions';
import type { TranslateResult } from './pipeline';
import { extractTokens, mapTokens, sentenceCapitalize } from './pipeline';

// Pre-compiled regex patterns (avoid per-call RegExp object creation)
const HAS_LETTER = /[a-z]/i;
const ALL_UPPER = /^[A-Z]+$/;
const TRIPLE_CHAR = /(.)\1\1/;
const HAS_VOWEL = /[aeiouy]/i;
const TITLE_CASE = /^[A-Z][a-z]*$/;

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

/**
 * Synchronous version of {@link translate}. Dictionary must already be loaded.
 */
export function translateSync(text: string, format: OutputFormat = 'ingglish'): string {
  const { preserved, rawTokens } = extractTokens(text);
  const tokens = mapTokens(rawTokens, preserved, (w) => translateWordInternal(w, format));
  const capitalized = sentenceCapitalize(tokens, format);
  return capitalized.map((t) => t.translated).join('');
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
  const { preserved, rawTokens } = extractTokens(text);
  return mapTokens(rawTokens, preserved, (w) => translateWordInternal(w, format));
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
 *
 * Routing order (first match wins):
 *  1. Empty / non-letter tokens → pass through
 *  2. Fast path — pure lowercase ASCII dictionary word (most common)
 *  3. Initialism+suffix — IDs, TVs, API's (before contractions)
 *  4. Contraction — don't, I'm
 *  5. Bare initialism — UI, API, HTML
 *  6. All-caps passthrough — NASA, ASAP (Latin scripts only)
 *  7. CamelCase — iPhone, MacBook, ChatGPT
 *  8. Dictionary lookup — case-insensitive, with diacritics fallback
 *  9. Fallback — compounds, stemming, G2P
 */
function translateWordInternal(word: string, format: OutputFormat): TranslateResult {
  // 1. Empty / non-letter tokens
  if (!word || !HAS_LETTER.test(word)) {
    return { matched: true, translated: word };
  }

  // 2. Fast path for pure lowercase ASCII dictionary words
  const fast = tryFastPath(word, format);
  if (fast) {
    return fast;
  }

  const isLatinScript = getFormatIsLatinScript(format);

  // 3. Initialisms with suffixes (IDs, TVs, API's) — must come before contractions
  const initialismSuffix = tryInitialismWithSuffix(word, format, isLatinScript);
  if (initialismSuffix) {
    return initialismSuffix;
  }

  // 4. Contractions (don't, I'm, etc.)
  if (word.includes("'")) {
    return { matched: true, translated: translateContraction(word, format, translateWord) };
  }

  // 5. Bare initialisms (UI, API, HTML)
  const initialism = tryInitialism(word, format, isLatinScript);
  if (initialism) {
    return initialism;
  }

  // 6. All-caps words (≥2 chars) pass through for Latin scripts (acronyms, abbreviations)
  if (isLatinScript && word.length >= 2 && ALL_UPPER.test(word)) {
    return { matched: true, translated: word };
  }

  // 7. CamelCase words (iPhone, MacBook, ChatGPT)
  const camel = tryCamelCase(word, format);
  if (camel) {
    return camel;
  }

  // 8. Dictionary / custom pronunciation lookup (with diacritics fallback)
  const casePattern = detectCasePattern(word);
  const dictResult = tryDictionaryLookup(word, format, casePattern);
  if (dictResult) {
    return dictResult;
  }

  // 9. Fallback strategies (compounds, stemming, G2P)
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
  const phonemes = lookupPronunciation(wordLower);

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
    const strippedPhonemes = lookupPronunciation(strippedLower);
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
 * Fast path for pure lowercase ASCII dictionary words (most common in natural text).
 * Pure a-z excludes: camelCase (uppercase), contractions (apostrophe), diacritics.
 * Skips initialism, camelCase, contraction, and case-detection checks entirely.
 * Returns null if the word doesn't qualify or isn't in the dictionary.
 */
function tryFastPath(word: string, format: OutputFormat): null | TranslateResult {
  for (let i = 0; i < word.length; i++) {
    const c = word.codePointAt(i)!;
    if (c < 97 || c > 122) {
      return null;
    }
  }
  if (isInitialism(word) || parseInitialismWithSuffix(word) !== null) {
    return null;
  }
  const phonemes = lookupPronunciation(word);
  if (phonemes) {
    return { matched: true, translated: arpabetToFormat(phonemes, format) };
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
