/**
 * Ingglish to ARPAbet conversion.
 *
 * Used to parse Ingglish spellings back to ARPAbet phonemes
 * for reverse translation (Ingglish -> English).
 */

import { INGGLISH_TO_ARPABET_MAP } from './ingglish-maps';

/**
 * Spellings sorted by length (match longer patterns first).
 * For example, "sh" must be matched before "s".
 */
const SPELLINGS_BY_LENGTH = Object.keys(INGGLISH_TO_ARPABET_MAP).sort(
  (a, b) => b.length - a.length
);

/**
 * Converts an Ingglish spelling to ARPAbet phonemes.
 *
 * @param ingglish - Ingglish string (e.g., "hulo" for "hello")
 * @returns Array of ARPAbet phonemes (e.g., ["HH", "AH", "L", "OW"]), or null if empty
 */
export function ingglishToArpabet(ingglish: string): string[] | null {
  const result: string[] = [];
  let remaining = ingglish.toLowerCase();

  while (remaining.length > 0) {
    let matched = false;

    for (const spelling of SPELLINGS_BY_LENGTH) {
      if (remaining.startsWith(spelling)) {
        result.push(INGGLISH_TO_ARPABET_MAP[spelling]);
        remaining = remaining.slice(spelling.length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      remaining = remaining.slice(1); // Skip unknown characters
    }
  }

  return result.length > 0 ? result : null;
}
