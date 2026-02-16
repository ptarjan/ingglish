/**
 * Deseret text tokenization.
 *
 * Splits text containing Deseret characters (U+10400–U+1044F)
 * into word and non-word tokens.
 */

/**
 * Checks if a character is a Deseret letter.
 * Deseret Unicode range: U+10400–U+1044F.
 */
export function isDeseretChar(char: string): boolean {
  const cp = char.codePointAt(0);
  if (cp === undefined) {
    return false;
  }
  return cp >= 0x10400 && cp <= 0x1044f;
}

interface DeseretToken {
  text: string;
  isWord: boolean;
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

    if (isDeseret !== inWord) {
      if (current.length > 0) {
        tokens.push({ text: current, isWord: inWord });
      }
      current = char;
      inWord = isDeseret;
    } else {
      current += char;
    }
  }

  if (current.length > 0) {
    tokens.push({ text: current, isWord: inWord });
  }

  return tokens;
}
