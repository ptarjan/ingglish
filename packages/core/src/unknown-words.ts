import { phonemesToDisplay } from './phoneme-map';
import { lookupPronunciation } from './translator';
import { ipaToArpabet } from './ipa-to-arpabet';
import type { OutputFormat } from './types';

/**
 * Phonemes for individual letters (for spelling out acronyms).
 * Based on how native English speakers pronounce alphabet letters.
 */
const LETTER_PHONEMES: Record<string, string[]> = {
  a: ['EY1'],
  b: ['B', 'IY1'],
  c: ['S', 'IY1'],
  d: ['D', 'IY1'],
  e: ['IY1'],
  f: ['EH1', 'F'],
  g: ['JH', 'IY1'],
  h: ['EY1', 'CH'],
  i: ['AY1'],
  j: ['JH', 'EY1'],
  k: ['K', 'EY1'],
  l: ['EH1', 'L'],
  m: ['EH1', 'M'],
  n: ['EH1', 'N'],
  o: ['OW1'],
  p: ['P', 'IY1'],
  q: ['K', 'Y', 'UW1'],
  r: ['AA1', 'R'],
  s: ['EH1', 'S'],
  t: ['T', 'IY1'],
  u: ['Y', 'UW1'],
  v: ['V', 'IY1'],
  w: ['D', 'AH1', 'B', 'AH0', 'L', 'Y', 'UW0'],
  x: ['EH1', 'K', 'S'],
  y: ['W', 'AY1'],
  z: ['Z', 'IY1'],
};

/**
 * Initialisms that should be spelled out letter-by-letter.
 * These are pronounced as individual letters, NOT as words.
 *
 * Excludes acronyms pronounced as words like:
 * - RAM (ram), ROM (rom), GIF (gif/jif), JPEG (jay-peg)
 * - JSON (jason), SQL (sequel), NASA, NATO, SCUBA, LASER
 *
 * Lowercase for case-insensitive matching.
 */
const KNOWN_INITIALISMS = new Set([
  // Tech
  'url', // you-are-ell
  'html', // aych-tee-em-ell
  'css', // see-ess-ess
  'api', // ay-pee-eye
  'http', // aych-tee-tee-pee
  'https', // aych-tee-tee-pee-ess
  'xml', // ex-em-ell
  'php', // pee-aych-pee
  'usb', // you-ess-bee
  'cpu', // see-pee-you
  'gpu', // jee-pee-you
  'ssd', // ess-ess-dee
  'hdd', // aych-dee-dee
  'pdf', // pee-dee-eff
  'svg', // ess-vee-jee
  'ui', // you-eye
  'ux', // you-ex
  'ai', // ay-eye (as in "A.I.", not the word "ai")

  // Business/titles
  'ceo', // see-ee-oh
  'cfo', // see-eff-oh
  'cto', // see-tee-oh
  'vp', // vee-pee
  'hr', // aych-are
  'pr', // pee-are

  // General
  'id', // eye-dee
  'tv', // tee-vee
  'pc', // pee-see
  'dj', // dee-jay
  'mc', // em-see
  'atm', // ay-tee-em
  'gps', // jee-pee-ess
  'fbi', // eff-bee-eye
  'cia', // see-eye-ay
  'dna', // dee-en-ay
  'rna', // are-en-ay
  'faq', // eff-ay-kyoo
  'diy', // dee-eye-why
  'eta', // ee-tee-ay
  'mph', // em-pee-aych
  'rpm', // are-pee-em
  'ac', // ay-see
  'dc', // dee-see
]);

/**
 * Checks if a word should be spelled out as individual letters (initialism).
 * Only returns true for known initialisms - unknown uppercase words are NOT
 * automatically treated as initialisms since they might be acronyms pronounced
 * as words (like NASA, GIF, etc).
 */
function isInitialism(word: string): boolean {
  const lower = word.toLowerCase();
  return KNOWN_INITIALISMS.has(lower);
}

/**
 * Translates a word by spelling out each letter.
 * Used for acronyms like URL, HTML, API.
 */
export function translateAsAcronym(word: string, format: OutputFormat = 'ingglish'): string {
  const phonemes: string[] = [];
  for (const char of word.toLowerCase()) {
    const letterPhonemes = LETTER_PHONEMES[char];
    if (letterPhonemes !== undefined) {
      phonemes.push(...letterPhonemes);
    }
  }
  return phonemesToDisplay(phonemes, format);
}

// Lazy-loaded phonemize function
let phonemizeFn: ((text: string) => string) | null = null;
let phonemizeLoadAttempted = false;

/**
 * Attempts to load the phonemize module.
 * Returns null if not available (fails silently).
 */
async function loadPhonemize(): Promise<typeof phonemizeFn> {
  if (phonemizeLoadAttempted) {
    return phonemizeFn;
  }
  phonemizeLoadAttempted = true;

  try {
    // Dynamic import to allow tree-shaking if not used
    const mod = await import('phonemize');
    phonemizeFn = mod.phonemize;
    return phonemizeFn;
  } catch {
    // phonemize not available - fall back to rules
    return null;
  }
}

/**
 * Synchronously get the phonemize function if already loaded.
 */
function getPhonemize(): typeof phonemizeFn {
  return phonemizeFn;
}
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
 * @param format The output format
 * @returns The translated word, or null if stemming didn't help
 */
export function translateWithStemming(
  word: string,
  format: OutputFormat = 'ingglish'
): string | null {
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
          return phonemesToDisplay(fullPhonemes, format);
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
        return phonemesToDisplay(fullPhonemes, format);
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
 * @param format The output format
 * @returns The best-effort translation
 */
export function translateWithRules(word: string, format: OutputFormat = 'ingglish'): string {
  const phonemes = wordToPhonemes(word);
  return phonemesToDisplay(phonemes, format);
}

/**
 * Translates an unknown word using the phonemize library (neural G2P).
 * This provides better accuracy than rule-based G2P for unusual words.
 *
 * @param word The unknown word
 * @param format The output format
 * @returns The translation, or null if phonemize is not available
 */
export function translateWithPhonemize(
  word: string,
  format: OutputFormat = 'ingglish'
): string | null {
  const fn = getPhonemize();
  if (fn === null) {
    return null;
  }

  try {
    const ipa = fn(word);
    const arpabet = ipaToArpabet(ipa);
    if (arpabet.length === 0) {
      return null;
    }
    return phonemesToDisplay(arpabet, format);
  } catch {
    return null;
  }
}

/**
 * Attempts all strategies to translate an unknown word.
 *
 * Strategy order:
 * 1. Check if it's an acronym (spell out letters)
 * 2. Try stemming (find known base word + known suffix)
 * 3. Try phonemize (neural G2P) if available
 * 4. Try grapheme-to-phoneme rules
 *
 * @param word The unknown word
 * @param format The output format
 * @returns The translated word
 */
export function translateUnknown(word: string, format: OutputFormat = 'ingglish'): string {
  // Check for initialisms first (URL -> yooahrel)
  if (isInitialism(word)) {
    return translateAsAcronym(word, format);
  }

  // Try stemming
  const stemmedResult = translateWithStemming(word, format);
  if (stemmedResult !== null && stemmedResult.length > 0) {
    return stemmedResult;
  }

  // Try phonemize if loaded
  const phonemizeResult = translateWithPhonemize(word, format);
  if (phonemizeResult !== null && phonemizeResult.length > 0) {
    return phonemizeResult;
  }

  // Fall back to grapheme-to-phoneme rules
  return translateWithRules(word, format);
}

/**
 * Preloads the phonemize module for better unknown word handling.
 * Call this at startup if you want phonemize to be available synchronously.
 *
 * @returns Promise that resolves when phonemize is loaded (or failed to load)
 */
export async function preloadPhonemize(): Promise<boolean> {
  const mod = await loadPhonemize();
  return mod !== null;
}
