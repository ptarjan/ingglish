/**
 * ARPAbet to Ingglish phoneme mappings.
 *
 * Ingglish is a phonetic spelling system for English that:
 * 1. Uses only the 26 standard English letters (no diacritics)
 * 2. Has exactly one spelling per sound (no ambiguity)
 * 3. Is intuitive for English readers
 */

/**
 * ARPAbet vowels to Ingglish spellings.
 *
 * Note: R-colored vowels (AA+R→'ar', AO+R→'or', EH+R→'air', AE+R→'arr', IH+R→'eer')
 * are handled contextually in arpabetToIngglish() via look-ahead, not here.
 */
export const INGGLISH_VOWEL_MAP: Record<string, string> = {
  // Monophthongs
  AA: 'o', // father, hot, rock (but AA+R → 'ar' in star, car)
  AE: 'a', // cat, bat, had (but AE+R → 'arr' in arrow, barrow)
  AH: 'uh', // but, cup, son (stressed /ʌ/; unstressed /ə/ AH0 → 'a' in conversion)
  AO: 'aw', // thought, caught, law (but AO+R → 'or' in store, more)
  EH: 'e', // bed, red, said (but EH+R → 'air' in air, care, there)
  ER: 'er', // bird, her, nurse
  IH: 'i', // bit, sit, gym
  IY: 'ee', // bee, see, machine
  UH: 'u', // book, put, could
  UW: 'oo', // too, blue, food

  // Diphthongs
  AW: 'ou', // cow, how, out
  AY: 'ai', // my, eye, time
  EY: 'ay', // say, day, make
  OW: 'oh', // go, show, coat
  OY: 'oi', // boy, toy, coin
};

/**
 * ARPAbet consonants to Ingglish spellings.
 */
export const INGGLISH_CONSONANT_MAP: Record<string, string> = {
  // Stops (plosives)
  B: 'b', // bat, cab
  D: 'd', // dog, bed
  G: 'g', // go, big
  K: 'k', // cat, back
  P: 'p', // pat, cup
  T: 't', // top, cat

  // Fricatives
  DH: 'dh', // the, this (voiced) - distinguishes from TH
  F: 'f', // fat, laugh
  S: 's', // sat, miss
  SH: 'sh', // she, push
  TH: 'th', // think, bath (voiceless)
  V: 'v', // van, love
  Z: 'z', // zoo, is
  ZH: 'zh', // measure, beige

  // Affricates
  CH: 'ch', // chat, batch
  JH: 'j', // just, edge

  // Nasals
  M: 'm', // man, come
  N: 'n', // no, pen
  NG: 'ng', // sing, thing

  // Liquids
  L: 'l', // let, well
  R: 'r', // run, car

  // Semivowels (glides)
  W: 'w', // wet, away
  Y: 'y', // yes, you

  // Aspirate
  HH: 'h', // hat, ahead
};

/**
 * Combined ARPAbet to Ingglish map.
 */
export const ARPABET_TO_INGGLISH_MAP: Record<string, string> = {
  ...INGGLISH_VOWEL_MAP,
  ...INGGLISH_CONSONANT_MAP,
};

/**
 * Ingglish to ARPAbet reverse mapping.
 * Built from the forward map for consistency.
 */
export const INGGLISH_TO_ARPABET_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(ARPABET_TO_INGGLISH_MAP).map(([arpabet, ingglish]) => [ingglish, arpabet])
);

// ============================================================================
// R-colored vowels
// ============================================================================

/**
 * R-colored vowel mappings — single source of truth.
 *
 * Each entry maps an ARPAbet vowel to its Ingglish prefix when followed by R.
 * The full Ingglish spelling is `prefix + 'r'` (since R maps to 'r').
 *
 * Example: AA+R → prefix 'a' → full spelling 'ar' (star, car)
 */
export const R_COLORED_VOWELS: { arpabet: string; prefix: string }[] = [
  { arpabet: 'AA', prefix: 'a' }, // star, car, far → 'ar'
  { arpabet: 'AO', prefix: 'o' }, // store, more, for → 'or'
  { arpabet: 'EH', prefix: 'ai' }, // air, care, there → 'air'
  { arpabet: 'AE', prefix: 'ar' }, // arrow, barrow, carrot → 'arr'
  { arpabet: 'IH', prefix: 'ee' }, // beer, beard, fear → 'eer'
  { arpabet: 'AH', prefix: 'u' }, // fur, current → 'ur' (prevents AH0+R collision with 'ar')
];

/**
 * Forward lookup: ARPAbet vowel → Ingglish prefix (before 'r').
 * Used by arpabetToIngglish() to handle VOWEL+R sequences.
 */
export const R_COLORED_FORWARD = new Map<string, string>(
  R_COLORED_VOWELS.map(({ arpabet, prefix }) => [arpabet, prefix])
);

/**
 * Reverse lookup: full Ingglish spelling → [ARPAbet vowel, 'R'].
 * Split by length for efficient prefix matching in ingglishToArpabet().
 */
export const R_COLORED_REVERSE_3CHAR: Record<string, [string, string]> = Object.fromEntries(
  R_COLORED_VOWELS.filter(({ prefix }) => prefix.length === 2).map(({ arpabet, prefix }) => [
    prefix + 'r',
    [arpabet, 'R'],
  ])
);

export const R_COLORED_REVERSE_2CHAR: Record<string, [string, string]> = Object.fromEntries(
  R_COLORED_VOWELS.filter(({ prefix }) => prefix.length === 1).map(({ arpabet, prefix }) => [
    prefix + 'r',
    [arpabet, 'R'],
  ])
);
