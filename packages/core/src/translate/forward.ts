/**
 * Forward translation: English -> Ingglish/IPA.
 *
 * Pipeline: English word → routing (dictionary, initialism, contraction,
 * camelCase, fallback) → ARPAbet `string[]` (the IR) → `arpabetToFormat()` → output.
 *
 * Every code path converges on an ARPAbet phoneme array before converting to
 * the requested output format. See `translateWordInternal()` for routing.
 */

import { lookupPronunciation, lookupPronunciationLower } from '@ingglish/dictionary';
import {
  translateUnknown,
  isInitialism,
  KNOWN_INITIALISMS,
  parseInitialismWithSuffix,
  translateAsAcronym,
} from '@ingglish/fallback';
import { lookupIpa, translateForeign, translateForeignWithMapping } from '@ingglish/ipa';
import type { IpaDict } from '@ingglish/ipa';
import type { CasePattern } from '@ingglish/normalize';
import {
  applyCasePattern,
  detectCasePattern,
  splitCamelCase,
  stripDiacritics,
} from '@ingglish/normalize';
import type { OutputFormat, TranslatedToken } from '@ingglish/phonemes';
import {
  arpabetToFormat,
  getFormatIsLatinScript,
  getFormatPreservesCase,
} from '@ingglish/phonemes';
import type { TranslateOptions } from '../foreign-dict';
import { getForeignDict, isForeignLang } from '../foreign-dict';
import { translateContraction } from './contractions';
import type { TranslateResult } from './pipeline';
import { extractTokens, HAS_LETTER, mapTokens, renderText } from './pipeline';

export type { TranslatedToken } from '@ingglish/phonemes';

/** Returns the loaded foreign dict for a language, or throws if not loaded. */
function requireForeignDict(lang: string): IpaDict {
  const dict = getForeignDict(lang);
  if (!dict) {
    throw new Error(
      `Foreign dictionary for "${lang}" not loaded. Call translate(text, { lang: "${lang}" }) or loadForeignDict("${lang}") first.`
    );
  }
  return dict;
}

// Pre-compiled regex patterns (avoid per-call RegExp object creation)
const ALL_UPPER = /^[A-Z]+$/;
const TRIPLE_CHAR = /(.)\1\1/;
const HAS_VOWEL = /[aeiouy]/i;
const TITLE_CASE = /^[A-Z][a-z]*$/;

// ============================================================================
// Public API
// ============================================================================

/**
 * Synchronous version of {@link translate}. Dictionary must already be loaded.
 *
 * For foreign languages, the dictionary must have been loaded by a prior
 * `await translate(text, { lang })` or `await loadForeignDict(lang)` call.
 */
export function translateSync(text: string, options: TranslateOptions = {}): string {
  const { format = 'ingglish', lang } = options;

  if (isForeignLang(lang)) {
    return translateForeign(text, requireForeignDict(lang), format);
  }

  const { preserved, rawTokens } = extractTokens(text);
  return renderText(rawTokens, preserved, (w) => translateWordString(w, format), format);
}

/**
 * Like {@link translate}, but returns token-by-token mappings instead of a string.
 * Each token includes the original text, translation, and whether it matched
 * the dictionary. Dictionary must already be loaded.
 *
 * For foreign languages, the dictionary must have been loaded by a prior
 * `await translate(text, { lang })` or `await loadForeignDict(lang)` call.
 */
export function translateSyncWithMapping(
  text: string,
  options: TranslateOptions = {}
): TranslatedToken[] {
  const { format = 'ingglish', lang } = options;

  if (isForeignLang(lang)) {
    return translateForeignWithMapping(text, requireForeignDict(lang), format);
  }

  const { preserved, rawTokens } = extractTokens(text);
  return mapTokens(rawTokens, preserved, (w) => translateWordInternal(w, format));
}

/**
 * Translates a single word (or contraction) to the specified format.
 * Handles contractions like "don't", "I'm", etc.
 *
 * For foreign languages, looks up the word in the cached IPA dictionary
 * (must have been loaded by a prior async call).
 *
 * @param word - The word to translate
 * @param options - Translation options (format, lang)
 * @returns The translated word, or the original word if not found
 */
export function translateWord(word: string, options: TranslateOptions = {}): string {
  const { format = 'ingglish', lang } = options;

  if (isForeignLang(lang)) {
    return lookupIpa(requireForeignDict(lang), word) ?? word;
  }

  return translateWordInternal(word, format).translated;
}

// ============================================================================
// Character classification helpers (used by fast paths)
// ============================================================================

/** Returns true if every character is a-z (pure lowercase ASCII). */
function isAllLowerAscii(word: string): boolean {
  for (let i = 0; i < word.length; i++) {
    const c = word.codePointAt(i)!;
    if (c < 97 || c > 122) {
      // outside a-z
      return false;
    }
  }
  return true;
}

/**
 * Checks if a pre-lowered, pure a-z word matches a known initialism pattern.
 * Handles both bare initialisms ("api") and initialism+'s' suffix ("apis").
 * The "'s" suffix from parseInitialismWithSuffix can't match since the key is pure a-z.
 */
function isInitialismLower(key: string): boolean {
  if (KNOWN_INITIALISMS.has(key)) {
    return true;
  }
  // Check initialism + 's' suffix (e.g., "apis" → "api" + "s")
  return key.length > 1 && key.endsWith('s') && KNOWN_INITIALISMS.has(key.slice(0, -1));
}

/** Returns true if word is A-Z followed by one or more a-z (e.g., "The", "Hello"). */
function isTitleCaseAscii(word: string): boolean {
  if (word.length < 2) {
    return false;
  }
  const first = word.codePointAt(0)!;
  if (first < 65 || first > 90) {
    // first char outside A-Z
    return false;
  }
  for (let i = 1; i < word.length; i++) {
    const c = word.codePointAt(i)!;
    if (c < 97 || c > 122) {
      // rest outside a-z
      return false;
    }
  }
  return true;
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
// Core pipeline
// ============================================================================

/**
 * Full translation pipeline returning both the translated word and match status.
 * Used by translateSyncWithMapping (needs match info) and translateWord.
 *
 * Routing order (first match wins):
 *  1. Empty / non-letter tokens → pass through
 *  2. Fast path — pure lowercase ASCII dictionary word (most common)
 *  3. Title-case fast path — The, Hello, World
 *  4. Initialism+suffix — IDs, TVs, API's (before contractions)
 *  5. Contraction — don't, I'm
 *  6. Bare initialism — UI, API, HTML
 *  7. All-caps passthrough — NASA, ASAP (Latin scripts only)
 *  8. CamelCase — iPhone, MacBook, ChatGPT
 *  9. Dictionary lookup — case-insensitive, with diacritics fallback
 * 10. Fallback — compounds, stemming, G2P
 */
function translateWordInternal(word: string, format: OutputFormat): TranslateResult {
  // 1. Empty / non-letter tokens
  if (!word || !HAS_LETTER.test(word)) {
    return { matched: true, translated: word };
  }

  // 2–3. Fast paths for common dictionary words (pure lowercase or title-case)
  const fast = tryFastPath(word, format) ?? tryTitleCaseFastPath(word, format);
  if (fast !== null) {
    return { matched: true, translated: fast };
  }

  const isLatinScript = getFormatIsLatinScript(format);

  // 4. Initialisms with suffixes (IDs, TVs, API's) — must come before contractions
  const initialismSuffix = tryInitialismWithSuffix(word, format, isLatinScript);
  if (initialismSuffix) {
    return initialismSuffix;
  }

  // 5. Contractions (don't, I'm, etc.)
  if (word.includes("'")) {
    return {
      matched: true,
      translated: translateContraction(word, format, (w, f) => translateWord(w, { format: f })),
    };
  }

  // 6. Bare initialisms (UI, API, HTML)
  const initialism = tryInitialism(word, format, isLatinScript);
  if (initialism) {
    return initialism;
  }

  // 7. All-caps words (≥2 chars) pass through for Latin scripts (acronyms, abbreviations)
  if (isLatinScript && word.length >= 2 && ALL_UPPER.test(word)) {
    return { matched: true, translated: word };
  }

  // 8. CamelCase words (iPhone, MacBook, ChatGPT)
  const camel = tryCamelCase(word, format);
  if (camel) {
    return camel;
  }

  // 9. Dictionary / custom pronunciation lookup (with diacritics fallback)
  const casePattern = detectCasePattern(word);
  const dictResult = tryDictionaryLookup(word, format, casePattern);
  if (dictResult) {
    return dictResult;
  }

  // 10. Fallback strategies (compounds, stemming, G2P)
  return translateWithFallback(word, format, casePattern);
}

/**
 * String-only translation for renderText. Tries the fast paths first and
 * returns the translated string directly (avoiding TranslateResult object
 * allocation for the ~80% of words that are simple dictionary lookups).
 * Falls through to the full pipeline for everything else.
 */
function translateWordString(word: string, format: OutputFormat): string {
  if (!word || !HAS_LETTER.test(word)) {
    return word;
  }
  return (
    tryFastPath(word, format) ??
    tryTitleCaseFastPath(word, format) ??
    translateWordInternal(word, format).translated
  );
}

// ============================================================================
// Routing helpers
// ============================================================================

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
  const phonemes = lookupPronunciationLower(wordLower);

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
    const strippedPhonemes = lookupPronunciationLower(strippedLower);
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
 * Pure a-z words exclude camelCase, contractions, and diacritics, so we can skip
 * all those checks and go straight to dictionary lookup.
 * Returns the translated string, or null if the word doesn't qualify.
 */
function tryFastPath(word: string, format: OutputFormat): null | string {
  if (!isAllLowerAscii(word)) {
    return null;
  }
  if (isInitialismLower(word)) {
    return null;
  }
  const phonemes = lookupPronunciationLower(word);
  return phonemes ? arpabetToFormat(phonemes, format) : null;
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
    const baseTranslated = translateWord(parsed.base, { format });
    return { matched: true, translated: baseTranslated + parsed.suffix };
  }
  return null;
}

/**
 * Fast path for title-case words (first char A-Z, rest a-z): "The", "Hello", "World".
 * These are the first word of every sentence — very common in natural text.
 * Returns the translated string, or null if the word doesn't qualify.
 */
function tryTitleCaseFastPath(word: string, format: OutputFormat): null | string {
  if (!isTitleCaseAscii(word)) {
    return null;
  }

  const lower = word.toLowerCase();
  if (isInitialismLower(lower)) {
    return null;
  }

  const phonemes = lookupPronunciationLower(lower);
  if (!phonemes) {
    return null;
  }

  let translated = arpabetToFormat(phonemes, format);
  if (getFormatPreservesCase(format) && translated.length > 0) {
    translated = translated.charAt(0).toUpperCase() + translated.slice(1);
  }
  return translated;
}
