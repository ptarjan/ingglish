/**
 * Stress prediction post-processor for G2P rules.
 *
 * The NRL rules assign stress-1 to ALL non-schwa vowels, meaning multi-syllable
 * words get every vowel stressed. This module predicts which syllable gets
 * primary stress using Rastle & Coltheart-style affix rules, then reduces
 * unstressed vowels to schwa where appropriate.
 */

// Vowels that reduce to AH0 (schwa) when unstressed
const REDUCIBLE_VOWELS = new Set(['AE', 'EH', 'AA']);

// Stress-attracting suffixes: stress falls on the final syllable
const STRESS_ATTRACTING_SUFFIXES = [
  'eer',
  'ese',
  'ette',
  'esque',
  'ique',
  'oon',
  'ade',
  'aire',
  'esce',
  'ee',
];

// Pre-stress suffixes: stress falls N syllables from the end
interface PreStressSuffix {
  suffix: string;
  stressFromEnd: number;
}

const PRE_STRESS_SUFFIXES: PreStressSuffix[] = [
  // Antepenultimate (3 from end) — check longer suffixes first
  { suffix: 'ical', stressFromEnd: 3 },
  { suffix: 'ious', stressFromEnd: 3 },
  { suffix: 'eous', stressFromEnd: 3 },
  { suffix: 'uous', stressFromEnd: 3 },
  { suffix: 'ular', stressFromEnd: 3 },
  { suffix: 'ophy', stressFromEnd: 3 },
  { suffix: 'osis', stressFromEnd: 3 },
  { suffix: 'itis', stressFromEnd: 3 },
  { suffix: 'athy', stressFromEnd: 3 },
  { suffix: 'ity', stressFromEnd: 3 },
  { suffix: 'ety', stressFromEnd: 3 },
  { suffix: 'ial', stressFromEnd: 3 },
  { suffix: 'ual', stressFromEnd: 3 },
  { suffix: 'ify', stressFromEnd: 3 },
  { suffix: 'ogy', stressFromEnd: 3 },
  { suffix: 'omy', stressFromEnd: 3 },
  { suffix: 'ony', stressFromEnd: 3 },
  // Penultimate (2 from end)
  { suffix: 'tion', stressFromEnd: 2 },
  { suffix: 'sion', stressFromEnd: 2 },
  { suffix: 'cian', stressFromEnd: 2 },
  { suffix: 'ics', stressFromEnd: 2 },
  { suffix: 'ic', stressFromEnd: 2 },
];

// Unstressed prefixes: stress falls on 2nd syllable
interface UnstressedPrefix {
  prefix: string;
  minLength: number; // minimum word length to avoid false matches
}

const UNSTRESSED_PREFIXES: UnstressedPrefix[] = [
  // Tier 1: reliable
  { prefix: 'dis', minLength: 5 },
  { prefix: 'mis', minLength: 5 },
  { prefix: 'be', minLength: 4 },
  { prefix: 'de', minLength: 4 },
  { prefix: 're', minLength: 4 },
  // Tier 2: mostly reliable — check longer prefixes first
  { prefix: 'under', minLength: 7 },
  { prefix: 'inter', minLength: 7 },
  { prefix: 'over', minLength: 6 },
  { prefix: 'un', minLength: 4 },
  { prefix: 'com', minLength: 5 },
  { prefix: 'con', minLength: 5 },
  { prefix: 'ex', minLength: 4 },
  { prefix: 'pre', minLength: 5 },
  { prefix: 'pro', minLength: 5 },
  { prefix: 'per', minLength: 5 },
  { prefix: 'sur', minLength: 5 },
  { prefix: 'sub', minLength: 5 },
];

/**
 * Predict which syllable (0-indexed) gets primary stress.
 */
function predictStressSyllable(word: string, syllableCount: number): number {
  const lower = word.toLowerCase();

  // Check stress-attracting suffixes → stress last syllable
  for (const suffix of STRESS_ATTRACTING_SUFFIXES) {
    if (lower.endsWith(suffix)) {
      return syllableCount - 1;
    }
  }

  // Check pre-stress suffixes → stress N syllables from end
  for (const { suffix, stressFromEnd } of PRE_STRESS_SUFFIXES) {
    if (lower.endsWith(suffix)) {
      return Math.max(0, syllableCount - stressFromEnd);
    }
  }

  // Check unstressed prefixes → stress 2nd syllable
  for (const { prefix, minLength } of UNSTRESSED_PREFIXES) {
    if (lower.startsWith(prefix) && lower.length >= minLength) {
      return Math.min(1, syllableCount - 1);
    }
  }

  // Default: stress first syllable
  return 0;
}

/** Extract the base vowel from a stressed phoneme (e.g., "AE1" → "AE") */
function vowelBase(phoneme: string): string {
  return phoneme.replace(/[012]$/, '');
}

/**
 * Apply stress prediction to a phoneme array produced by NRL rules.
 *
 * - Finds all vowel positions (phonemes ending in 0/1/2)
 * - Predicts which syllable gets primary stress
 * - Reduces unstressed reducible vowels to AH0 (schwa)
 * - Marks other unstressed vowels with 0
 */
export function applyStressPrediction(word: string, phonemes: string[]): string[] {
  // Find all vowel positions
  const vowelPositions: number[] = [];
  for (let i = 0; i < phonemes.length; i++) {
    if (/[012]$/.test(phonemes[i])) {
      vowelPositions.push(i);
    }
  }

  // Monosyllabic words: no changes needed
  if (vowelPositions.length <= 1) {
    return phonemes;
  }

  const stressedSyllable = predictStressSyllable(word, vowelPositions.length);
  const result = [...phonemes];

  for (let i = 0; i < vowelPositions.length; i++) {
    const pos = vowelPositions[i];
    const phoneme = result[pos];
    const base = vowelBase(phoneme);

    // Skip phonemes already reduced by NRL's explicit AX rules (AH0)
    if (phoneme === 'AH0') {
      continue;
    }

    if (i === stressedSyllable) {
      // Stressed syllable: keep base + 1
      result[pos] = base + '1';
    } else {
      // Unstressed: reduce if possible, otherwise mark as unstressed
      if (REDUCIBLE_VOWELS.has(base)) {
        result[pos] = 'AH0';
      } else {
        result[pos] = base + '0';
      }
    }
  }

  return result;
}
