/**
 * Speed Match data.
 *
 * Pool of English words that visibly change when translated to Ingglish.
 * Each round picks 6 pairs, shuffled independently per column.
 */

import { translateSync } from 'ingglish';
import { mulberry32, shuffle } from '../games/prng';

export interface MatchPair {
  english: string;
  ingglish: string;
}

const EASY_POOL = [
  'knight',
  'know',
  'write',
  'phone',
  'laugh',
  'enough',
  'through',
  'thought',
  'would',
  'should',
  'people',
  'light',
  'ocean',
  'science',
  'measure',
  'beautiful',
  'daughter',
  'foreign',
  'tongue',
  'building',
  'receipt',
  'island',
  'listen',
  'castle',
  'Wednesday',
  'answer',
  'climb',
  'doubt',
  'subtle',
  'rhythm',
  'muscle',
  'scissors',
  'gnome',
  'kneel',
  'wreck',
  'pneumonia',
  'psychology',
  'colonel',
  'choir',
  'aisle',
  'debt',
  'chaos',
  'stomach',
  'ache',
  'echo',
  'anchor',
  'technique',
  'unique',
];

/**
 * Hard-mode clusters: words that differ by ~1 vowel.
 * All words in each cluster look confusingly similar in English
 * but have distinct Ingglish translations, forcing careful decoding.
 */
const HARD_CLUSTERS = [
  ['cat', 'cut', 'cot', 'coat', 'cute', 'cite', 'kite'],
  ['lake', 'like', 'look', 'luck', 'lock', 'lick', 'lack', 'lace', 'lice'],
  ['stake', 'stock', 'stick', 'stuck', 'stoke', 'stalk'],
  ['race', 'rice', 'rose', 'ruse', 'raise', 'rise'],
  ['hall', 'hill', 'hull', 'hail', 'hole', 'howl'],
  ['mate', 'mite', 'moat', 'mute', 'mitt', 'mole'],
  ['pale', 'pile', 'pole', 'pull', 'pill', 'pall'],
  ['fill', 'fall', 'fail', 'full', 'fell', 'foal'],
];

/**
 * Pick 6 match pairs for a single round.
 * Rounds 0-1 use the easy pool (distinct words).
 * Round 2+ uses hard clusters (near-miss words that differ by a vowel).
 * Translates at call time (dictionary must be loaded).
 */
export function pickMatchPairs(seed: number, roundIndex: number): MatchPair[] {
  const rng = mulberry32(seed + roundIndex * 7919);

  if (roundIndex >= 1) {
    return pickHardPairs(rng);
  }

  const pool = shuffle([...EASY_POOL], rng);
  const pairs: MatchPair[] = [];
  for (const word of pool) {
    if (pairs.length >= 6) {
      break;
    }
    const ingglish = translateSync(word, { format: 'ingglish' });
    if (ingglish.toLowerCase() !== word.toLowerCase()) {
      pairs.push({ english: word, ingglish });
    }
  }
  return pairs;
}

/** Shuffle the left and right columns independently for display. */
export function shuffleColumns(
  pairs: MatchPair[],
  seed: number
): { left: { id: number; text: string }[]; right: { id: number; text: string }[] } {
  const leftRng = mulberry32(seed + 1);
  const rightRng = mulberry32(seed + 2);

  const left = shuffle(
    pairs.map((p, i) => ({ id: i, text: p.ingglish })),
    leftRng
  );
  const right = shuffle(
    pairs.map((p, i) => ({ id: i, text: p.english })),
    rightRng
  );

  return { left, right };
}

/** Pick 6 pairs from a hard cluster (words that look confusingly similar). */
function pickHardPairs(rng: () => number): MatchPair[] {
  const cluster = shuffle([...HARD_CLUSTERS], rng)[0]!;
  const words = shuffle([...cluster], rng);

  const pairs: MatchPair[] = [];
  const seenIngglish = new Set<string>();
  for (const word of words) {
    if (pairs.length >= 6) {
      break;
    }
    const ingglish = translateSync(word, { format: 'ingglish' });
    const ingLower = ingglish.toLowerCase();
    // Skip homophones (same Ingglish) and words that don't change
    if (seenIngglish.has(ingLower) || ingLower === word.toLowerCase()) {
      continue;
    }
    seenIngglish.add(ingLower);
    pairs.push({ english: word, ingglish });
  }
  return pairs;
}
