/**
 * ARPAbet to Ingglish conversion.
 *
 * Converts CMU dictionary phoneme sequences to Ingglish spelling.
 * Ingglish is a phonetic spelling system that uses only standard
 * English letters with no ambiguity.
 */

import { stripStress } from '../phonemes/arpabet';
import { ARPABET_TO_INGGLISH_MAP } from './ingglish-maps';
import { arpabetToIPARaw } from './to-ipa';
import type { OutputFormat } from '../types';

/**
 * Converts a single ARPAbet phoneme to Ingglish spelling.
 *
 * @param phoneme ARPAbet phoneme (e.g., "AH0", "EY1", "B")
 * @returns Ingglish spelling (e.g., "u", "ay", "b")
 */
export function arpabetPhonemeToIngglish(phoneme: string): string {
  const base = stripStress(phoneme);
  return ARPABET_TO_INGGLISH_MAP[base] ?? phoneme.toLowerCase();
}

/**
 * Converts an array of ARPAbet phonemes to Ingglish spelling.
 * Uses direct loop + string concat (benchmarked 60% faster than map+join).
 *
 * R-colored vowels: AA+R → 'ar', AO+R → 'or', IH+R → 'eer' (more intuitive than 'or'/'awr'/'ir')
 *
 * @param arpabet Array of ARPAbet symbols (e.g., ["HH", "AH0", "L", "OW1"])
 * @returns Ingglish spelling (e.g., "huloh")
 */
export function arpabetToIngglish(arpabet: string[]): string {
  let result = '';
  const len = arpabet.length;

  for (let i = 0; i < len; i++) {
    const phoneme = arpabet[i];
    const base = stripStress(phoneme);

    // R-colored vowel check: only if next phoneme is R (or R0/R1/R2)
    // Check raw phoneme first to avoid stripStress call when not needed
    if (i + 1 < len) {
      const next = arpabet[i + 1];
      // R is always 'R' (no stress variants), so direct check works
      if (next === 'R') {
        if (base === 'AA') {
          result += 'a'; // R will add 'r' next
          continue;
        } else if (base === 'AO') {
          result += 'o'; // R will add 'r' next
          continue;
        } else if (base === 'EH') {
          result += 'ai'; // R will add 'r' next
          continue;
        } else if (base === 'AE') {
          result += 'ar'; // R will add 'r' next → 'arr'
          continue;
        } else if (base === 'IH') {
          result += 'ee'; // R will add 'r' next → 'eer' (NEAR vowel: beer, beard, fear)
          continue;
        }
      }
    }

    result += ARPABET_TO_INGGLISH_MAP[base] ?? phoneme.toLowerCase();
  }
  return result;
}

/**
 * Converts ARPAbet to the specified output format.
 *
 * @param arpabet Array of ARPAbet symbols
 * @param format Output format ('ingglish' or 'ipa')
 * @returns Formatted string
 */
export function arpabetToFormat(arpabet: string[], format: OutputFormat = 'ingglish'): string {
  if (format === 'ipa') {
    return arpabetToIPARaw(arpabet);
  }
  return arpabetToIngglish(arpabet);
}
