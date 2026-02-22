/**
 * Deseret to ARPAbet/English conversion.
 *
 * Converts Deseret script back to ARPAbet phonemes, then looks up
 * English words in the dictionary.
 */

import { lookupPhonemeKey, sortByFrequency } from '@ingglish/dictionary';
import type { ReverseToken } from '@ingglish/phonemes';
import { DESERET_TO_ARPABET_MAP } from './deseret-maps';
import { isDeseretChar, tokenizeDeseret } from './tokenize';

/**
 * Converts a Deseret string to ARPAbet phonemes.
 * Iterates Unicode codepoints and expands ligatures.
 *
 * @param text Deseret text
 * @returns Array of ARPAbet phonemes, or null if no valid phonemes found
 */
export function deseretToArpabet(text: string): null | string[] {
  const result: string[] = [];

  for (const char of text) {
    if (!isDeseretChar(char)) {
      continue;
    }

    // Normalize uppercase to lowercase (offset is 0x28)
    const cp = char.codePointAt(0)!;
    const normalized = cp < 0x1_04_28 ? String.fromCodePoint(cp + 0x28) : char;

    const phonemes = DESERET_TO_ARPABET_MAP[normalized];
    if (phonemes !== undefined) {
      result.push(...phonemes);
    }
  }

  return result.length > 0 ? result : null;
}

/**
 * Translates Deseret text back to English, preserving non-Deseret characters.
 */
export function reverseTranslateDeseretText(text: string): string {
  const tokens = tokenizeDeseret(text);

  return tokens
    .map((token) => {
      if (token.isWord) {
        const matches = reverseTranslateDeseretWord(token.text);
        return matches[0] ?? token.text;
      }
      return token.text;
    })
    .join('');
}

/**
 * Translates Deseret text back to English with token-by-token mapping.
 */
export function reverseTranslateDeseretTextWithMapping(text: string): ReverseToken[] {
  const tokens = tokenizeDeseret(text);

  return tokens.map((token) => {
    if (token.isWord) {
      const matches = reverseTranslateDeseretWord(token.text);
      const translated = matches[0] ?? token.text;
      return {
        isWord: true,
        matched: translated !== token.text,
        original: token.text,
        translated,
      };
    }
    return { isWord: false, matched: true, original: token.text, translated: token.text };
  });
}

/**
 * Translates a single Deseret word back to English.
 * Returns possible English words sorted by frequency.
 */
export function reverseTranslateDeseretWord(word: string): string[] {
  const arpabet = deseretToArpabet(word);
  if (!arpabet) {
    return [word];
  }

  const key = arpabet.join(' ');
  const matches = lookupPhonemeKey(key);
  if (!matches || matches.length === 0) {
    return [word];
  }

  return matches.length > 1 ? sortByFrequency(matches) : matches;
}
