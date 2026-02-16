/**
 * Morphological stemming for unknown words.
 *
 * Attempts to find known base words by removing common
 * prefixes and suffixes.
 */

import { arpabetToFormat } from '../convert/to-ingglish';
import { lookupPronunciation } from '../dictionary/lookup';
import { stripStress } from '../phonemes/arpabet';
import type { OutputFormat } from '../types';

/**
 * Common English suffixes and their phonetic representations.
 * Used when trying to stem unknown words.
 */
export const SUFFIX_PHONEMES: { suffix: string; phonemes: string[] }[] = [
  // Long suffixes first (must come before shorter matches: -ification before -tion, -ifying before -ing)
  { suffix: 'ification', phonemes: ['IH0', 'F', 'IH0', 'K', 'EY1', 'SH', 'AH0', 'N'] },
  { suffix: 'ifying', phonemes: ['IH0', 'F', 'AY1', 'IH0', 'NG'] },
  { suffix: 'ify', phonemes: ['IH0', 'F', 'AY1'] },

  // Verb suffixes
  { suffix: 'ing', phonemes: ['IH0', 'NG'] },
  { suffix: 'ed', phonemes: ['D'] }, // or T or IH0 D depending on context
  { suffix: 'es', phonemes: ['IH0', 'Z'] },
  { suffix: 's', phonemes: ['Z'] }, // or S

  // Noun suffixes
  { suffix: 'tion', phonemes: ['SH', 'AH0', 'N'] },
  { suffix: 'sion', phonemes: ['ZH', 'AH0', 'N'] },
  { suffix: 'ness', phonemes: ['N', 'AH0', 'S'] },
  { suffix: 'ment', phonemes: ['M', 'AH0', 'N', 'T'] },
  { suffix: 'ity', phonemes: ['IH0', 'T', 'IY0'] },
  { suffix: 'er', phonemes: ['ER0'] },
  { suffix: 'or', phonemes: ['ER0'] },
  { suffix: 'ist', phonemes: ['IH0', 'S', 'T'] },
  { suffix: 'ism', phonemes: ['IH0', 'Z', 'AH0', 'M'] },

  // Adjective suffixes
  { suffix: 'ly', phonemes: ['L', 'IY0'] },
  { suffix: 'ful', phonemes: ['F', 'AH0', 'L'] },
  { suffix: 'less', phonemes: ['L', 'AH0', 'S'] },
  { suffix: 'able', phonemes: ['AH0', 'B', 'AH0', 'L'] },
  { suffix: 'ible', phonemes: ['AH0', 'B', 'AH0', 'L'] },
  { suffix: 'ous', phonemes: ['AH0', 'S'] },
  { suffix: 'ive', phonemes: ['IH0', 'V'] },
  { suffix: 'al', phonemes: ['AH0', 'L'] },
  { suffix: 'ic', phonemes: ['IH0', 'K'] },

  // Comparative/superlative
  { suffix: 'est', phonemes: ['AH0', 'S', 'T'] },
];

/**
 * Common prefixes and their phonetic representations.
 */
export const PREFIX_PHONEMES: { prefix: string; phonemes: string[] }[] = [
  { prefix: 'un', phonemes: ['AH0', 'N'] },
  { prefix: 're', phonemes: ['R', 'IY0'] },
  { prefix: 'pre', phonemes: ['P', 'R', 'IY0'] },
  { prefix: 'dis', phonemes: ['D', 'IH0', 'S'] },
  { prefix: 'mis', phonemes: ['M', 'IH0', 'S'] },
  { prefix: 'over', phonemes: ['OW1', 'V', 'ER0'] },
  { prefix: 'under', phonemes: ['AH1', 'N', 'D', 'ER0'] },
  { prefix: 'out', phonemes: ['AW1', 'T'] },
  { prefix: 'anti', phonemes: ['AE1', 'N', 'T', 'IY0'] },
  { prefix: 'super', phonemes: ['S', 'UW1', 'P', 'ER0'] },
];

/**
 * Attempts to translate an unknown word using stemming.
 * Tries to find a known base word and apply suffix rules.
 *
 * @param word The unknown word
 * @param format The output format
 * @returns The translated word, or null if stemming didn't help
 */
export function translateWithStemming(
  word: string,
  format: OutputFormat = 'ingglish'
): string | null {
  const lowerWord = word.toLowerCase();

  // Try removing suffixes and finding base word
  for (const { suffix, phonemes: suffixArpabet } of SUFFIX_PHONEMES) {
    if (lowerWord.endsWith(suffix) && lowerWord.length > suffix.length + 2) {
      const stem = lowerWord.slice(0, -suffix.length);

      // Try various stem modifications
      const stemVariants = [
        stem,
        stem + 'e', // hoping -> hope
        stem.length > 1 ? stem.slice(0, -1) : stem, // running -> run (double consonant)
        stem.length > 0 ? stem + stem[stem.length - 1] : stem, // big -> bigg (for adding -er)
        stem.endsWith('i') ? stem.slice(0, -1) + 'y' : '', // loveliest -> lovely (i→y)
        stem + 'y', // uglify -> ugly (suffix starts with i, replacing y)
      ].filter((v) => v.length > 0);

      for (const variant of stemVariants) {
        const baseArpabet = lookupPronunciation(variant);
        if (baseArpabet) {
          // Strip stress from base word phonemes so they don't conflict
          // with the suffix's unstressed (0) markers
          const strippedBase = baseArpabet.map(stripStress);
          const fullArpabet = [...strippedBase, ...suffixArpabet];
          return arpabetToFormat(fullArpabet, format);
        }
      }
    }
  }

  // Try removing prefixes
  for (const { prefix, phonemes: prefixArpabet } of PREFIX_PHONEMES) {
    if (lowerWord.startsWith(prefix) && lowerWord.length > prefix.length + 2) {
      const stem = lowerWord.slice(prefix.length);
      const baseArpabet = lookupPronunciation(stem);
      if (baseArpabet) {
        const fullArpabet = [...prefixArpabet, ...baseArpabet];
        return arpabetToFormat(fullArpabet, format);
      }
    }
  }

  return null;
}
