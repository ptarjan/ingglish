/**
 * Text processing utilities for normalization and tokenization.
 */

/**
 * Normalizes various apostrophe characters to the standard straight apostrophe.
 * Handles: ' (U+2019 right single quotation mark), ' (U+2018 left), ʼ (U+02BC modifier letter)
 */
export function normalizeApostrophes(text: string): string {
  return text.replace(/[\u2018\u2019\u02BC]/g, "'");
}

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

  // Common IPA symbols
  const ipaSymbols = 'əɝɚʌæɑɔɛɪʊðθʃʒŋɹɡ';
  if (ipaSymbols.includes(char)) {
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
  const parts = normalized.split(/(\b[a-zA-Z']+\b)/);

  return parts
    .filter((part) => part.length > 0)
    .map((part) => ({
      text: part,
      isWord: /^[a-zA-Z']+$/.test(part),
    }));
}
