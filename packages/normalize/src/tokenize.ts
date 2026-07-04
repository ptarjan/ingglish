/**
 * Tokenization utilities for splitting text into word and non-word tokens.
 */

import { normalizeApostrophes } from './text';

// Shared regex patterns for word tokenization (exported for use in dom package)
/** Regex to split text into word and non-word tokens (includes accented Latin chars).
 *  The alphanumeric boundary assertions ensure a letter run is only captured as a
 *  word when it is not adjacent to a digit on either side. A run touching a digit
 *  (an escape sequence like \u2014, an ordinal like "3rd", an identifier like
 *  "win32") is left uncaptured, so it stays in a separator token and passes
 *  through untranslated instead of being partially matched via backtracking. */
export const WORD_SPLIT_REGEX =
  /(?<![0-9a-zA-Z\u00C0-\u024F\u1E00-\u1EFF])([a-zA-Z\u00C0-\u024F\u1E00-\u1EFF']+)(?![0-9a-zA-Z\u00C0-\u024F\u1E00-\u1EFF])/;
/** Regex to test if a token is a word (includes accented Latin chars) */
export const WORD_TEST_REGEX = /^[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF']+$/;

// Common IPA symbols used in phonetic transcription (Set for O(1) lookup).
// Exported for reuse in language detection (core/detect).
export const IPA_SYMBOLS_SET = new Set('əɝɚʌæɑɔɛɪʊðθʃʒŋɹɡ');

/**
 * Extended token with word index for correspondence tracking.
 */
export interface IndexedToken {
  isWord: boolean;
  text: string;
  wordIndex: null | number;
}

/**
 * Token with text content and word/non-word classification.
 */
export interface TextToken {
  isWord: boolean;
  text: string;
}

/**
 * Checks if a character is an IPA phonetic symbol (not punctuation).
 */
export function isIPAChar(char: string): boolean {
  const code = char.codePointAt(0)!;

  // Basic Latin letters (A-Z, a-z)
  if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) {
    return true;
  }

  // Word joiner (U+2060) - invisible character that prevents line breaks
  if (code === 0x20_60) {
    return true;
  }

  // IPA stress markers (ˈ U+02C8, ˌ U+02CC)
  if (code === 0x02_c8 || code === 0x02_cc) {
    return true;
  }

  // Common IPA symbols (O(1) Set lookup)
  if (IPA_SYMBOLS_SET.has(char)) {
    return true;
  }

  return false;
}

/**
 * Checks if a character is a phonetic text character (Ingglish or IPA).
 * This includes Latin letters, accented vowels used in Ingglish stress marking,
 * IPA symbols, stress markers, and apostrophes (for contractions/possessives).
 *
 * Use this for tokenizing mixed Ingglish/IPA text in bidirectional translation.
 */
export function isPhoneticChar(char: string): boolean {
  const code = char.codePointAt(0)!;

  // Basic Latin letters (A-Z, a-z)
  if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) {
    return true;
  }

  // Apostrophe (U+0027) - keeps contractions/possessives as single tokens
  // (matches WORD_SPLIT_REGEX which includes ' in word characters)
  if (code === 0x27) {
    return true;
  }

  // Latin-1 Supplement accented letters (À-ÖØ-öø-ÿ)
  // Used for stress markers in Ingglish (á, é, í, ó, ú)
  if (
    (code >= 0xc0 && code <= 0xd6) ||
    (code >= 0xd8 && code <= 0xf6) ||
    (code >= 0xf8 && code <= 0xff)
  ) {
    return true;
  }

  // Word joiner (U+2060) - invisible character that prevents line breaks
  if (code === 0x20_60) {
    return true;
  }

  // IPA stress markers (ˈ U+02C8, ˌ U+02CC)
  if (code === 0x02_c8 || code === 0x02_cc) {
    return true;
  }

  // Common IPA symbols (O(1) Set lookup)
  if (IPA_SYMBOLS_SET.has(char)) {
    return true;
  }

  return false;
}

/**
 * Tokenizes IPA text into words and non-words (punctuation/whitespace).
 */
export function tokenizeIPA(text: string): TextToken[] {
  const tokens: TextToken[] = [];
  let i = 0;

  while (i < text.length) {
    if (isIPAChar(text[i]!)) {
      // Collect IPA word
      let wordEnd = i + 1;
      while (wordEnd < text.length && isIPAChar(text[wordEnd]!)) {
        wordEnd++;
      }
      tokens.push({ isWord: true, text: text.slice(i, wordEnd) });
      i = wordEnd;
    } else {
      // Collect non-IPA characters (punctuation, whitespace)
      let nonWordEnd = i + 1;
      while (nonWordEnd < text.length && !isIPAChar(text[nonWordEnd]!)) {
        nonWordEnd++;
      }
      tokens.push({ isWord: false, text: text.slice(i, nonWordEnd) });
      i = nonWordEnd;
    }
  }

  return tokens;
}

/**
 * Tokenizes phonetic text (Ingglish or IPA) into words and non-words.
 * Includes word indices for tracking correspondence between translations.
 *
 * Use this for bidirectional translation UIs where you need to highlight
 * corresponding words in both English and translated text.
 */
export function tokenizePhonetic(text: string): IndexedToken[] {
  const tokens: IndexedToken[] = [];
  let wordIndex = 0;
  let i = 0;

  while (i < text.length) {
    if (isPhoneticChar(text[i]!)) {
      // Collect word characters
      let wordEnd = i + 1;
      while (wordEnd < text.length && isPhoneticChar(text[wordEnd]!)) {
        wordEnd++;
      }
      tokens.push({
        isWord: true,
        text: text.slice(i, wordEnd),
        wordIndex: wordIndex++,
      });
      i = wordEnd;
    } else {
      // Collect non-word characters (punctuation, whitespace)
      let nonWordEnd = i + 1;
      while (nonWordEnd < text.length && !isPhoneticChar(text[nonWordEnd]!)) {
        nonWordEnd++;
      }
      tokens.push({
        isWord: false,
        text: text.slice(i, nonWordEnd),
        wordIndex: null,
      });
      i = nonWordEnd;
    }
  }

  return tokens;
}

/**
 * Tokenizes Ingglish/English text into words and non-words.
 * Words are sequences of letters and apostrophes.
 */
export function tokenizeText(text: string): TextToken[] {
  const normalized = normalizeApostrophes(text);
  const parts = normalized.split(WORD_SPLIT_REGEX);

  // Single pass: filter and map together
  const tokens: TextToken[] = [];
  for (const part of parts) {
    if (part.length > 0) {
      tokens.push({ isWord: WORD_TEST_REGEX.test(part), text: part });
    }
  }
  return tokens;
}

/**
 * Tokenizes text written in a Unicode script (e.g. Shavian, Deseret).
 * Splits into alternating word (in-script) and non-word (everything else) tokens.
 *
 * Uses codepoint iteration so supplementary-plane characters are handled correctly.
 */
export function tokenizeUnicodeScript(
  text: string,
  isScriptChar: (char: string) => boolean
): TextToken[] {
  const tokens: TextToken[] = [];
  let current = '';
  let inWord = false;

  for (const char of text) {
    const isScript = isScriptChar(char);
    if (isScript === inWord) {
      current += char;
    } else {
      if (current.length > 0) {
        tokens.push({ isWord: inWord, text: current });
      }
      current = char;
      inWord = isScript;
    }
  }

  if (current.length > 0) {
    tokens.push({ isWord: inWord, text: current });
  }

  return tokens;
}
