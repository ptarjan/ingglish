/**
 * Stress prediction post-processor for G2P rules.
 *
 * The NRL rules assign stress-1 to ALL non-schwa vowels, meaning multi-syllable
 * words get every vowel stressed. This module predicts which syllable gets
 * primary stress using Rastle & Coltheart-style affix rules, then reduces
 * unstressed vowels to schwa where appropriate.
 */

import { stripStress } from '@ingglish/phonemes';

// Vowels that reduce to AH0 (schwa) when unstressed
const REDUCIBLE_VOWELS = new Set(['AE']);

// Vowels that take secondary stress (2) rather than unstressed (0) in
// non-primary positions of 2-syllable words. These are "full" vowels that
// CMU marks with secondary stress when they appear in a non-primary syllable.
const SECONDARY_STRESS_VOWELS = new Set(['AA', 'AE', 'AO', 'AW', 'AY', 'EH', 'EY', 'OY', 'UH']);

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
  stressFromEnd: number;
  suffix: string;
}

const PRE_STRESS_SUFFIXES: PreStressSuffix[] = [
  // Antepenultimate (3 from end) — check longer suffixes first
  { stressFromEnd: 3, suffix: 'ium' },
  { stressFromEnd: 3, suffix: 'ian' },
  { stressFromEnd: 3, suffix: 'ia' },
  { stressFromEnd: 3, suffix: 'io' },
  { stressFromEnd: 3, suffix: 'ical' },
  { stressFromEnd: 3, suffix: 'ious' },
  { stressFromEnd: 3, suffix: 'eous' },
  { stressFromEnd: 3, suffix: 'uous' },
  { stressFromEnd: 3, suffix: 'ular' },
  { stressFromEnd: 3, suffix: 'ophy' },
  { stressFromEnd: 3, suffix: 'osis' },
  { stressFromEnd: 3, suffix: 'itis' },
  { stressFromEnd: 3, suffix: 'athy' },
  { stressFromEnd: 3, suffix: 'ity' },
  { stressFromEnd: 3, suffix: 'ety' },
  { stressFromEnd: 3, suffix: 'ial' },
  { stressFromEnd: 3, suffix: 'ual' },
  { stressFromEnd: 3, suffix: 'ify' },
  { stressFromEnd: 3, suffix: 'ogy' },
  { stressFromEnd: 3, suffix: 'omy' },
  { stressFromEnd: 3, suffix: 'ony' },
  { stressFromEnd: 3, suffix: 'ory' },
  // Penultimate (2 from end) — Italian/Polish names and common patterns
  { stressFromEnd: 3, suffix: 'iano' },
  { stressFromEnd: 2, suffix: 'ella' },
  { stressFromEnd: 2, suffix: 'elli' },
  { stressFromEnd: 2, suffix: 'ello' },
  { stressFromEnd: 2, suffix: 'etta' },
  { stressFromEnd: 2, suffix: 'etti' },
  { stressFromEnd: 2, suffix: 'owski' },
  { stressFromEnd: 2, suffix: 'ewski' },
  { stressFromEnd: 2, suffix: 'tion' },
  { stressFromEnd: 2, suffix: 'sion' },
  { stressFromEnd: 2, suffix: 'cian' },
  { stressFromEnd: 3, suffix: 'ative' },
  { stressFromEnd: 3, suffix: 'ally' },
  { stressFromEnd: 2, suffix: 'ics' },
  { stressFromEnd: 2, suffix: 'ic' },
  { stressFromEnd: 3, suffix: 'ate' },
  { stressFromEnd: 2, suffix: 'ive' },
  { stressFromEnd: 3, suffix: 'ible' },
  { stressFromEnd: 2, suffix: 'ment' },
];

// Unstressed prefixes: stress falls on 2nd syllable
interface UnstressedPrefix {
  minLength: number; // minimum word length to avoid false matches
  prefix: string;
}

const UNSTRESSED_PREFIXES: UnstressedPrefix[] = [
  // Tier 1: reliable
  { minLength: 7, prefix: 'dis' },
  { minLength: 7, prefix: 'mis' },
  { minLength: 4, prefix: 'be' },
  { minLength: 4, prefix: 'de' },
  { minLength: 5, prefix: 're' },
  // Tier 2: mostly reliable — check longer prefixes first
  { minLength: 7, prefix: 'under' },
  { minLength: 7, prefix: 'inter' },
  { minLength: 6, prefix: 'over' },
  { minLength: 4, prefix: 'un' },
  { minLength: 4, prefix: 'ex' },
  { minLength: 7, prefix: 'sur' },
  { minLength: 5, prefix: 'sub' },
  { minLength: 6, prefix: 'per' },
  { minLength: 6, prefix: 'con' },
  { minLength: 6, prefix: 'pro' },
  // Tier 3: Latinate a- prefixes (abandon, absorb, accept, advance, etc.)
  { minLength: 6, prefix: 'ab' },
  { minLength: 6, prefix: 'ac' },
  { minLength: 6, prefix: 'ad' },
  { minLength: 6, prefix: 'af' },
  { minLength: 6, prefix: 'ap' },
  { minLength: 6, prefix: 'as' },
  { minLength: 6, prefix: 'at' },
];

/**
 * Apply stress prediction to a phoneme array produced by NRL rules.
 *
 * - Finds all vowel positions (phonemes ending in 0/1/2)
 * - Predicts which syllable gets primary stress
 * - Reduces unstressed reducible vowels to AH0 (schwa)
 * - Marks other unstressed vowels with 0
 */
export function applyStressPrediction(word: string, phonemes: string[]): string[] {
  // Find all vowel positions (phonemes with stress markers 0/1/2)
  const vowelPositions: number[] = [];
  for (const [i, phoneme] of phonemes.entries()) {
    const p = phoneme;
    const lastChar = p.codePointAt(p.length - 1)!;
    // '0'=48, '1'=49, '2'=50
    if (lastChar >= 48 && lastChar <= 50) {
      vowelPositions.push(i);
    }
  }

  // Monosyllabic words: no changes needed
  if (vowelPositions.length <= 1) {
    return phonemes;
  }

  const stressedSyllable = predictStressSyllable(word, vowelPositions.length);
  const result = [...phonemes];

  // If the predicted stress syllable is already AH0 (schwa from NRL rules),
  // reassign primary stress to the nearest non-AH0 vowel
  let actualStressed = stressedSyllable;
  if (
    vowelPositions[actualStressed] !== undefined &&
    result[vowelPositions[actualStressed]!] === 'AH0'
  ) {
    let found = false;
    // Search backward first (stressed syllables tend to be earlier in English)
    for (let j = actualStressed - 1; j >= 0; j--) {
      if (result[vowelPositions[j]!] !== 'AH0') {
        actualStressed = j;
        found = true;
        break;
      }
    }
    if (!found) {
      for (let j = actualStressed + 1; j < vowelPositions.length; j++) {
        if (result[vowelPositions[j]!] !== 'AH0') {
          actualStressed = j;
          break;
        }
      }
    }
  }

  for (const [i, vowelPosition] of vowelPositions.entries()) {
    const pos = vowelPosition;
    const phoneme = result[pos]!;
    const base = stripStress(phoneme);

    // Skip phonemes already reduced by NRL's explicit AX rules (AH0)
    if (phoneme === 'AH0') {
      continue;
    }

    if (i === actualStressed) {
      // Stressed syllable: keep base + 1
      result[pos] = base + '1';
    } else {
      // Unstressed: reduce if possible, otherwise mark stress level
      if (REDUCIBLE_VOWELS.has(base)) {
        result[pos] = 'AH0';
      } else if (SECONDARY_STRESS_VOWELS.has(base)) {
        // Full vowels in non-primary positions get secondary stress (2)
        // (e.g., "access" AE1 K S EH2 S, "celebrate" S EH1 L AH0 B R EY2 T)
        result[pos] = base + '2';
      } else {
        result[pos] = base + '0';
      }
    }
  }

  return result;
}

// vowelBase replaced by stripStress import (charCode-based, avoids regex)

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
  for (const { stressFromEnd, suffix } of PRE_STRESS_SUFFIXES) {
    if (lower.endsWith(suffix)) {
      return Math.max(0, syllableCount - stressFromEnd);
    }
  }

  // Check unstressed prefixes → stress 2nd syllable
  // Also try stripping -ing/-ings to expose prefix for gerunds (e.g., "misunderstanding")
  let base = lower;
  if (base.endsWith('ings')) {
    base = base.slice(0, -4);
  } else if (base.endsWith('ing')) {
    base = base.slice(0, -3);
  }
  for (const word of base === lower ? [lower] : [lower, base]) {
    for (const { minLength, prefix } of UNSTRESSED_PREFIXES) {
      if (word.startsWith(prefix) && word.length >= minLength) {
        return Math.min(1, syllableCount - 1);
      }
    }
  }

  // Default: stress first syllable
  return 0;
}
