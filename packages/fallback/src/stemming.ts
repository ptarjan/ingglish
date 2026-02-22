/**
 * Morphological stemming for unknown words.
 *
 * Attempts to find known base words by removing common
 * prefixes and suffixes.
 */

import { lookupPronunciation } from '@ingglish/dictionary';
import type { OutputFormat } from '@ingglish/phonemes';
import { arpabetToFormat, stripStress } from '@ingglish/phonemes';

/** Voiceless consonants for -ed allomorph selection */
const VOICELESS = new Set(['CH', 'F', 'HH', 'K', 'P', 'S', 'SH', 'T', 'TH']);

/** Sibilants for -s allomorph selection */
const SIBILANTS = new Set(['CH', 'JH', 'S', 'SH', 'Z', 'ZH']);

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
  'ed',
  'er',
  'es',
  'est',
  'ification',
  'ify',
  'ifying',
  'ing',
  'or',
  's',
]);

export const SUFFIX_PHONEMES: { phonemes: null | string[]; suffix: string }[] = [
  // Long suffixes first (must come before shorter matches: -ification before -tion, -ifying before -ing)
  { phonemes: ['IH0', 'F', 'IH0', 'K', 'EY1', 'SH', 'AH0', 'N'], suffix: 'ification' },
  { phonemes: ['IH0', 'F', 'AY1', 'IH0', 'NG'], suffix: 'ifying' },
  { phonemes: ['IH0', 'F', 'AY1'], suffix: 'ify' },

  // Verb suffixes
  { phonemes: ['IH0', 'NG'], suffix: 'ing' },
  { phonemes: null, suffix: 'ed' }, // allomorph: T/D/IH0 D (selected dynamically)
  { phonemes: null, suffix: 'es' }, // allomorph: same as -s (S/Z/IH0 Z based on stem)
  { phonemes: null, suffix: 's' }, // allomorph: S/Z/IH0 Z (selected dynamically)

  // Noun suffixes
  { phonemes: ['SH', 'AH0', 'N'], suffix: 'tion' },
  { phonemes: ['ZH', 'AH0', 'N'], suffix: 'sion' },
  { phonemes: ['N', 'AH0', 'S'], suffix: 'ness' },
  { phonemes: ['M', 'AH0', 'N', 'T'], suffix: 'ment' },
  { phonemes: ['IH0', 'T', 'IY0'], suffix: 'ity' },
  { phonemes: ['ER0'], suffix: 'er' },
  { phonemes: ['ER0'], suffix: 'or' },
  { phonemes: ['IH0', 'S', 'T'], suffix: 'ist' },
  { phonemes: ['IH0', 'Z', 'AH0', 'M'], suffix: 'ism' },

  // Adjective suffixes
  { phonemes: ['L', 'IY0'], suffix: 'ly' },
  { phonemes: ['F', 'AH0', 'L'], suffix: 'ful' },
  { phonemes: ['L', 'AH0', 'S'], suffix: 'less' },
  { phonemes: ['AH0', 'B', 'AH0', 'L'], suffix: 'able' },
  { phonemes: ['AH0', 'B', 'AH0', 'L'], suffix: 'ible' },
  { phonemes: ['AH0', 'S'], suffix: 'ous' },
  { phonemes: ['IH0', 'V'], suffix: 'ive' },
  { phonemes: ['AH0', 'L'], suffix: 'al' },
  { phonemes: ['IH0', 'K'], suffix: 'ic' },

  // Comparative/superlative
  { phonemes: ['AH0', 'S', 'T'], suffix: 'est' },

  // Additional suffixes
  { phonemes: ['AH0', 'L', 'IY0'], suffix: 'ally' },
  { phonemes: ['AA1', 'L', 'AH0', 'JH', 'IY0'], suffix: 'ology' },
  { phonemes: ['AY1', 'Z'], suffix: 'ize' },
  { phonemes: ['AY1', 'Z'], suffix: 'ise' },
];

/**
 * Common prefixes and their phonetic representations.
 */
export const PREFIX_PHONEMES: { phonemes: string[]; prefix: string }[] = [
  { phonemes: ['AH0', 'N'], prefix: 'un' },
  { phonemes: ['R', 'IY0'], prefix: 're' },
  { phonemes: ['P', 'R', 'IY0'], prefix: 'pre' },
  { phonemes: ['D', 'IH0', 'S'], prefix: 'dis' },
  { phonemes: ['M', 'IH0', 'S'], prefix: 'mis' },
  { phonemes: ['OW1', 'V', 'ER0'], prefix: 'over' },
  { phonemes: ['AH1', 'N', 'D', 'ER0'], prefix: 'under' },
  { phonemes: ['AW1', 'T'], prefix: 'out' },
  { phonemes: ['AE1', 'N', 'T', 'IY0'], prefix: 'anti' },
  { phonemes: ['S', 'UW1', 'P', 'ER0'], prefix: 'super' },
];

export interface StemmingMatch {
  phonemes: string[];
  prefix?: string;
  stem: string;
  suffix?: string;
}

/**
 * Matches a word against stemming rules (suffix/prefix removal + allomorph selection).
 * Returns the matched components and combined phonemes, or null if no match.
 */
export function matchStemming(word: string): null | StemmingMatch {
  const lowerWord = word.toLowerCase();

  for (const { phonemes: suffixArpabet, suffix } of SUFFIX_PHONEMES) {
    if (lowerWord.endsWith(suffix) && lowerWord.length > suffix.length + 2) {
      const stem = lowerWord.slice(0, -suffix.length);
      for (const variant of getStemVariants(stem, suffix)) {
        const baseArpabet = lookupPronunciation(variant);
        if (baseArpabet) {
          const resolvedSuffix = resolveSuffixPhonemes(suffix, suffixArpabet, baseArpabet);
          return {
            phonemes: [...baseArpabet, ...resolvedSuffix],
            stem: variant,
            suffix,
          };
        }
      }
    }
  }

  for (const { phonemes: prefixArpabet, prefix } of PREFIX_PHONEMES) {
    if (lowerWord.startsWith(prefix) && lowerWord.length > prefix.length + 2) {
      const stem = lowerWord.slice(prefix.length);
      const baseArpabet = lookupPronunciation(stem);
      if (baseArpabet) {
        return {
          phonemes: [...prefixArpabet, ...baseArpabet],
          prefix,
          stem,
        };
      }
    }
  }

  return null;
}

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
): null | string {
  const match = matchStemming(word);
  if (match === null) {
    return null;
  }
  return arpabetToFormat(match.phonemes, format);
}

/**
 * Generates stem variants for a given stem and suffix.
 * Inflectional suffixes try aggressive variants (stem+e, stem-1char, doubled consonant, i→y).
 * All suffixes also try stem+y.
 */
function getStemVariants(stem: string, suffix: string): string[] {
  const variants: string[] = [stem];
  if (INFLECTIONAL_SUFFIXES.has(suffix)) {
    variants.push(
      stem + 'e', // hoping -> hope
      stem.length > 1 ? stem.slice(0, -1) : stem, // running -> run (double consonant)
      stem.length > 0 ? stem + stem.at(-1)! : stem // big -> bigg (for adding -er)
    );
  }
  if (stem.endsWith('i')) {
    variants.push(stem.slice(0, -1) + 'y'); // loveliest -> lovely
  }
  variants.push(stem + 'y'); // uglify -> ugly
  return variants;
}

/**
 * Resolves the suffix phonemes, selecting the correct allomorph for -ed, -es, -s.
 */
function resolveSuffixPhonemes(
  suffix: string,
  suffixArpabet: null | string[],
  baseArpabet: string[]
): string[] {
  if (suffixArpabet !== null) {
    return suffixArpabet;
  }
  const lastPhoneme = baseArpabet.at(-1)!;
  if (suffix === 'ed') {
    return selectEdPhonemes(lastPhoneme);
  }
  // suffix === 's' or 'es' — same allomorph logic
  return selectSPhonemes(lastPhoneme);
}
