/**
 * Deseret to ARPAbet/English conversion.
 *
 * Converts Deseret script back to ARPAbet phonemes, then looks up
 * English words in the dictionary.
 */

import { lookupPhonemeKey, sortByFrequency } from '@ingglish/dictionary';
import { createScriptReverseTranslator } from '@ingglish/phonemes';
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

const translator = createScriptReverseTranslator({
  lookupPhonemeKey,
  sortByFrequency,
  toArpabet: deseretToArpabet,
  tokenize: tokenizeDeseret,
});

export const reverseTranslateDeseretText = translator.reverseText;
export const reverseTranslateDeseretTextWithMapping = translator.reverseTextWithMapping;
export const reverseTranslateDeseretWord = translator.reverseWord;
