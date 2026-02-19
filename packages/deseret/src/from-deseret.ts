/**
 * Deseret to ARPAbet/English conversion.
 *
 * Converts Deseret script back to ARPAbet phonemes, then looks up
 * English words in the dictionary.
 */

import { lookupPhonemeKey, sortByFrequency } from '@ingglish/dictionary';
import { DESERET_TO_ARPABET_MAP } from './deseret-maps';
import { tokenizeDeseret, isDeseretChar } from './tokenize';

/**
 * Converts a Deseret string to ARPAbet phonemes.
 * Iterates Unicode codepoints and expands ligatures.
 *
 * @param text Deseret text
 * @returns Array of ARPAbet phonemes, or null if no valid phonemes found
 */
export function deseretToArpabet(text: string): string[] | null {
  const result: string[] = [];

  for (const char of text) {
    if (!isDeseretChar(char)) {
      continue;
    }

    // Normalize uppercase to lowercase (offset is 0x28)
    const cp = char.codePointAt(0)!;
    const normalized = cp < 0x10428 ? String.fromCodePoint(cp + 0x28) : char;

    const phonemes = DESERET_TO_ARPABET_MAP[normalized];
    if (phonemes !== undefined) {
      result.push(...phonemes);
    }
  }

  return result.length > 0 ? result : null;
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
