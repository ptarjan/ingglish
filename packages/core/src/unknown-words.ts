import { phonemesToInglish } from './phoneme-map';
import { lookupPronunciation } from './translator';

/**
 * Common English suffixes and their phonetic representations.
 * Used when trying to stem unknown words.
 */
const SUFFIX_PHONEMES: { suffix: string; phonemes: string[] }[] = [
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
const PREFIX_PHONEMES: { prefix: string; phonemes: string[] }[] = [
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
 * Basic letter-to-sound rules for grapheme-to-phoneme conversion.
 * Used as a fallback when the word isn't in the dictionary.
 */
const GRAPHEME_TO_PHONEME: { pattern: RegExp; phonemes: string[] }[] = [
  // Digraphs first (longer patterns)
  { pattern: /^sh/i, phonemes: ['SH'] },
  { pattern: /^ch/i, phonemes: ['CH'] },
  { pattern: /^th/i, phonemes: ['TH'] }, // Simplified: always voiceless
  { pattern: /^wh/i, phonemes: ['W'] },
  { pattern: /^ph/i, phonemes: ['F'] },
  { pattern: /^gh/i, phonemes: ['G'] },
  { pattern: /^ng/i, phonemes: ['NG'] },
  { pattern: /^ck/i, phonemes: ['K'] },
  { pattern: /^qu/i, phonemes: ['K', 'W'] },

  // Vowel digraphs
  { pattern: /^ee/i, phonemes: ['IY1'] },
  { pattern: /^ea/i, phonemes: ['IY1'] },
  { pattern: /^oo/i, phonemes: ['UW1'] },
  { pattern: /^ou/i, phonemes: ['AW1'] },
  { pattern: /^ow/i, phonemes: ['OW1'] },
  { pattern: /^oi/i, phonemes: ['OY1'] },
  { pattern: /^oy/i, phonemes: ['OY1'] },
  { pattern: /^ai/i, phonemes: ['EY1'] },
  { pattern: /^ay/i, phonemes: ['EY1'] },
  { pattern: /^au/i, phonemes: ['AO1'] },
  { pattern: /^aw/i, phonemes: ['AO1'] },
  { pattern: /^ie/i, phonemes: ['IY1'] },
  { pattern: /^ey/i, phonemes: ['IY1'] },

  // Single consonants
  { pattern: /^b/i, phonemes: ['B'] },
  { pattern: /^c(?=[eiy])/i, phonemes: ['S'] }, // soft c
  { pattern: /^c/i, phonemes: ['K'] }, // hard c
  { pattern: /^d/i, phonemes: ['D'] },
  { pattern: /^f/i, phonemes: ['F'] },
  // Soft g before e/y, but NOT before i (too many exceptions: give, gift, girl, git)
  { pattern: /^g(?=[ey])/i, phonemes: ['JH'] }, // soft g (gem, gym)
  { pattern: /^g/i, phonemes: ['G'] }, // hard g (go, git, give, girl)
  { pattern: /^h/i, phonemes: ['HH'] },
  { pattern: /^j/i, phonemes: ['JH'] },
  { pattern: /^k/i, phonemes: ['K'] },
  { pattern: /^l/i, phonemes: ['L'] },
  { pattern: /^m/i, phonemes: ['M'] },
  { pattern: /^n/i, phonemes: ['N'] },
  { pattern: /^p/i, phonemes: ['P'] },
  { pattern: /^r/i, phonemes: ['R'] },
  { pattern: /^s/i, phonemes: ['S'] },
  { pattern: /^t/i, phonemes: ['T'] },
  { pattern: /^v/i, phonemes: ['V'] },
  { pattern: /^w/i, phonemes: ['W'] },
  { pattern: /^x/i, phonemes: ['K', 'S'] },
  { pattern: /^y(?=[aeiou])/i, phonemes: ['Y'] }, // consonant y
  { pattern: /^y/i, phonemes: ['IY1'] }, // vowel y
  { pattern: /^z/i, phonemes: ['Z'] },

  // Single vowels (default, short sounds)
  { pattern: /^a/i, phonemes: ['AE1'] },
  { pattern: /^e/i, phonemes: ['EH1'] },
  { pattern: /^i/i, phonemes: ['IH1'] },
  { pattern: /^o/i, phonemes: ['AA1'] },
  { pattern: /^u/i, phonemes: ['AH1'] },
];

/**
 * Attempts to translate an unknown word using stemming.
 * Tries to find a known base word and apply suffix rules.
 *
 * @param word The unknown word
 * @returns The translated word, or null if stemming didn't help
 */
export function translateWithStemming(word: string): string | null {
  const lowerWord = word.toLowerCase();

  // Try removing suffixes and finding base word
  for (const { suffix, phonemes: suffixPhonemes } of SUFFIX_PHONEMES) {
    if (lowerWord.endsWith(suffix) && lowerWord.length > suffix.length + 2) {
      const stem = lowerWord.slice(0, -suffix.length);

      // Try various stem modifications
      const stemVariants = [
        stem,
        stem + 'e', // hoping -> hope
        stem.length > 1 ? stem.slice(0, -1) : stem, // running -> run (double consonant)
        stem.length > 0 ? stem + stem[stem.length - 1] : stem, // big -> bigg (for adding -er)
      ].filter((v) => v.length > 0);

      for (const variant of stemVariants) {
        const basePhonemes = lookupPronunciation(variant);
        if (basePhonemes) {
          const fullPhonemes = [...basePhonemes, ...suffixPhonemes];
          return phonemesToInglish(fullPhonemes);
        }
      }
    }
  }

  // Try removing prefixes
  for (const { prefix, phonemes: prefixPhonemes } of PREFIX_PHONEMES) {
    if (lowerWord.startsWith(prefix) && lowerWord.length > prefix.length + 2) {
      const stem = lowerWord.slice(prefix.length);
      const basePhonemes = lookupPronunciation(stem);
      if (basePhonemes) {
        const fullPhonemes = [...prefixPhonemes, ...basePhonemes];
        return phonemesToInglish(fullPhonemes);
      }
    }
  }

  return null;
}

/**
 * Converts a word to phonemes using grapheme-to-phoneme rules.
 * This is a simple rule-based approach for unknown words.
 *
 * @param word The word to convert
 * @returns Array of phonemes
 */
export function wordToPhonemes(word: string): string[] {
  const phonemes: string[] = [];
  let remaining = word.toLowerCase();

  while (remaining.length > 0) {
    let matched = false;

    for (const { pattern, phonemes: rulePhonemes } of GRAPHEME_TO_PHONEME) {
      const match = remaining.match(pattern);
      if (match) {
        phonemes.push(...rulePhonemes);
        remaining = remaining.slice(match[0].length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Skip unknown characters
      remaining = remaining.slice(1);
    }
  }

  return phonemes;
}

/**
 * Translates an unknown word using grapheme-to-phoneme rules.
 * This is a fallback when the word isn't in the dictionary.
 *
 * @param word The unknown word
 * @returns The best-effort Ingglish spelling
 */
export function translateWithRules(word: string): string {
  const phonemes = wordToPhonemes(word);
  return phonemesToInglish(phonemes);
}

/**
 * Attempts all strategies to translate an unknown word.
 *
 * Strategy order:
 * 1. Try stemming (find known base word + known suffix)
 * 2. Try grapheme-to-phoneme rules
 *
 * @param word The unknown word
 * @returns The translated word
 */
export function translateUnknown(word: string): string {
  // Try stemming first
  const stemmedResult = translateWithStemming(word);
  if (stemmedResult !== null && stemmedResult.length > 0) {
    return stemmedResult;
  }

  // Fall back to grapheme-to-phoneme rules
  return translateWithRules(word);
}
