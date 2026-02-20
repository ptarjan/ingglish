/**
 * Shavian to ARPAbet/English conversion.
 *
 * Converts Shavian script back to ARPAbet phonemes, then looks up
 * English words in the dictionary.
 */

import { lookupPhonemeKey, sortByFrequency } from '@ingglish/dictionary';
import type { ReverseToken } from '@ingglish/phonemes';
import { SHAVIAN_TO_ARPABET_MAP } from './shavian-maps';
import { tokenizeShavian, isShavianChar } from './tokenize';

/**
 * Converts a Shavian string to ARPAbet phonemes.
 * Iterates Unicode codepoints and expands ligatures.
 *
 * @param text Shavian text
 * @returns Array of ARPAbet phonemes, or null if no valid phonemes found
 */
export function shavianToArpabet(text: string): string[] | null {
  const result: string[] = [];

  for (const char of text) {
    if (!isShavianChar(char)) {
      continue;
    }

    const phonemes = SHAVIAN_TO_ARPABET_MAP[char];
    if (phonemes !== undefined) {
      result.push(...phonemes);
    }
  }

  return result.length > 0 ? result : null;
}

/**
 * Translates a single Shavian word back to English.
 * Returns possible English words sorted by frequency.
 */
export function reverseTranslateShavianWord(word: string): string[] {
  const arpabet = shavianToArpabet(word);
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
 * Translates Shavian text back to English, preserving non-Shavian characters.
 */
export function reverseTranslateShavianText(text: string): string {
  const tokens = tokenizeShavian(text);

  return tokens
    .map((token) => {
      if (token.isWord) {
        const matches = reverseTranslateShavianWord(token.text);
        return matches[0] ?? token.text;
      }
      return token.text;
    })
    .join('');
}

/**
 * Translates Shavian text back to English with token-by-token mapping.
 */
export function reverseTranslateShavianTextWithMapping(text: string): ReverseToken[] {
  const tokens = tokenizeShavian(text);

  return tokens.map((token) => {
    if (token.isWord) {
      const matches = reverseTranslateShavianWord(token.text);
      const translated = matches[0] ?? token.text;
      return {
        original: token.text,
        translated,
        isWord: true,
        matched: translated !== token.text,
      };
    }
    return { original: token.text, translated: token.text, isWord: false, matched: true };
  });
}
