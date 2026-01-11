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
 * Note: R-colored vowels (AA+R → 'ar', AO+R → 'or') are handled
 * contextually in arpabetToIngglish() via look-ahead, not here.
 */
export const INGGLISH_VOWEL_MAP: Record<string, string> = {
  // Monophthongs
  AA: 'o', // father, hot, rock (but AA+R → 'ar' in star, car)
  AE: 'a', // cat, bat, had
  AH: 'u', // but, cup, son
  AO: 'aw', // thought, caught, law (but AO+R → 'or' in store, more)
  EH: 'e', // bed, red, said
  ER: 'er', // bird, her, nurse
  IH: 'i', // bit, sit, gym
  IY: 'ee', // bee, see, machine
  UH: 'uu', // book, put, could
  UW: 'oo', // too, blue, food

  // Diphthongs
  AW: 'ow', // cow, how, out
  AY: 'ii', // my, eye, time
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
