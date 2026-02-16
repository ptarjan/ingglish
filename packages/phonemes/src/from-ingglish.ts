/**
 * Ingglish to ARPAbet conversion.
 *
 * Used to parse Ingglish spellings back to ARPAbet phonemes
 * for reverse translation (Ingglish -> English).
 */

import {
  INGGLISH_TO_ARPABET_MAP,
  R_COLORED_REVERSE_3CHAR,
  R_COLORED_REVERSE_2CHAR,
} from './ingglish-maps';

// ============================================================================
// ARPAbet Alternatives (handling ambiguous spellings)
// ============================================================================

/**
 * Some Ingglish spellings are ambiguous because the same letters can
 * represent different ARPAbet sequences. For example, "er" could be:
 * - ER (r-colored schwa): "bird", "her"
 * - EH + R (short e + r): "welfare", "better"
 *
 * Only EH + R is valid here because IH + R -> "eer" and AH + R -> "ur"
 */
const ARPABET_ALTERNATIVES: Record<string, string[][]> = {
  ER: [['EH', 'R']],
  SH: [['S', 'HH']], // "sh" could be SH (ship) or S+HH (exhume)
};

/**
 * Generates alternative ARPAbet sequences for ambiguous spellings.
 */
export function expandArpabetAlternatives(arpabet: string[]): string[][] {
  const results: string[][] = [arpabet];

  for (let i = 0; i < arpabet.length; i++) {
    const alternatives = ARPABET_ALTERNATIVES[arpabet[i]];
    if (alternatives !== undefined) {
      for (const alt of alternatives) {
        const expanded = [...arpabet.slice(0, i), ...alt, ...arpabet.slice(i + 1)];
        results.push(expanded);
      }
    }
  }

  return results;
}

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
    if (remaining.length >= 3 && threeChar in R_COLORED_REVERSE_3CHAR) {
      result.push(...R_COLORED_REVERSE_3CHAR[threeChar]);
      remaining = remaining.slice(3);
      continue;
    }

    // Check for 2-char R-colored vowels (ar, or)
    const twoChar = remaining.slice(0, 2);
    if (remaining.length >= 2 && twoChar in R_COLORED_REVERSE_2CHAR) {
      result.push(...R_COLORED_REVERSE_2CHAR[twoChar]);
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
