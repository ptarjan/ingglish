/**
 * ARPAbet to Deseret conversion.
 *
 * Converts CMU dictionary phoneme sequences to Deseret script.
 * Handles AH stress (AH0 → schwa, AH1/AH2 → strut),
 * ER stress, and Y+UW → Ew ligature.
 */

import { stripStress } from '@ingglish/phonemes';
import { ARPABET_TO_DESERET_MAP, DESERET_SCHWA, DESERET_EW } from './deseret-maps';

/**
 * Converts an array of ARPAbet phonemes to Deseret script.
 *
 * @param arpabet Array of ARPAbet symbols (e.g., ["HH", "AH0", "L", "OW1"])
 * @returns Deseret string (e.g., "𐐸𐐱𐑊𐐬")
 */
export function arpabetToDeseret(arpabet: string[]): string {
  let result = '';
  const len = arpabet.length;

  for (let i = 0; i < len; i++) {
    const phoneme = arpabet[i]!;
    const base = stripStress(phoneme);

    // Y+UW → Ew ligature
    if (base === 'Y' && i + 1 < len && stripStress(arpabet[i + 1]!) === 'UW') {
      result += DESERET_EW;
      i++; // Skip the UW
      continue;
    }

    // ER: no single Deseret letter, expand to vowel + 𐑉
    if (base === 'ER') {
      const lastChar = phoneme.charCodeAt(phoneme.length - 1);
      // '0' = 48 → unstressed schwa + R
      result += lastChar === 48 ? DESERET_SCHWA : ARPABET_TO_DESERET_MAP.AH!;
      result += ARPABET_TO_DESERET_MAP.R!;
      continue;
    }

    // AH stress: AH0 → schwa, AH1/AH2 → strut
    if (base === 'AH') {
      const lastChar = phoneme.charCodeAt(phoneme.length - 1);
      if (lastChar === 48) {
        result += DESERET_SCHWA;
        continue;
      }
    }

    result += ARPABET_TO_DESERET_MAP[base] ?? '';
  }

  return result;
}
