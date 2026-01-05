/**
 * Phoneme to Inglish spelling mapping.
 *
 * Design principles:
 * 1. Each phoneme has exactly one spelling (no ambiguity)
 * 2. Uses only the 26 English letters (no diacritics)
 * 3. Spellings are as intuitive as possible for English readers
 * 4. Stress markers (0, 1, 2) are stripped from vowels
 *
 * ARPAbet phonemes from CMU Pronouncing Dictionary:
 * - 15 vowels (including diphthongs)
 * - 24 consonants
 */

// Vowel mappings (stress markers will be stripped before lookup)
export const VOWEL_MAP: Record<string, string> = {
  // Monophthongs
  'AA': 'ah',  // father, hot, bother
  'AE': 'a',   // cat, bat, had
  'AH': 'u',   // but, cup, son
  'AO': 'aw',  // thought, caught, law
  'EH': 'e',   // bed, red, said
  'ER': 'er',  // bird, her, nurse
  'IH': 'i',   // bit, sit, gym
  'IY': 'ee',  // bee, see, machine
  'UH': 'uu',  // book, put, could
  'UW': 'oo',  // too, blue, food

  // Diphthongs
  'AW': 'ow',  // cow, how, out
  'AY': 'ai',  // my, eye, time
  'EY': 'ay',  // say, day, make
  'OW': 'oh',  // go, show, coat
  'OY': 'oi',  // boy, toy, coin
};

// Consonant mappings
export const CONSONANT_MAP: Record<string, string> = {
  // Stops (plosives)
  'B': 'b',    // bat, cab
  'D': 'd',    // dog, bed
  'G': 'g',    // go, big
  'K': 'k',    // cat, back
  'P': 'p',    // pat, cup
  'T': 't',    // top, cat

  // Fricatives
  'DH': 'dh',  // the, this, father (voiced)
  'F': 'f',    // fat, laugh
  'S': 's',    // sat, miss
  'SH': 'sh',  // she,ush
  'TH': 'th',  // think, bath (voiceless)
  'V': 'v',    // van, love
  'Z': 'z',    // zoo, is
  'ZH': 'zh',  // measure, beige

  // Affricates
  'CH': 'ch',  // chat, batch
  'JH': 'j',   // just, edge

  // Nasals
  'M': 'm',    // man, come
  'N': 'n',    // no, pen
  'NG': 'ng',  // sing, thing

  // Liquids
  'L': 'l',    // let, well
  'R': 'r',    // run, car

  // Semivowels (glides)
  'W': 'w',    // wet, away
  'Y': 'y',    // yes, you

  // Aspirate
  'HH': 'h',   // hat, ahead
};

// Combined map for easy lookup
export const PHONEME_MAP: Record<string, string> = {
  ...VOWEL_MAP,
  ...CONSONANT_MAP,
};

/**
 * Strips stress markers (0, 1, 2) from a phoneme.
 * Example: "AH0" -> "AH", "EY1" -> "EY"
 */
export function stripStress(phoneme: string): string {
  return phoneme.replace(/[012]$/, '');
}

/**
 * Converts an array of ARPAbet phonemes to Inglish spelling.
 * @param phonemes Array of phonemes (e.g., ["HH", "AH0", "L", "OW1"])
 * @returns Inglish spelling (e.g., "huloh")
 */
export function phonemesToInglish(phonemes: string[]): string {
  return phonemes
    .map(p => {
      const base = stripStress(p);
      const inglish = PHONEME_MAP[base];
      if (!inglish) {
        console.warn(`Unknown phoneme: ${p}`);
        return p.toLowerCase();
      }
      return inglish;
    })
    .join('');
}

/**
 * Examples of the mapping:
 *
 * "hello" -> HH AH0 L OW1 -> "huloh"
 * "world" -> W ER1 L D -> "werld"
 * "the" -> DH AH0 -> "dhu"
 * "think" -> TH IH1 NG K -> "thingk"
 * "beautiful" -> B Y UW1 T AH0 F AH0 L -> "byootufuhl"
 * "English" -> IH1 NG G L IH0 SH -> "inglich"
 */
