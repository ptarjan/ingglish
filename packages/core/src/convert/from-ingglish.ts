/**
 * Ingglish to ARPAbet conversion.
 *
 * Used to parse Ingglish spellings back to ARPAbet phonemes
 * for reverse translation (Ingglish -> English).
 */

import { INGGLISH_TO_ARPABET_MAP } from './ingglish-maps';

/**
 * R-colored vowel sequences: 'ar' → AA+R, 'or' → AO+R
 * These override the default single-char mappings when followed by 'r'.
 */
const R_COLORED_VOWELS: Record<string, [string, string]> = {
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
    // Check for R-colored vowels first (ar, or)
    const twoChar = remaining.slice(0, 2);
    if (remaining.length >= 2 && twoChar in R_COLORED_VOWELS) {
      result.push(...R_COLORED_VOWELS[twoChar]);
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
