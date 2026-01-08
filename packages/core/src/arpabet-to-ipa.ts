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
 * Valid English onset clusters (using ARPAbet phonemes).
 * Based on English phonotactics - these are the consonant combinations
 * that can legally start a syllable in English.
 */
const VALID_ONSETS = new Set([
  // Single consonants (all are valid onsets)
  'B',
  'CH',
  'D',
  'DH',
  'F',
  'G',
  'HH',
  'JH',
  'K',
  'L',
  'M',
  'N',
  'P',
  'R',
  'S',
  'SH',
  'T',
  'TH',
  'V',
  'W',
  'Y',
  'Z',
  'ZH',
  // Note: NG is NOT a valid onset in English
  // Two-consonant clusters: consonant + liquid (L, R)
  'B L',
  'B R',
  'D R',
  'F L',
  'F R',
  'G L',
  'G R',
  'K L',
  'K R',
  'P L',
  'P R',
  'SH R',
  'T R',
  'TH R',
  // Two-consonant clusters: consonant + glide (W, Y)
  'B Y',
  'D W',
  'D Y',
  'F Y',
  'G W',
  'G Y',
  'HH Y',
  'HH W',
  'K W',
  'K Y',
  'L Y',
  'M Y',
  'N Y',
  'P Y',
  'S W',
  'S Y',
  'T W',
  'T Y',
  'TH W',
  'TH Y',
  'V Y',
  'Z Y',
  // Two-consonant clusters: s + consonant
  'S K',
  'S L',
  'S M',
  'S N',
  'S P',
  'S T',
  // Three-consonant clusters: s + stop + liquid/glide
  'S K R',
  'S K W',
  'S K Y',
  'S P L',
  'S P R',
  'S P Y',
  'S T R',
  'S T Y',
]);

/**
 * Checks if a sequence of consonant phonemes forms a valid English onset.
 */
function isValidOnset(consonants: string[]): boolean {
  if (consonants.length === 0) {
    return true;
  }
  const key = consonants.join(' ');
  return VALID_ONSETS.has(key);
}

/**
 * Finds the starting index of the maximal valid onset from a consonant cluster.
 * Uses the Maximal Onset Principle: assign as many consonants as possible
 * to the onset, as long as they form a legal onset cluster.
 *
 * @param consonants Array of consonant phonemes between two vowels
 * @returns Index within the consonant array where the valid onset begins
 */
function findOnsetStart(consonants: string[]): number {
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
 * Converts an array of ARPAbet phonemes to IPA.
 * Places stress markers at syllable boundaries (before onset consonants),
 * not directly before vowels.
 *
 * @param arpabet - Array of ARPAbet symbols (e.g., ["HH", "AH0", "L", "OW1"])
 * @returns IPA transcription (e.g., "/həˈloʊ/")
 */
export function arpabetToIPA(arpabet: string[]): string {
  // First pass: convert all ARPAbet to IPA and track stress positions
  const ipaSegments: string[] = [];
  const stressPositions: { index: number; marker: string }[] = [];

  for (let i = 0; i < arpabet.length; i++) {
    const symbol = arpabet[i];
    const base = stripStress(symbol);
    const stressMatch = /[012]$/.exec(symbol);
    const stress = stressMatch !== null ? stressMatch[0] : null;

    const ipa = ARPABET_TO_IPA[base];
    if (ipa === undefined) {
      ipaSegments.push(symbol.toLowerCase());
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

      // Look backwards to find consonants between this vowel and the previous vowel
      if (i > 0) {
        let j = i - 1;
        const consonants: string[] = [];
        // Collect consecutive consonants before this vowel
        while (j >= 0 && !isVowel(arpabet[j])) {
          consonants.unshift(stripStress(arpabet[j]));
          j--;
        }
        // j is now at the previous vowel (or -1 if no previous vowel)
        // Use findOnsetStart to determine which consonants form the onset
        if (consonants.length > 0) {
          const onsetStartInCluster = findOnsetStart(consonants);
          // Map back to phoneme index: j+1 is the first consonant, add onsetStartInCluster
          onsetIndex = j + 1 + onsetStartInCluster;
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
 * Converts an array of ARPAbet symbols to IPA without brackets.
 * Useful for combining with other text.
 *
 * @param arpabet - Array of ARPAbet symbols
 * @returns IPA transcription without surrounding slashes
 */
export function arpabetToIPARaw(arpabet: string[]): string {
  const full = arpabetToIPA(arpabet);
  return full.slice(1, -1); // Remove leading/trailing slashes
}
