/**
 * ARPAbet to Shavian conversion.
 *
 * Converts CMU dictionary phoneme sequences to Shavian script.
 * Uses R-colored ligatures when a vowel is followed by R.
 */

import { stripStress } from '@ingglish/phonemes';
import { ARPABET_TO_SHAVIAN_MAP, SHAVIAN_SCHWA, SHAVIAN_R_COLORED } from './shavian-maps';

/**
 * Converts an array of ARPAbet phonemes to Shavian script.
 *
 * R-colored vowels: AA+R → 𐑸, AO+R → 𐑹, EH+R → 𐑺, AH0+R → 𐑼, IH+R → 𐑽
 * AH stress: AH0 → 𐑩 (schwa), AH1/AH2 → 𐑳 (strut)
 *
 * @param arpabet Array of ARPAbet symbols (e.g., ["HH", "AH0", "L", "OW1"])
 * @returns Shavian string (e.g., "𐑣𐑩𐑤𐑴")
 */
export function arpabetToShavian(arpabet: string[]): string {
  let result = '';
  const len = arpabet.length;

  for (let i = 0; i < len; i++) {
    const phoneme = arpabet[i]!;
    const base = stripStress(phoneme);

    // R-colored vowel check: only if next phoneme is R
    if (i + 1 < len && arpabet[i + 1] === 'R') {
      // Check stress-aware key for AH (AH0+R → 𐑼)
      const stressKey = base === 'AH' ? phoneme : base;
      const ligature = SHAVIAN_R_COLORED[stressKey] ?? SHAVIAN_R_COLORED[base];
      if (ligature !== undefined) {
        result += ligature;
        i++; // Skip the R
        continue;
      }
    }

    // Handle AH stress: AH0 → schwa, AH1/AH2 → strut
    if (base === 'AH') {
      const lastChar = phoneme.charCodeAt(phoneme.length - 1);
      // '0' = 48
      if (lastChar === 48) {
        result += SHAVIAN_SCHWA;
        continue;
      }
    }

    result += ARPABET_TO_SHAVIAN_MAP[base] ?? '';
  }

  return result;
}
