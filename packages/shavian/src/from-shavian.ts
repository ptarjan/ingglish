/**
 * Shavian to ARPAbet/English conversion.
 *
 * Converts Shavian script back to ARPAbet phonemes, then looks up
 * English words in the dictionary.
 */

import { lookupPhonemeKey, sortByFrequency } from '@ingglish/dictionary';
import { createScriptReverseTranslator } from '@ingglish/phonemes';
import { SHAVIAN_TO_ARPABET_MAP } from './shavian-maps';
import { isShavianChar, tokenizeShavian } from './tokenize';

/**
 * Converts a Shavian string to ARPAbet phonemes.
 * Iterates Unicode codepoints and expands ligatures.
 *
 * @param text Shavian text
 * @returns Array of ARPAbet phonemes, or null if no valid phonemes found
 */
export function shavianToArpabet(text: string): null | string[] {
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

const translator = createScriptReverseTranslator({
  lookupPhonemeKey,
  sortByFrequency,
  toArpabet: shavianToArpabet,
  tokenize: tokenizeShavian,
});

export const reverseTranslateShavianText = translator.reverseText;
export const reverseTranslateShavianTextWithMapping = translator.reverseTextWithMapping;
export const reverseTranslateShavianWord = translator.reverseWord;
