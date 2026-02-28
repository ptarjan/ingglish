/**
 * ARPAbet to guide pronunciation format.
 *
 * Converts phonemes to a dictionary/travel-guide style output:
 * hyphens between syllables, stressed syllables in ALL CAPS.
 * e.g. "hello" → "ha-LOH", "beautiful" → "BYOO-ta-fal"
 */

import { getStress, isVowel, stripStress } from './arpabet';
import { registerFormat } from './format-registry';
import { R_COLORED_FORWARD } from './ingglish-maps';
import { findOnsetStart } from './phonotactics';
import { INGGLISH_FULL_MAP } from './to-ingglish';

export interface Syllable {
  phonemes: string[];
  stress: number;
}

/**
 * Converts ARPAbet phonemes to guide pronunciation format.
 * Syllables separated by hyphens, stressed syllables in ALL CAPS.
 *
 * @example
 * arpabetToPronunciation(['HH', 'AH0', 'L', 'OW1']) // "ha-LOH"
 * arpabetToPronunciation(['B', 'Y', 'UW1', 'T', 'AH0', 'F', 'AH0', 'L']) // "BYOO-ta-fal"
 */
export function arpabetToPronunciation(arpabet: string[]): string {
  const syllables = syllabify(arpabet);
  return syllables
    .map(({ phonemes, stress }) => {
      const spelling = syllableToSpelling(phonemes);
      return stress >= 1 ? spelling.toUpperCase() : spelling;
    })
    .join('-');
}

registerFormat('pronunciation', {
  forward: arpabetToPronunciation,
  isLatinScript: true,
  label: 'Guide',
  preservesCase: false,
});

/**
 * Syllabifies ARPAbet phonemes using the Maximal Onset Principle.
 * Each vowel is a syllable nucleus. Consonants between vowels are
 * split into coda + onset using findOnsetStart().
 */
export function syllabify(arpabet: string[]): Syllable[] {
  const vowelIndices: number[] = [];
  for (const [i, phoneme] of arpabet.entries()) {
    if (isVowel(phoneme)) {
      vowelIndices.push(i);
    }
  }

  if (vowelIndices.length === 0) {
    return [{ phonemes: arpabet, stress: 0 }];
  }

  const syllables: Syllable[] = [];
  let start = 0;

  for (let vi = 0; vi < vowelIndices.length; vi++) {
    const vowelIdx = vowelIndices[vi]!;
    const stress = getStress(arpabet[vowelIdx]!) ?? 0;

    if (vi < vowelIndices.length - 1) {
      const nextVowelIdx = vowelIndices[vi + 1]!;
      const consonantStart = vowelIdx + 1;
      const consonants: string[] = [];
      for (let j = consonantStart; j < nextVowelIdx; j++) {
        consonants.push(stripStress(arpabet[j]!));
      }

      if (consonants.length === 0) {
        // Adjacent vowels — syllable break between them
        syllables.push({ phonemes: arpabet.slice(start, consonantStart), stress });
        start = consonantStart;
      } else {
        const onsetIdx = findOnsetStart(consonants);
        const boundary = consonantStart + onsetIdx;
        syllables.push({ phonemes: arpabet.slice(start, boundary), stress });
        start = boundary;
      }
    } else {
      // Last syllable extends to end
      syllables.push({ phonemes: arpabet.slice(start), stress });
    }
  }

  return syllables;
}

/**
 * Converts a syllable's phonemes to Ingglish spelling,
 * handling R-colored vowels within the syllable.
 */
function syllableToSpelling(phonemes: string[]): string {
  let result = '';
  for (let i = 0; i < phonemes.length; i++) {
    const phoneme = phonemes[i]!;
    // R-colored vowel check: only if next phoneme is R
    if (i + 1 < phonemes.length && phonemes[i + 1] === 'R') {
      const base = stripStress(phoneme);
      const rPrefix = R_COLORED_FORWARD.get(base);
      if (rPrefix !== undefined) {
        result += rPrefix;
        continue;
      }
    }
    result += INGGLISH_FULL_MAP[phoneme] ?? phoneme.toLowerCase();
  }
  return result;
}
