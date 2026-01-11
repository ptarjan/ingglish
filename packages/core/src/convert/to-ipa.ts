/**
 * ARPAbet to IPA conversion.
 *
 * Converts CMU dictionary phoneme sequences to IPA notation,
 * with proper stress marker placement at syllable boundaries.
 */

import { stripStress, isVowel, STRESS_MARKER_REGEX } from '../phonemes/arpabet';
import { findOnsetStart } from '../phonemes/phonotactics';
import { ARPABET_TO_IPA_MAP } from './ipa-maps';

/**
 * Word joiner character (U+2060) - prevents line breaks between stress markers
 * and following phonemes without affecting visual display.
 */
const WORD_JOINER = '\u2060';

/**
 * IPA stress markers.
 * Primary stress: ˈ (U+02C8)
 * Secondary stress: ˌ (U+02CC)
 */
const STRESS_MARKERS: Record<string, string> = {
  '1': WORD_JOINER + 'ˈ' + WORD_JOINER,
  '2': WORD_JOINER + 'ˌ' + WORD_JOINER,
  '0': '',
};

/**
 * Converts a single ARPAbet phoneme to IPA.
 * Handles stress markers on vowels.
 *
 * @param phoneme ARPAbet phoneme (e.g., "AH0", "EY1", "B")
 * @returns IPA symbol (e.g., "ə", "ˈeɪ", "b")
 */
export function arpabetPhonemeToIPA(phoneme: string): string {
  const base = stripStress(phoneme);
  const stressMatch = STRESS_MARKER_REGEX.exec(phoneme);
  const stress = stressMatch !== null ? stressMatch[0] : null;

  const ipa = ARPABET_TO_IPA_MAP[base];
  if (ipa === undefined) {
    // Unknown phoneme - return as lowercase
    return phoneme.toLowerCase();
  }

  // For unstressed schwa (AH0), use the schwa symbol
  if (base === 'AH' && stress === '0') {
    return 'ə';
  }

  // Add stress marker before the vowel if stressed (stress '1' or '2')
  // Note: stress '0' has empty marker, so we can skip the check
  if (stress === '1' || stress === '2') {
    return STRESS_MARKERS[stress] + ipa;
  }

  return ipa;
}

/**
 * Converts an array of ARPAbet phonemes to IPA.
 * Places stress markers at syllable boundaries (before onset consonants),
 * not directly before vowels.
 *
 * @param arpabet Array of ARPAbet symbols (e.g., ["HH", "AH0", "L", "OW1"])
 * @returns IPA transcription with slashes (e.g., "/həˈloʊ/")
 */
export function arpabetToIPA(arpabet: string[]): string {
  // First pass: convert all ARPAbet to IPA and track stress positions
  const ipaSegments: string[] = [];
  const stressPositions: { index: number; marker: string }[] = [];

  for (let i = 0; i < arpabet.length; i++) {
    const symbol = arpabet[i];
    const base = stripStress(symbol);
    const stressMatch = STRESS_MARKER_REGEX.exec(symbol);
    const stress = stressMatch !== null ? stressMatch[0] : null;

    const ipa = ARPABET_TO_IPA_MAP[base];
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
        // Collect consecutive consonants before this vowel (push + reverse is O(n) vs unshift O(n²))
        while (j >= 0 && !isVowel(arpabet[j])) {
          consonants.push(stripStress(arpabet[j]));
          j--;
        }
        consonants.reverse();
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
  // Single-pass construction avoids O(n²) splice operations
  const sortedStress = stressPositions.sort((a, b) => a.index - b.index);
  const result: string[] = [];
  let stressIdx = 0;

  for (let i = 0; i <= ipaSegments.length; i++) {
    // Insert any stress markers at this position
    while (stressIdx < sortedStress.length && sortedStress[stressIdx].index === i) {
      result.push(sortedStress[stressIdx].marker);
      stressIdx++;
    }
    if (i < ipaSegments.length) {
      result.push(ipaSegments[i]);
    }
  }

  // Return with IPA brackets
  return `/${result.join('')}/`;
}

/**
 * Converts ARPAbet to IPA without surrounding slashes.
 * Useful for combining with other text.
 *
 * @param arpabet Array of ARPAbet symbols
 * @returns IPA transcription without surrounding slashes
 */
export function arpabetToIPARaw(arpabet: string[]): string {
  const full = arpabetToIPA(arpabet);
  return full.slice(1, -1); // Remove leading/trailing slashes
}
