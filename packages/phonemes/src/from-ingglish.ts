/**
 * Ingglish to ARPAbet conversion.
 *
 * Used to parse Ingglish spellings back to ARPAbet phonemes
 * for reverse translation (Ingglish -> English).
 */

import { INGGLISH_TO_ARPABET_MAP } from './ingglish-maps';

/**
 * R-colored vowel sequences by length.
 * Check 3-char first (air), then 2-char (ar, or).
 */
const R_COLORED_3CHAR: Record<string, [string, string]> = {
  air: ['EH', 'R'], // air, care, there, where
  arr: ['AE', 'R'], // arrow, barrow, carrot
  eer: ['IH', 'R'], // beer, beard, fear, near
};

const R_COLORED_2CHAR: Record<string, [string, string]> = {
  ar: ['AA', 'R'], // star, car, far
  or: ['AO', 'R'], // store, more, for
};

/**
 * Pre-built Sets for O(1) lookup by spelling length.
 * Enables fast prefix matching: check 2-char, then 1-char.
 */
const TWO_CHAR_SPELLINGS = new Set(
  Object.keys(INGGLISH_TO_ARPABET_MAP).filter((s) => s.length === 2)
);
const ONE_CHAR_SPELLINGS = new Set(
  Object.keys(INGGLISH_TO_ARPABET_MAP).filter((s) => s.length === 1)
);

/**
 * Converts an Ingglish spelling to ARPAbet phonemes.
 *
 * @param ingglish - Ingglish string (e.g., "huloh" for "hello")
 * @returns Array of ARPAbet phonemes (e.g., ["HH", "AH", "L", "OW"]), or null if empty
 */
export function ingglishToArpabet(ingglish: string): string[] | null {
  const result: string[] = [];
  let remaining = ingglish.toLowerCase();

  while (remaining.length > 0) {
    // Check for 3-char R-colored vowels first (air)
    const threeChar = remaining.slice(0, 3);
    if (remaining.length >= 3 && threeChar in R_COLORED_3CHAR) {
      result.push(...R_COLORED_3CHAR[threeChar]);
      remaining = remaining.slice(3);
      continue;
    }

    // Check for 2-char R-colored vowels (ar, or)
    const twoChar = remaining.slice(0, 2);
    if (remaining.length >= 2 && twoChar in R_COLORED_2CHAR) {
      result.push(...R_COLORED_2CHAR[twoChar]);
      remaining = remaining.slice(2);
      continue;
    }

    // Try 2-char spelling (e.g., "sh" before "s")
    if (remaining.length >= 2 && TWO_CHAR_SPELLINGS.has(twoChar)) {
      result.push(INGGLISH_TO_ARPABET_MAP[twoChar]);
      remaining = remaining.slice(2);
      continue;
    }

    // Try 1-char spelling
    const oneChar = remaining[0];
    if (ONE_CHAR_SPELLINGS.has(oneChar)) {
      result.push(INGGLISH_TO_ARPABET_MAP[oneChar]);
      remaining = remaining.slice(1);
      continue;
    }

    // Skip unknown characters
    remaining = remaining.slice(1);
  }

  return result.length > 0 ? result : null;
}
