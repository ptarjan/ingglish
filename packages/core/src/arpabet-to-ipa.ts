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
 * Stress markers for IPA output.
 * 1 = primary stress (ˈ), 2 = secondary stress (ˌ), 0 = unstressed
 */
const STRESS_MARKERS: Record<string, string> = {
  '1': 'ˈ',
  '2': 'ˌ',
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
 * Converts an array of ARPAbet phonemes to IPA.
 *
 * @param phonemes - Array of ARPAbet phonemes (e.g., ["HH", "AH0", "L", "OW1"])
 * @returns IPA transcription (e.g., "/həˈloʊ/")
 */
export function phonemesToIPA(phonemes: string[]): string {
  // Collect IPA segments, inserting stress markers at correct positions
  const segments: string[] = [];

  for (const phoneme of phonemes) {
    const base = stripStress(phoneme);
    const stressMatch = /[012]$/.exec(phoneme);
    const stress = stressMatch !== null ? stressMatch[0] : null;

    const ipa = ARPABET_TO_IPA[base];
    if (ipa === undefined) {
      segments.push(phoneme.toLowerCase());
      continue;
    }

    // Handle schwa for unstressed AH
    if (base === 'AH' && stress === '0') {
      segments.push('ə');
      continue;
    }

    // For stressed vowels, add stress marker before the vowel
    if (stress === '1') {
      segments.push('ˈ' + ipa);
    } else if (stress === '2') {
      segments.push('ˌ' + ipa);
    } else {
      segments.push(ipa);
    }
  }

  // Return with IPA brackets
  return '/' + segments.join('') + '/';
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
