/**
 * Text processing utilities for normalization and tokenization.
 */

// Shared regex patterns for word tokenization (exported for use in dom package)
/** Regex to split text into word and non-word tokens */
export const WORD_SPLIT_REGEX = /(\b[a-zA-Z']+\b)/;
/** Regex to test if a token is a word */
export const WORD_TEST_REGEX = /^[a-zA-Z']+$/;

/**
 * Regex to match URLs (http, https, ftp, file protocols).
 * Matches protocol through end of URL (stops at whitespace or common punctuation at end).
 */
export const URL_REGEX = /(?:https?|ftp|file):\/\/[^\s<>"')\]]+/gi;

/**
 * Regex to match email addresses.
 * Simple pattern: word characters, dots, hyphens, plus before @, domain after.
 */
export const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

/**
 * Regex to match bare domain names (without protocol).
 * Matches common TLDs to avoid false positives like "Dr. Smith".
 * Includes optional path/query after the domain.
 */
export const BARE_DOMAIN_REGEX =
  /\b[a-zA-Z0-9][-a-zA-Z0-9]*(?:\.[a-zA-Z0-9][-a-zA-Z0-9]*)*\.(?:com|org|net|edu|gov|io|co|uk|de|fr|jp|au|ca|ru|ch|it|nl|se|no|es|mil|info|biz|tv|me|app|dev|ai|xyz)\b(?:\/[^\s<>"')\]]*)?/gi;

/**
 * Extracts URLs and emails from text, replacing them with placeholders.
 * Returns the modified text and a map to restore originals.
 * Placeholders use non-alphanumeric characters to avoid being split by word regex.
 */
export function extractPreservedPatterns(text: string): {
  text: string;
  preserved: Map<string, string>;
} {
  const preserved = new Map<string, string>();
  let counter = 0;

  // Replace URLs first (they may contain email-like patterns)
  // Use \x00 (null) and \x01 (SOH) to create non-word placeholders
  let result = text.replace(URL_REGEX, (match) => {
    const placeholder = `\x00\x01${counter++}\x01\x00`;
    preserved.set(placeholder, match);
    return placeholder;
  });

  // Replace emails
  result = result.replace(EMAIL_REGEX, (match) => {
    const placeholder = `\x00\x01${counter++}\x01\x00`;
    preserved.set(placeholder, match);
    return placeholder;
  });

  // Replace bare domains (after URLs and emails to avoid double-matching)
  result = result.replace(BARE_DOMAIN_REGEX, (match) => {
    const placeholder = `\x00\x01${counter++}\x01\x00`;
    preserved.set(placeholder, match);
    return placeholder;
  });

  return { text: result, preserved };
}

/**
 * Restores preserved patterns (URLs, emails) from placeholders.
 */
export function restorePreservedPatterns(text: string, preserved: Map<string, string>): string {
  let result = text;
  for (const [placeholder, original] of preserved) {
    result = result.replace(placeholder, original);
  }
  return result;
}

/**
 * Normalizes various apostrophe characters to the standard straight apostrophe.
 * Handles: ' (U+2019 right single quotation mark), ' (U+2018 left), ʼ (U+02BC modifier letter)
 */
export function normalizeApostrophes(text: string): string {
  return text.replace(/[\u2018\u2019\u02BC]/g, "'");
}

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
 * IPA symbols, and stress markers.
 *
 * Use this for tokenizing mixed Ingglish/IPA text in bidirectional translation.
 */
export function isPhoneticChar(char: string): boolean {
  const code = char.charCodeAt(0);

  // Basic Latin letters (A-Z, a-z)
  if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) {
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
    if (isIPAChar(text[i])) {
      // Collect IPA word
      let wordEnd = i + 1;
      while (wordEnd < text.length && isIPAChar(text[wordEnd])) {
        wordEnd++;
      }
      tokens.push({ text: text.slice(i, wordEnd), isWord: true });
      i = wordEnd;
    } else {
      // Collect non-IPA characters (punctuation, whitespace)
      let nonWordEnd = i + 1;
      while (nonWordEnd < text.length && !isIPAChar(text[nonWordEnd])) {
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
    if (isPhoneticChar(text[i])) {
      // Collect word characters
      let wordEnd = i + 1;
      while (wordEnd < text.length && isPhoneticChar(text[wordEnd])) {
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
      while (nonWordEnd < text.length && !isPhoneticChar(text[nonWordEnd])) {
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
