/**
 * ARPAbet to Ingglish conversion.
 *
 * Converts CMU dictionary phoneme sequences to Ingglish spelling.
 * Ingglish is a phonetic spelling system that uses only standard
 * English letters with no ambiguity.
 */

import { stripStress } from './arpabet';
import { ARPABET_TO_INGGLISH_MAP, R_COLORED_FORWARD } from './ingglish-maps';
import { registerFormat, getFormatHandler } from './format-registry';
import type { OutputFormat } from './types';

/**
 * Converts a single ARPAbet phoneme to Ingglish spelling.
 *
 * @param phoneme ARPAbet phoneme (e.g., "AH0", "EY1", "B")
 * @returns Ingglish spelling (e.g., "a", "ay", "b")
 */
export function arpabetPhonemeToIngglish(phoneme: string): string {
  // Unstressed schwa AH0 → 'a' (stressed /ʌ/ AH1/AH2 → 'u' via map)
  if (phoneme === 'AH0') {
    return 'a';
  }
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
 * @returns Ingglish spelling (e.g., "haloh")
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
        const rPrefix = R_COLORED_FORWARD.get(base);
        if (rPrefix !== undefined) {
          result += rPrefix; // R will add 'r' next iteration
          continue;
        }
      }
    }

    // Unstressed schwa AH0 → 'a' (stressed /ʌ/ AH1/AH2 → 'u' via map)
    if (phoneme === 'AH0') {
      result += 'a';
      continue;
    }

    result += ARPABET_TO_INGGLISH_MAP[base] ?? phoneme.toLowerCase();
  }
  return result;
}

// Register default format at module load
registerFormat('ingglish', { forward: arpabetToIngglish });

/**
 * Converts ARPAbet to the specified output format.
 *
 * @param arpabet Array of ARPAbet symbols
 * @param format Output format (e.g. 'ingglish', 'ipa', 'shavian')
 * @returns Formatted string
 */
export function arpabetToFormat(arpabet: string[], format: OutputFormat = 'ingglish'): string {
  const handler = getFormatHandler(format);
  if (handler?.forward) {
    return handler.forward(arpabet);
  }
  return arpabetToIngglish(arpabet);
}
