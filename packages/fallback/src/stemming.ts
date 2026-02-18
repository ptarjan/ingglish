/**
 * Morphological stemming for unknown words.
 *
 * Attempts to find known base words by removing common
 * prefixes and suffixes.
 */

import { arpabetToFormat, stripStress } from '@ingglish/phonemes';
import type { OutputFormat } from '@ingglish/phonemes';
import { lookupPronunciation } from '@ingglish/dictionary';

/** Voiceless consonants for -ed allomorph selection */
const VOICELESS = new Set(['P', 'T', 'K', 'CH', 'F', 'TH', 'S', 'SH', 'HH']);

/** Sibilants for -s allomorph selection */
const SIBILANTS = new Set(['S', 'Z', 'SH', 'ZH', 'CH', 'JH']);

/**
 * Select the correct -ed allomorph based on the last phoneme of the stem.
 * - /T/ after voiceless consonants (walked, kissed)
 * - /IH0 D/ after /T/ or /D/ (wanted, needed)
 * - /D/ after voiced consonants and vowels (played, called)
 */
function selectEdPhonemes(lastPhoneme: string): string[] {
  const base = stripStress(lastPhoneme);
  if (base === 'T' || base === 'D') {
    return ['IH0', 'D'];
  }
  if (VOICELESS.has(base)) {
    return ['T'];
  }
  return ['D'];
}

/**
 * Select the correct -s allomorph based on the last phoneme of the stem.
 * - /IH0 Z/ after sibilants (dishes, judges)
 * - /S/ after voiceless consonants (cats, walks)
 * - /Z/ after voiced consonants and vowels (dogs, plays)
 */
function selectSPhonemes(lastPhoneme: string): string[] {
  const base = stripStress(lastPhoneme);
  if (SIBILANTS.has(base)) {
    return ['IH0', 'Z'];
  }
  if (VOICELESS.has(base)) {
    return ['S'];
  }
  return ['Z'];
}

/**
 * Common English suffixes and their phonetic representations.
 * Used when trying to stem unknown words.
 */
/** Inflectional suffixes that should try aggressive stem variants
 * (stem+e, stem-1char, stem+doubled, i→y, stem+y) */
const INFLECTIONAL_SUFFIXES = new Set([
  'ing',
  'ed',
  'es',
  's',
  'er',
  'or',
  'est',
  'ify',
  'ifying',
  'ification',
]);

export const SUFFIX_PHONEMES: { suffix: string; phonemes: string[] | null }[] = [
  // Long suffixes first (must come before shorter matches: -ification before -tion, -ifying before -ing)
  { suffix: 'ification', phonemes: ['IH0', 'F', 'IH0', 'K', 'EY1', 'SH', 'AH0', 'N'] },
  { suffix: 'ifying', phonemes: ['IH0', 'F', 'AY1', 'IH0', 'NG'] },
  { suffix: 'ify', phonemes: ['IH0', 'F', 'AY1'] },

  // Verb suffixes
  { suffix: 'ing', phonemes: ['IH0', 'NG'] },
  { suffix: 'ed', phonemes: null }, // allomorph: T/D/IH0 D (selected dynamically)
  { suffix: 'es', phonemes: null }, // allomorph: same as -s (S/Z/IH0 Z based on stem)
  { suffix: 's', phonemes: null }, // allomorph: S/Z/IH0 Z (selected dynamically)

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

  // Additional suffixes
  { suffix: 'ally', phonemes: ['AH0', 'L', 'IY0'] },
  { suffix: 'ology', phonemes: ['AA1', 'L', 'AH0', 'JH', 'IY0'] },
  { suffix: 'ize', phonemes: ['AY1', 'Z'] },
  { suffix: 'ise', phonemes: ['AY1', 'Z'] },
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

      // Try various stem modifications.
      // Inflectional suffixes try aggressive variants (stem+e, stem-1, etc.)
      // Derivational suffixes only try direct stem to avoid false matches.
      const stemVariants: string[] = [stem];
      if (INFLECTIONAL_SUFFIXES.has(suffix)) {
        stemVariants.push(
          stem + 'e', // hoping -> hope
          stem.length > 1 ? stem.slice(0, -1) : stem, // running -> run (double consonant)
          stem.length > 0 ? stem + stem[stem.length - 1] : stem // big -> bigg (for adding -er)
        );
      }
      // i→y and stem+y work for both inflectional and derivational
      if (stem.endsWith('i')) {
        stemVariants.push(stem.slice(0, -1) + 'y'); // loveliest -> lovely
      }
      stemVariants.push(stem + 'y'); // uglify -> ugly

      for (const variant of stemVariants) {
        const baseArpabet = lookupPronunciation(variant);
        if (baseArpabet) {
          // Select allomorph for -ed, -es, and -s based on last phoneme of stem
          let resolvedSuffix: string[];
          if (suffixArpabet === null) {
            const lastPhoneme = baseArpabet[baseArpabet.length - 1];
            if (suffix === 'ed') {
              resolvedSuffix = selectEdPhonemes(lastPhoneme);
            } else {
              // suffix === 's' or 'es' — same allomorph logic
              resolvedSuffix = selectSPhonemes(lastPhoneme);
            }
          } else {
            resolvedSuffix = suffixArpabet;
          }

          const fullArpabet = [...baseArpabet, ...resolvedSuffix];
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
