/**
 * Ingglish to ARPAbet conversion.
 *
 * Used to parse Ingglish spellings back to ARPAbet phonemes
 * for reverse translation (Ingglish -> English).
 */

import { INGGLISH_TO_ARPABET_MAP } from './ingglish-maps';

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
    // Try 2-char spelling first (e.g., "sh" before "s")
    const twoChar = remaining.slice(0, 2);
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
