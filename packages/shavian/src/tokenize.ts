/**
 * Shavian text tokenization.
 *
 * Splits text containing Shavian characters (U+10450–U+1047F)
 * into word and non-word tokens.
 */

import { tokenizeUnicodeScript, type TextToken } from '@ingglish/normalize';

/**
 * Checks if a character is a Shavian letter.
 * Shavian Unicode range: U+10450–U+1047F.
 */
export function isShavianChar(char: string): boolean {
  const cp = char.codePointAt(0);
  if (cp === undefined) {
    return false;
  }
  return cp >= 0x1_04_50 && cp <= 0x1_04_7f;
}

/**
 * Tokenizes text containing Shavian characters.
 * Splits into alternating word (Shavian) and non-word (everything else) tokens.
 */
export function tokenizeShavian(text: string): TextToken[] {
  return tokenizeUnicodeScript(text, isShavianChar);
}
