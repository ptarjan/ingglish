/**
 * Tokenization utilities for splitting text into word and non-word tokens.
 */

import { normalizeApostrophes } from '@ingglish/normalize';

// Shared regex patterns for word tokenization (exported for use in dom package)
/** Regex to split text into word and non-word tokens (includes accented Latin chars).
 *  Digit lookaround prevents matching letters in escape sequences like \u2014. */
export const WORD_SPLIT_REGEX = /((?<!\d)[a-zA-Z\u00C0-\u024F']+(?!\d))/;
/** Regex to test if a token is a word (includes accented Latin chars) */
export const WORD_TEST_REGEX = /^[a-zA-Z\u00C0-\u024F']+$/;

// Common IPA symbols used in phonetic transcription (Set for O(1) lookup)
const IPA_SYMBOLS_SET = new Set('əɝɚʌæɑɔɛɪʊðθʃʒŋɹɡ');

/**
 * Checks if a character is an IPA phonetic symbol (not punctuation).
 */
export function isIPAChar(char: string): boolean {
  const code = char.charCodeAt(0);

  // Basic Latin letters (A-Z, a-z)
  if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) {
    return true;
  }

  // Word joiner (U+2060) - invisible character that prevents line breaks
  if (code === 0x2060) {
    return true;
  }

  // IPA stress markers (ˈ U+02C8, ˌ U+02CC)
  if (code === 0x02c8 || code === 0x02cc) {
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
  const code = char.charCodeAt(0);

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
  if (code === 0x2060) {
    return true;
  }

  // IPA stress markers (ˈ U+02C8, ˌ U+02CC)
  if (code === 0x02c8 || code === 0x02cc) {
    return true;
  }

  // Common IPA symbols (O(1) Set lookup)
  if (IPA_SYMBOLS_SET.has(char)) {
    return true;
  }

  return false;
}

/**
 * Token with text content and word/non-word classification.
 */
export interface TextToken {
  text: string;
  isWord: boolean;
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
      tokens.push({ text: text.slice(i, wordEnd), isWord: true });
      i = wordEnd;
    } else {
      // Collect non-IPA characters (punctuation, whitespace)
      let nonWordEnd = i + 1;
      while (nonWordEnd < text.length && !isIPAChar(text[nonWordEnd]!)) {
        nonWordEnd++;
      }
      tokens.push({ text: text.slice(i, nonWordEnd), isWord: false });
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
      tokens.push({ text: part, isWord: WORD_TEST_REGEX.test(part) });
    }
  }
  return tokens;
}

/**
 * Extended token with word index for correspondence tracking.
 */
export interface IndexedToken {
  text: string;
  isWord: boolean;
  wordIndex: number | null;
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
        text: text.slice(i, wordEnd),
        isWord: true,
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
        text: text.slice(i, nonWordEnd),
        isWord: false,
        wordIndex: null,
      });
      i = nonWordEnd;
    }
  }

  return tokens;
}
