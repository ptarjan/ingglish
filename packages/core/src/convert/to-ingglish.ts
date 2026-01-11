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
 *
 * @param arpabet Array of ARPAbet symbols (e.g., ["HH", "AH0", "L", "OW1"])
 * @returns Ingglish spelling (e.g., "huloh")
 */
export function arpabetToIngglish(arpabet: string[]): string {
  return arpabet.map(arpabetPhonemeToIngglish).join('');
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
