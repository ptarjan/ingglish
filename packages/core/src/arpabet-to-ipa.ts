/**
 * ARPAbet to IPA (International Phonetic Alphabet) converter.
 *
 * Used to convert CMU dictionary phonemes to IPA for display.
 * This is the reverse of ipa-to-arpabet.ts.
 */

import { stripStress } from './phoneme-map';

/**
 * Mapping from ARPAbet phonemes to IPA symbols.
 * Covers American English sounds.
 */
const ARPABET_TO_IPA: Record<string, string> = {
  // Vowels (monophthongs)
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

  // Consonants - Stops
  B: 'b',
  D: 'd',
  G: 'ɡ',
  K: 'k',
  P: 'p',
  T: 't',

  // Consonants - Fricatives
  DH: 'ð', // the, this, father (voiced)
  F: 'f',
  HH: 'h',
  S: 's',
  SH: 'ʃ', // ship
  TH: 'θ', // think, bath (voiceless)
  V: 'v',
  Z: 'z',
  ZH: 'ʒ', // measure, beige

  // Consonants - Affricates
  CH: 'tʃ', // chat, batch
  JH: 'dʒ', // just, edge

  // Consonants - Nasals
  M: 'm',
  N: 'n',
  NG: 'ŋ', // sing, thing

  // Consonants - Liquids
  L: 'l',
  R: 'ɹ',

  // Consonants - Glides
  W: 'w',
  Y: 'j',
};

/**
 * Word joiner character (U+2060) - prevents line breaks between stress markers
 * and following phonemes without affecting visual display.
 */
const WORD_JOINER = '\u2060';

/**
 * Stress markers for IPA output.
 * 1 = primary stress (ˈ), 2 = secondary stress (ˌ), 0 = unstressed
 * Word joiner surrounds the marker to prevent line breaks on either side.
 */
const STRESS_MARKERS: Record<string, string> = {
  '1': WORD_JOINER + 'ˈ' + WORD_JOINER,
  '2': WORD_JOINER + 'ˌ' + WORD_JOINER,
  '0': '',
};

/**
 * Converts an ARPAbet phoneme to IPA.
 * Handles stress markers on vowels.
 *
 * @param phoneme - ARPAbet phoneme (e.g., "AH0", "EY1")
 * @returns IPA symbol (e.g., "ə", "ˈeɪ")
 */
export function arpabetPhonemeToIPA(phoneme: string): string {
  const base = stripStress(phoneme);
  const stressMatch = /[012]$/.exec(phoneme);
  const stress = stressMatch ? stressMatch[0] : null;

  const ipa = ARPABET_TO_IPA[base];
  if (!ipa) {
    // Unknown phoneme - return as lowercase
    return phoneme.toLowerCase();
  }

  // For unstressed schwa (AH0), use the schwa symbol
  if (base === 'AH' && stress === '0') {
    return 'ə';
  }

  // Add stress marker before the vowel if stressed
  if (stress !== null && stress !== '' && STRESS_MARKERS[stress] !== undefined) {
    const marker = STRESS_MARKERS[stress];
    if (marker !== '') {
      return marker + ipa;
    }
  }

  return ipa;
}

/**
 * Check if an ARPAbet phoneme is a vowel (has stress marker or is a vowel sound).
 */
function isVowel(phoneme: string): boolean {
  const base = stripStress(phoneme);
  // All ARPAbet vowels are 2-letter codes that start with A, E, I, O, U
  // and can have stress markers (0, 1, 2)
  return /^(AA|AE|AH|AO|AW|AY|EH|ER|EY|IH|IY|OW|OY|UH|UW)$/.test(base);
}

/**
 * Converts an array of ARPAbet phonemes to IPA.
 * Places stress markers at syllable boundaries (before onset consonants),
 * not directly before vowels.
 *
 * @param phonemes - Array of ARPAbet phonemes (e.g., ["HH", "AH0", "L", "OW1"])
 * @returns IPA transcription (e.g., "/həˈloʊ/")
 */
export function phonemesToIPA(phonemes: string[]): string {
  // First pass: convert all phonemes to IPA and track stress positions
  const ipaSegments: string[] = [];
  const stressPositions: { index: number; marker: string }[] = [];

  for (let i = 0; i < phonemes.length; i++) {
    const phoneme = phonemes[i];
    const base = stripStress(phoneme);
    const stressMatch = /[012]$/.exec(phoneme);
    const stress = stressMatch !== null ? stressMatch[0] : null;

    const ipa = ARPABET_TO_IPA[base];
    if (ipa === undefined) {
      ipaSegments.push(phoneme.toLowerCase());
      continue;
    }

    // Handle schwa for unstressed AH
    if (base === 'AH' && stress === '0') {
      ipaSegments.push('ə');
      continue;
    }

    // Record stress position for later insertion at syllable boundary
    if (stress === '1' || stress === '2') {
      const marker =
        stress === '1' ? WORD_JOINER + 'ˈ' + WORD_JOINER : WORD_JOINER + 'ˌ' + WORD_JOINER;
      // Find where to place the stress marker (at syllable onset)
      let onsetIndex = ipaSegments.length;

      // Look backwards to find the onset consonant(s) of this syllable
      // Simple heuristic: take one consonant back if it exists and previous segment is a vowel
      // or take consecutive consonants if they form a valid onset cluster
      if (i > 0) {
        let j = i - 1;
        // Find consecutive consonants before this vowel
        while (j >= 0 && !isVowel(phonemes[j])) {
          j--;
        }
        // j is now at the previous vowel (or -1 if no previous vowel)
        // The onset starts at j+1
        const onsetStart = j + 1;
        if (onsetStart < i) {
          // There are consonants before this vowel - they form the onset
          onsetIndex = onsetStart;
        }
      }

      stressPositions.push({ index: onsetIndex, marker });
    }

    ipaSegments.push(ipa);
  }

  // Build final string with stress markers inserted at correct positions
  // Process stress positions in reverse order so indices don't shift
  const sortedStress = stressPositions.sort((a, b) => b.index - a.index);
  for (const { index, marker } of sortedStress) {
    ipaSegments.splice(index, 0, marker);
  }

  // Return with IPA brackets
  return '/' + ipaSegments.join('') + '/';
}

/**
 * Converts an array of ARPAbet phonemes to IPA without brackets.
 * Useful for combining with other text.
 *
 * @param phonemes - Array of ARPAbet phonemes
 * @returns IPA transcription without surrounding slashes
 */
export function phonemesToIPARaw(phonemes: string[]): string {
  const full = phonemesToIPA(phonemes);
  return full.slice(1, -1); // Remove leading/trailing slashes
}
