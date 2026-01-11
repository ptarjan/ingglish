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
 * R-colored vowels: AA+R → 'ar', AO+R → 'or' (more intuitive than 'or'/'awr')
 *
 * @param arpabet Array of ARPAbet symbols (e.g., ["HH", "AH0", "L", "OW1"])
 * @returns Ingglish spelling (e.g., "huloh")
 */
export function arpabetToIngglish(arpabet: string[]): string {
  let result = '';
  for (let i = 0; i < arpabet.length; i++) {
    const phoneme = arpabet[i];
    const base = stripStress(phoneme);
    const nextBase = i + 1 < arpabet.length ? stripStress(arpabet[i + 1]) : null;

    // R-colored vowels: use 'ar' for AA+R, 'or' for AO+R
    if (base === 'AA' && nextBase === 'R') {
      result += 'a'; // The R will add 'r' on the next iteration
    } else if (base === 'AO' && nextBase === 'R') {
      result += 'o'; // The R will add 'r' on the next iteration
    } else {
      result += ARPABET_TO_INGGLISH_MAP[base] ?? phoneme.toLowerCase();
    }
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
