/**
 * Deseret text tokenization.
 *
 * Splits text containing Deseret characters (U+10400–U+1044F)
 * into word and non-word tokens.
 */

import { tokenizeUnicodeScript, type TextToken } from '@ingglish/normalize';

/**
 * Checks if a character is a Deseret letter.
 * Deseret Unicode range: U+10400–U+1044F.
 */
export function isDeseretChar(char: string): boolean {
  const cp = char.codePointAt(0);
  /* v8 ignore start */
  if (cp === undefined) {
    return false;
  }
  /* v8 ignore stop */
  return cp >= 0x1_04_00 && cp <= 0x1_04_4f;
}

/**
 * Tokenizes text containing Deseret characters.
 * Splits into alternating word (Deseret) and non-word (everything else) tokens.
 */
export function tokenizeDeseret(text: string): TextToken[] {
  return tokenizeUnicodeScript(text, isDeseretChar);
}
