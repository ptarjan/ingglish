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
  a: 'AE', // plain /a/ — maps to "a" (cat) for recognizable foreign word output
  e: 'EH', // plain /e/ — mid front vowel, like "bed"
  ə: 'AH0', // schwa (unstressed) — forward map uses ʌ→AH for the stressed variant
  ɚ: 'ER', // r-colored schwa variant — forward map uses ɝ→ER
  g: 'G', // ASCII g — forward map uses ɡ (U+0261)
  ɫ: 'L', // dark l
  o: 'OW', // some IPA uses plain o for goat vowel
  r: 'R', // common variant — forward map uses ɹ (alveolar approximant)
  // Note: IPA /y/ is the close front rounded vowel (French "tu", German "über").
  // It's handled in IPA_APPROXIMATION_MAP as y→UW. The consonant /j/ (palatal
  // approximant) is already mapped via the forward map reversal (j→Y).
};

/**
 * Approximate mappings for non-English IPA sounds.
 *
 * When converting IPA from other languages, many sounds have no exact English
 * equivalent. These map each to the closest English phoneme. The approximations
 * follow what English speakers naturally substitute (and what phrasebooks use).
 *
 * Organized by category: vowels, consonants (by manner of articulation).
 */
export const IPA_APPROXIMATION_MAP: Record<string, string> = {
  // --- Open vowels ---
  ä: 'AA', // /ä/ open central — IPA diacritic variant ≈ "father"
  ɐ: 'AH', // /ɐ/ near-open central — Portuguese unstressed "a" ≈ "but"

  // --- Open vowel diphthongs (Finnish, etc.) ---
  // English uses /aɪ/ and /aʊ/ (with plain 'a'), but Finnish/other languages
  // use /ɑi/ and /ɑu/ (with open back 'ɑ'). Treat as diphthongs, not two vowels.
  ɑi: 'AY', // /ɑi/ — Finnish "taivas" ≈ "my" diphthong
  ɑu: 'AW', // /ɑu/ — Finnish "sauna" ≈ "cow" diphthong
  // Nasal vowels (ɑ̃, ɛ̃, ɔ̃, etc.) are handled in from-ipa.ts by
  // converting vowel+combining-tilde to vowel+"n" before map lookup.
  ɒ: 'AO', // /ɒ/ open back rounded — British "lot" ≈ "thought"

  // --- Implosives and other stops ---
  ɓ: 'B', // /ɓ/ voiced bilabial implosive ≈ B
  ç: 'SH', // /ç/ voiceless palatal fricative — "ich" (German) ≈ "sh"
  // --- Alveolo-palatal (Mandarin, Japanese, Polish) ---
  ɕ: 'SH', // /ɕ/ voiceless alveolo-palatal fricative — Mandarin "xi" ≈ "sh"
  dʑ: 'JH', // /dʑ/ voiced alveolo-palatal affricate — Japanese "ji" ≈ "j"
  // --- Retroflex (Hindi, Mandarin) ---
  ɖ: 'D', // /ɖ/ voiced retroflex stop — Hindi ≈ D
  ɗ: 'D', // /ɗ/ voiced alveolar implosive ≈ D
  ɘ: 'AH0', // /ɘ/ close-mid central ≈ schwa

  ɜ: 'ER', // /ɜ/ open-mid central — non-rhotic "bird" ≈ "er"
  ɞ: 'ER', // /ɞ/ open-mid central rounded ≈ "er"
  ɤ: 'AH', // /ɤ/ close-mid back unrounded — Korean "ㅓ" ≈ "but"

  ɢ: 'G', // /ɢ/ voiced uvular stop ≈ G
  ɣ: 'G', // /ɣ/ voiced velar fricative — Spanish "lago" ≈ G
  // --- Pharyngeal (Arabic) ---
  ħ: 'HH', // /ħ/ voiceless pharyngeal fricative — Arabic "ha" ≈ H
  // --- Central/back vowels not in English ---
  ɨ: 'IH', // /ɨ/ close central — Russian "ы" ≈ "bit"
  ɬ: 'L', // /ɬ/ voiceless lateral fricative — Welsh "ll" ≈ L
  ɭ: 'L', // /ɭ/ retroflex lateral ≈ L

  // --- Laterals ---
  ʎ: 'L', // /ʎ/ palatal lateral — Italian "figlio", Spanish "ll" ≈ L
  ɱ: 'M', // /ɱ/ labiodental nasal ≈ M
  ɴ: 'N', // /ɴ/ uvular nasal — Japanese moraic ん ≈ "n" (not "ng")

  // --- Nasals ---
  ɲ: 'N', // /ɲ/ palatal nasal — Spanish "ñ", Italian "gn" ≈ N (+ Y added below)
  ɳ: 'N', // /ɳ/ retroflex nasal ≈ N
  // tɕ and dʑ are handled as two-char sequences below

  ø: 'ER', // /ø/ close-mid front rounded — "peu" (French) ≈ "per" (without the r)
  œ: 'ER', // /œ/ open-mid front rounded — "peur" (French) ≈ "purr"
  ɸ: 'F', // /ɸ/ voiceless bilabial fricative — Japanese "fu" ≈ F
  q: 'K', // /q/ voiceless uvular stop — Arabic "Quran" ≈ K
  ʀ: 'R', // /ʀ/ uvular trill — some German dialects ≈ English R
  ɽ: 'D', // /ɽ/ retroflex flap — Hindi ≈ D
  // --- Taps and trills (Spanish, Italian, etc.) ---
  ɾ: 'R', // /ɾ/ alveolar tap — Spanish "pero" ≈ R (also like "butter" flap)

  // --- Uvular consonants (French, German, Arabic) ---
  ʁ: 'R', // /ʁ/ voiced uvular fricative — French/German R ≈ English R

  ʂ: 'SH', // /ʂ/ voiceless retroflex fricative — Mandarin "shi" ≈ "sh"
  // --- Affricates (two-char sequences matched by the converter) ---
  tɕ: 'CH', // /tɕ/ voiceless alveolo-palatal affricate — Mandarin "ji", Korean "ㅈ" ≈ "ch"

  ʈ: 'T', // /ʈ/ voiceless retroflex stop — Hindi ≈ T
  ʈʂ: 'CH', // /ʈʂ/ voiceless retroflex affricate — Mandarin "zhi" ≈ "ch"

  // --- Labial-velar ---
  ɥ: 'W', // /ɥ/ labial-palatal approximant — French "lui" ≈ W
  ɯ: 'UH', // /ɯ/ close back unrounded — Japanese "u", Turkish "ı" ≈ "book" (shorter than "oo")

  ʋ: 'V', // /ʋ/ labiodental approximant — Hindi, Dutch ≈ V
  // --- Velar/palatal fricatives (German, Mandarin, etc.) ---
  x: 'K', // /x/ voiceless velar fricative — "Bach", "loch" ≈ K

  // --- Front rounded vowels (French, German, Turkish, etc.) ---
  y: 'UW', // /y/ close front rounded — "tu" (French) ≈ "too"
  ʏ: 'UH', // /ʏ/ near-close front rounded — "Glück" (German) ≈ "book"

  ʐ: 'ZH', // /ʐ/ voiced retroflex fricative — Mandarin "ri" ≈ "zh"
  ʑ: 'ZH', // /ʑ/ voiced alveolo-palatal fricative ≈ "zh"

  // --- Glottal ---
  ʔ: '', // /ʔ/ glottal stop — often silent in approximation

  // Note: length mark ː and combining diacritics are stripped in from-ipa.ts
  // before lookup. Nasal vowels (◌̃) are converted to vowel+n there.

  // --- Dental fricatives already in English ---
  // θ and ð are in the main map

  ʕ: 'AH', // /ʕ/ voiced pharyngeal fricative — Arabic "ain" ≈ "uh" (rough)
  // --- Bilabial fricatives (Spanish) ---
  β: 'V', // /β/ voiced bilabial fricative — Spanish "b" between vowels ≈ V
  χ: 'K', // /χ/ voiceless uvular fricative — deeper "Bach" ≈ K
};

/**
 * IPA to ARPAbet reverse mapping.
 * Built from the forward map, plus additional IPA variants and
 * approximations for non-English sounds.
 *
 * Priority order: exact matches (from forward map) > variants > approximations.
 * Approximations are lowest priority so they never override exact English mappings.
 */
export const IPA_TO_ARPABET_MAP: Record<string, string> = {
  ...IPA_APPROXIMATION_MAP,
  ...Object.fromEntries(Object.entries(ARPABET_TO_IPA_MAP).map(([arpabet, ipa]) => [ipa, arpabet])),
  ...IPA_VARIANT_MAP,
};
