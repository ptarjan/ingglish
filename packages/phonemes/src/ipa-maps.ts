/**
 * ARPAbet to IPA phoneme mappings.
 *
 * IPA (International Phonetic Alphabet) is the standard notation for
 * representing speech sounds. These maps convert ARPAbet phonemes
 * (used by CMU dictionary) to their IPA equivalents.
 */

/**
 * ARPAbet vowels to IPA symbols.
 */
export const IPA_VOWEL_MAP: Record<string, string> = {
  // Monophthongs
  AA: 'ɑ', // father, hot, bother
  AE: 'æ', // cat, bat, had
  AH: 'ʌ', // but, cup, son (stressed)
  AO: 'ɔ', // thought, caught, law
  EH: 'ɛ', // bed, red, said
  ER: 'ɝ', // bird, her, nurse
  IH: 'ɪ', // bit, sit, gym
  IY: 'i', // bee, see, machine
  UH: 'ʊ', // book, put, could
  UW: 'u', // too, blue, food

  // Diphthongs
  AW: 'aʊ', // cow, how, out
  AY: 'aɪ', // my, eye, time
  EY: 'eɪ', // say, day, make
  OW: 'oʊ', // go, show, coat
  OY: 'ɔɪ', // boy, toy, coin
};

/**
 * ARPAbet consonants to IPA symbols.
 */
export const IPA_CONSONANT_MAP: Record<string, string> = {
  // Stops (plosives)
  B: 'b',
  D: 'd',
  G: 'ɡ', // Note: IPA uses ɡ (U+0261), not g
  K: 'k',
  P: 'p',
  T: 't',

  // Fricatives
  DH: 'ð', // the, this (voiced dental)
  F: 'f',
  HH: 'h',
  S: 's',
  SH: 'ʃ', // ship
  TH: 'θ', // think (voiceless dental)
  V: 'v',
  Z: 'z',
  ZH: 'ʒ', // measure, beige

  // Affricates
  CH: 'tʃ', // chat, batch
  JH: 'dʒ', // just, edge

  // Nasals
  M: 'm',
  N: 'n',
  NG: 'ŋ', // sing, thing

  // Liquids
  L: 'l',
  R: 'ɹ', // alveolar approximant

  // Glides (semivowels)
  W: 'w',
  Y: 'j',
};

/**
 * Combined ARPAbet to IPA map.
 */
export const ARPABET_TO_IPA_MAP: Record<string, string> = {
  ...IPA_VOWEL_MAP,
  ...IPA_CONSONANT_MAP,
};

/**
 * IPA to ARPAbet reverse mapping.
 * Built from the forward map for consistency.
 */
export const IPA_TO_ARPABET_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(ARPABET_TO_IPA_MAP).map(([arpabet, ipa]) => [ipa, arpabet])
);
