/**
 * Deseret text tokenization.
 *
 * Splits text containing Deseret characters (U+10400–U+1044F)
 * into word and non-word tokens.
 */

interface DeseretToken {
  isWord: boolean;
  text: string;
}

/**
 * Checks if a character is a Deseret letter.
 * Deseret Unicode range: U+10400–U+1044F.
 */
export function isDeseretChar(char: string): boolean {
  const cp = char.codePointAt(0);
  if (cp === undefined) {
    return false;
  }
  return cp >= 0x1_04_00 && cp <= 0x1_04_4f;
}

/**
 * Tokenizes text containing Deseret characters.
 * Splits into alternating word (Deseret) and non-word (everything else) tokens.
 */
export function tokenizeDeseret(text: string): DeseretToken[] {
  const tokens: DeseretToken[] = [];
  let current = '';
  let inWord = false;

  for (const char of text) {
    const isDeseret = isDeseretChar(char);

    if (isDeseret === inWord) {
      current += char;
    } else {
      if (current.length > 0) {
        tokens.push({ isWord: inWord, text: current });
      }
      current = char;
      inWord = isDeseret;
    }
  }

  if (current.length > 0) {
    tokens.push({ isWord: inWord, text: current });
  }

  return tokens;
}
