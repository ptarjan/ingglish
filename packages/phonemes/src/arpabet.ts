/**
 * ARPAbet phoneme utilities and constants.
 *
 * ARPAbet is the phonetic notation system used by the CMU Pronouncing Dictionary.
 * Each English phoneme is represented by a 1-3 letter code, with vowels having
 * optional stress markers (0=unstressed, 1=primary, 2=secondary).
 */

/**
 * All ARPAbet vowel phonemes (without stress markers).
 */
export const ARPABET_VOWELS = [
  'AA', // father, hot
  'AE', // cat, bat
  'AH', // but, cup (stressed) / schwa (unstressed)
  'AO', // thought, law
  'AW', // cow, how
  'AY', // my, time
  'EH', // bed, red
  'ER', // bird, her
  'EY', // say, day
  'IH', // bit, sit
  'IY', // bee, see
  'OW', // go, show
  'OY', // boy, toy
  'UH', // book, put
  'UW', // too, blue
] as const;

/**
 * All ARPAbet consonant phonemes.
 */
export const ARPABET_CONSONANTS = [
  // Stops
  'B',
  'D',
  'G',
  'K',
  'P',
  'T',
  // Fricatives
  'DH', // the, this
  'F',
  'HH', // hat
  'S',
  'SH', // ship
  'TH', // think
  'V',
  'Z',
  'ZH', // measure
  // Affricates
  'CH', // chat
  'JH', // just
  // Nasals
  'M',
  'N',
  'NG', // sing
  // Liquids
  'L',
  'R',
  // Glides
  'W',
  'Y',
] as const;

/** Pre-built Set for O(1) vowel lookup */
const VOWELS_SET = new Set<string>(ARPABET_VOWELS);

/** Regex pattern to match ARPAbet stress markers (0, 1, 2) at end of phoneme */
export const STRESS_MARKER_REGEX = /[012]$/;

/**
 * Extracts the stress level from a phoneme.
 * Returns null for consonants or vowels without explicit stress.
 * Uses charCode check instead of regex (consistent with stripStress).
 *
 * @example
 * getStress('AH0') // 0
 * getStress('EY1') // 1
 * getStress('AO2') // 2
 * getStress('B')   // null
 */
export function getStress(phoneme: string): 0 | 1 | 2 | null {
  const lastChar = phoneme.codePointAt(phoneme.length - 1)!;
  // '0'=48, '1'=49, '2'=50
  if (lastChar >= 48 && lastChar <= 50) {
    return (lastChar - 48) as 0 | 1 | 2;
  }
  return null;
}

/**
 * Checks if an ARPAbet phoneme is a vowel.
 * Vowels can have stress markers (0, 1, 2).
 *
 * @example
 * isVowel('AH0') // true
 * isVowel('EY1') // true
 * isVowel('B')   // false
 */
export function isVowel(phoneme: string): boolean {
  const base = stripStress(phoneme);
  return VOWELS_SET.has(base);
}

/**
 * Strips stress markers (0, 1, 2) from a phoneme.
 * Uses charCode check instead of regex (benchmarked 2x faster).
 *
 * @example
 * stripStress('AH0') // 'AH'
 * stripStress('EY1') // 'EY'
 * stripStress('B')   // 'B'
 */
export function stripStress(phoneme: string): string {
  const lastChar = phoneme.codePointAt(phoneme.length - 1)!;
  // '0'=48, '1'=49, '2'=50
  if (lastChar >= 48 && lastChar <= 50) {
    return phoneme.slice(0, -1);
  }
  return phoneme;
}
