/**
 * English phonotactics - rules about valid consonant clusters.
 *
 * Phonotactics defines which phoneme sequences are legal in a language.
 * This module focuses on syllable onsets (consonants at the start of a syllable).
 */

/**
 * Valid English onset clusters (using ARPAbet phonemes).
 * Based on English phonotactics - these are the consonant combinations
 * that can legally start a syllable in English.
 *
 * Note: NG is NOT a valid onset in English (only appears in codas).
 */
export const VALID_ONSETS = new Set([
  // Single consonants (all are valid onsets except NG)
  'B',
  // Two-consonant clusters: consonant + liquid (L, R)
  'B L',
  'B R',
  // Two-consonant clusters: consonant + glide (W, Y)
  'B Y',
  'CH',
  'D',
  'DH',
  'D R',
  'D W',
  'D Y',
  'F',
  'F L',
  'F R',
  'F Y',
  'G',
  'G L',
  'G R',
  'G W',
  'G Y',
  'HH',
  'HH W',
  'HH Y',
  'JH',

  'K',
  'K L',
  'K R',
  'K W',
  'K Y',
  'L',
  'L Y',
  'M',
  'M Y',
  'N',
  'N Y',
  'P',
  'P L',
  'P R',

  'P Y',
  'R',
  'S',
  'SH',
  'SH R',
  // Two-consonant clusters: s + consonant
  'S K',
  // Three-consonant clusters: s + stop + liquid/glide
  'S K R',
  'S K W',
  'S K Y',
  'S L',
  'S M',
  'S N',
  'S P',
  'S P L',
  'S P R',
  'S P Y',
  'S T',
  'S T R',
  'S T Y',
  'S W',

  'S Y',
  'T',
  'TH',
  'TH R',
  'TH W',
  'T R',

  'T W',
  'T Y',
  'V',
  'V Y',
  'W',
  'Y',
  'Z',
  'ZH',
]);

/**
 * Finds the starting index of the maximal valid onset from a consonant cluster.
 *
 * Uses the Maximal Onset Principle: assign as many consonants as possible
 * to the onset, as long as they form a legal onset cluster. The remaining
 * consonants become the coda of the previous syllable.
 *
 * @param consonants Array of consonant phonemes between two vowels
 * @returns Index within the consonant array where the valid onset begins
 *
 * @example
 * // "extra" has consonants [K, S, T, R] between vowels
 * // [S, T, R] is valid onset, so onset starts at index 1
 * findOnsetStart(['K', 'S', 'T', 'R']) // 1
 *
 * // "instruct" has [N, S, T, R]
 * // [S, T, R] is valid, so onset starts at index 1
 * findOnsetStart(['N', 'S', 'T', 'R']) // 1
 */
export function findOnsetStart(consonants: string[]): number {
  if (consonants.length === 0) {
    return 0;
  }

  // Try progressively shorter substrings from the beginning
  // to find the longest valid onset
  for (let start = 0; start < consonants.length; start++) {
    const candidate = consonants.slice(start);
    if (isValidOnset(candidate)) {
      return start;
    }
  }

  // If nothing is valid (shouldn't happen), take just the last consonant
  return consonants.length - 1;
}

/**
 * Checks if a sequence of consonant phonemes forms a valid English onset.
 *
 * @param consonants Array of ARPAbet consonant phonemes (without stress markers)
 * @returns true if the sequence can legally start an English syllable
 *
 * @example
 * isValidOnset(['S', 'T', 'R']) // true - "street"
 * isValidOnset(['S', 'R'])     // false - not valid in English
 * isValidOnset([])             // true - null onset is valid
 */
export function isValidOnset(consonants: string[]): boolean {
  if (consonants.length === 0) {
    return true;
  }
  const key = consonants.join(' ');
  return VALID_ONSETS.has(key);
}
