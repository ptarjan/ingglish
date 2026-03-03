/**
 * Forward translation: text → Ingglish/IPA (all languages).
 *
 * Unified pipeline — one code path for every language:
 *   text → [preprocess] → extractTokens → renderText → output
 *
 * Word pipeline (all languages):
 *   fast paths → initialisms → camelCase → lookupDict (overrides, dict,
 *   word resolvers, apostrophe splitting, confident G2P) → low-confidence
 *   G2P fallback → pass-through
 *
 * Every code path converges on an ARPAbet phoneme array before converting to
 * the requested output format.
 */

import {
  translateUnknown,
  isInitialism,
  KNOWN_INITIALISMS,
  parseInitialismWithSuffix,
  translateAsAcronym,
} from '@ingglish/fallback';
import { G2P_CONVERTERS, lookupDict, NOT_FOUND_MARKER, type PhoneDict } from '@ingglish/ipa';
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
import type { TranslateOptions } from '../dict-loader';
import { getLangDict } from '../dict-loader';
import type { TranslateResult } from './pipeline';
import { extractTokens, extractTokensUnicode, HAS_LETTER, mapTokens, renderText } from './pipeline';

export type { TranslatedToken } from '@ingglish/phonemes';

/** Returns the loaded dict for a language, or throws if not loaded. */
function requireLangDict(lang: string): PhoneDict {
  const dict = getLangDict(lang);
  if (!dict) {
    throw new Error(
      `Dictionary for "${lang}" not loaded. Call translate(text, { lang: "${lang}" }) or loadLangDict("${lang}") first.`
    );
  }
  return dict;
}

// Pre-compiled regex patterns (avoid per-call RegExp object creation)
const ALL_UPPER = /^[A-Z]+$/;
const TRIPLE_CHAR = /(.)\1\1/;
const HAS_VOWEL = /[aeiouy]/i;
const TITLE_CASE = /^[A-Z][a-z]*$/;

/**
 * Synchronous forward translation. Dictionary must already be loaded.
 *
 * All languages go through the same pipeline:
 *   text → [preprocess] → extractTokens → renderText → output
 */
export function translateSync(text: string, options: TranslateOptions = {}): string {
  const { format = 'ingglish', lang } = options;
  const effectiveLang = lang !== undefined && lang !== '' ? lang : 'en';
  const dict = requireLangDict(effectiveLang);

  // Pre-processing (e.g. Khmer word segmentation)
  const processed = dict.preprocess === undefined ? text : dict.preprocess(text);

  // Tokenize: Unicode for non-Latin scripts, Latin-aware for everything else
  const { preserved, rawTokens } =
    dict.nonLatinScript === true ? extractTokensUnicode(processed) : extractTokens(processed);

  return renderText(rawTokens, preserved, (w) => translateWordString(w, dict, format), format);
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Like {@link translate}, but returns token-by-token mappings instead of a string.
 * Each token includes the original text, translation, and whether it matched
 * the dictionary. Dictionary must already be loaded.
 */
export function translateSyncWithMapping(
  text: string,
  options: TranslateOptions = {}
): TranslatedToken[] {
  const { format = 'ingglish', lang } = options;
  const effectiveLang = lang !== undefined && lang !== '' ? lang : 'en';
  const dict = requireLangDict(effectiveLang);

  const processed = dict.preprocess === undefined ? text : dict.preprocess(text);

  const { preserved, rawTokens } =
    dict.nonLatinScript === true ? extractTokensUnicode(processed) : extractTokens(processed);

  return mapTokens(rawTokens, preserved, (w) => translateWordInternal(w, dict, format));
}

/**
 * Translates a single word (or contraction) to the specified format.
 *
 * @param word - The word to translate
 * @param options - Translation options (format, lang)
 * @returns The translated word, or the original word if not found
 */
export function translateWord(word: string, options: TranslateOptions = {}): string {
  const { format = 'ingglish', lang } = options;
  const effectiveLang = lang !== undefined && lang !== '' ? lang : 'en';
  const dict = requireLangDict(effectiveLang);
  return translateWordInternal(word, dict, format).translated;
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

// ============================================================================
// Unified word translation
// ============================================================================

/** Convert ARPAbet to format, respecting dict's R-coloring setting. */
function toFormat(phonemes: string[], format: OutputFormat, dict: PhoneDict): string {
  return arpabetToFormat(phonemes, format, { disableRColoring: dict.disableRColoring });
}

// ============================================================================
// Low-confidence G2P fallback
// ============================================================================

/**
 * Translate an unknown word using low-confidence G2P (e.g. English NRL rules).
 * Also uses the existing translateUnknown fallback which includes custom
 * pronunciations and initialism spelling.
 * Pass-through words that are clearly non-words (triple chars, no vowels).
 */
function translateWithLowConfidenceG2P(
  word: string,
  format: OutputFormat,
  casePattern: ReturnType<typeof detectCasePattern>
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

/**
 * Full translation pipeline returning both the translated word and match status.
 * Used by translateSyncWithMapping (needs match info) and translateWord.
 *
 * Routing order (first match wins):
 *  1. Empty / non-letter tokens → pass through
 *  2. Fast path — pure lowercase ASCII dictionary word (most common)
 *  3. Title-case fast path — The, Hello, World
 *  4. Initialism+suffix — IDs, TVs, API's (before contractions)
 *  5. Bare initialism — UI, API, HTML
 *  6. All-caps passthrough — NASA, ASAP (Latin scripts only)
 *  7. CamelCase — iPhone, MacBook, ChatGPT
 *  8. lookupDict — unified (overrides, dict, word resolvers, apostrophe splitting, confident G2P)
 *  9. Low-confidence G2P fallback (English NRL rules)
 */
function translateWordInternal(
  word: string,
  dict: PhoneDict,
  format: OutputFormat
): TranslateResult {
  // 1. Empty / non-letter tokens
  if (!word || !HAS_LETTER.test(word)) {
    return { matched: true, translated: word };
  }

  // 2–3. Fast paths for common dictionary words (pure lowercase or title-case)
  const fast = tryFastPath(word, dict, format) ?? tryTitleCaseFastPath(word, dict, format);
  if (fast !== null) {
    return { matched: true, translated: fast };
  }

  const isLatinScript = getFormatIsLatinScript(format);

  // 4. Initialisms with suffixes (IDs, TVs, API's) — must come before contractions
  const initialismSuffix = tryInitialismWithSuffix(word, format, isLatinScript);
  if (initialismSuffix) {
    return initialismSuffix;
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
  const camel = tryCamelCase(word, dict, format);
  if (camel) {
    return camel;
  }

  // 8. lookupDict — unified lookup (overrides, dict, word resolvers, apostrophe splitting, confident G2P)
  const casePattern = detectCasePattern(word);
  const phonemes = lookupDict(dict, word);
  if (phonemes) {
    let translated = toFormat(phonemes, format, dict);
    if (getFormatPreservesCase(format)) {
      // I-contractions (I'm, I'll, I've, I'd) should be lowercase
      // because "I" is only capitalized in English by convention, not phonetically special
      translated = word.startsWith("I'")
        ? translated.toLowerCase()
        : applyCasePattern(translated, casePattern, word);
    }
    return { matched: true, translated };
  }

  // 9. Low-confidence G2P fallback (e.g. English NRL rules)
  const g2p = G2P_CONVERTERS[dict.lang];
  if (g2p && !g2p.confident) {
    return translateWithLowConfidenceG2P(word, format, casePattern);
  }

  // Not found — return original word
  return { matched: false, translated: word };
}

// ============================================================================
// String-only fast path for renderText
// ============================================================================

/**
 * String-only translation for renderText. Tries the fast paths first and
 * returns the translated string directly (avoiding TranslateResult object
 * allocation for the ~80% of words that are simple dictionary lookups).
 * Falls through to the full pipeline for everything else.
 */
function translateWordString(word: string, dict: PhoneDict, format: OutputFormat): string {
  if (!word || !HAS_LETTER.test(word)) {
    return word;
  }
  const fast = tryFastPath(word, dict, format) ?? tryTitleCaseFastPath(word, dict, format);
  if (fast !== null) {
    return fast;
  }
  const result = translateWordInternal(word, dict, format);
  // For languages with low-confidence G2P (English), unmatched words still have
  // a useful G2P translation. Only prepend NOT_FOUND_MARKER when the word truly
  // couldn't be translated (matched=false AND no G2P fallback was applied).
  if (!result.matched && result.translated === word) {
    return NOT_FOUND_MARKER + word;
  }
  return result.translated;
}

/**
 * Handle camelCase words by translating each component separately.
 * Returns null if not camelCase.
 */
function tryCamelCase(word: string, dict: PhoneDict, format: OutputFormat): null | TranslateResult {
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
    const phonemes = lookupDict(dict, part);
    let translated: string;
    if (phonemes) {
      translated = toFormat(phonemes, format, dict);
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

// ============================================================================
// Routing helpers
// ============================================================================

/**
 * Fast path for pure lowercase ASCII dictionary words (most common in natural text).
 * Pure a-z words exclude camelCase, contractions, and diacritics, so we can skip
 * all those checks and go straight to dictionary lookup.
 * Returns the translated string, or null if the word doesn't qualify.
 */
function tryFastPath(word: string, dict: PhoneDict, format: OutputFormat): null | string {
  if (!isAllLowerAscii(word)) {
    return null;
  }
  if (isInitialismLower(word)) {
    return null;
  }
  const phonemes = dict.entries[word];
  return phonemes ? toFormat(phonemes, format, dict) : null;
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
function tryTitleCaseFastPath(word: string, dict: PhoneDict, format: OutputFormat): null | string {
  if (!isTitleCaseAscii(word)) {
    return null;
  }

  const lower = word.toLowerCase();
  if (isInitialismLower(lower)) {
    return null;
  }

  const phonemes = dict.entries[lower];
  if (!phonemes) {
    return null;
  }

  let translated = toFormat(phonemes, format, dict);
  if (getFormatPreservesCase(format) && translated.length > 0) {
    translated = translated.charAt(0).toUpperCase() + translated.slice(1);
  }
  return translated;
}
