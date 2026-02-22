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
  // Diphthongs
  AW: 'aʊ', // cow, how, out
  AY: 'aɪ', // my, eye, time
  EH: 'ɛ', // bed, red, said
  ER: 'ɝ', // bird, her, nurse
  EY: 'eɪ', // say, day, make
  IH: 'ɪ', // bit, sit, gym

  IY: 'i', // bee, see, machine
  OW: 'oʊ', // go, show, coat
  OY: 'ɔɪ', // boy, toy, coin
  UH: 'ʊ', // book, put, could
  UW: 'u', // too, blue, food
};

/**
 * ARPAbet consonants to IPA symbols.
 */
export const IPA_CONSONANT_MAP: Record<string, string> = {
  // Stops (plosives)
  B: 'b',
  // Affricates
  CH: 'tʃ', // chat, batch
  D: 'd',
  // Fricatives
  DH: 'ð', // the, this (voiced dental)
  F: 'f',
  G: 'ɡ', // Note: IPA uses ɡ (U+0261), not g

  HH: 'h',
  JH: 'dʒ', // just, edge
  K: 'k',
  // Liquids
  L: 'l',
  // Nasals
  M: 'm',
  N: 'n',
  NG: 'ŋ', // sing, thing
  P: 'p',
  R: 'ɹ', // alveolar approximant

  S: 's',
  SH: 'ʃ', // ship

  T: 't',
  TH: 'θ', // think (voiceless dental)
  V: 'v',

  // Glides (semivowels)
  W: 'w',
  Y: 'j',

  Z: 'z',
  ZH: 'ʒ', // measure, beige
};

/**
 * Combined ARPAbet to IPA map.
 */
export const ARPABET_TO_IPA_MAP: Record<string, string> = {
  ...IPA_VOWEL_MAP,
  ...IPA_CONSONANT_MAP,
};

/**
 * Additional IPA symbols that map to ARPAbet but aren't produced by the
 * forward (ARPAbet→IPA) map. These handle real-world IPA variants and
 * common transcription differences.
 */
export const IPA_VARIANT_MAP: Record<string, string> = {
  a: 'AE', // fallback for plain a
  e: 'EY', // some IPA uses plain e for face vowel
  ə: 'AH0', // schwa (unstressed) — forward map uses ʌ→AH for the stressed variant
  ɚ: 'ER', // r-colored schwa variant — forward map uses ɝ→ER
  g: 'G', // ASCII g — forward map uses ɡ (U+0261)
  ɫ: 'L', // dark l
  o: 'OW', // some IPA uses plain o for goat vowel
  r: 'R', // common variant — forward map uses ɹ (alveolar approximant)
  y: 'Y', // common variant — forward map uses j (palatal approximant)
};

/**
 * IPA to ARPAbet reverse mapping.
 * Built from the forward map, plus additional IPA variants for
 * handling real-world transcriptions.
 */
export const IPA_TO_ARPABET_MAP: Record<string, string> = {
  ...Object.fromEntries(Object.entries(ARPABET_TO_IPA_MAP).map(([arpabet, ipa]) => [ipa, arpabet])),
  ...IPA_VARIANT_MAP,
};
