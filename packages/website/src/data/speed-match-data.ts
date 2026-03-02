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

const WORD_POOL = [
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
 * Pick 6 match pairs for a single round.
 * Translates at call time (dictionary must be loaded).
 */
export function pickMatchPairs(seed: number, roundIndex: number): MatchPair[] {
  // Derive a per-round seed so each round has different words
  const rng = mulberry32(seed + roundIndex * 7919);
  const pool = shuffle([...WORD_POOL], rng);

  const pairs: MatchPair[] = [];
  for (const word of pool) {
    if (pairs.length >= 6) {
      break;
    }
    const ingglish = translateSync(word, { format: 'ingglish' });
    // Only include words that actually change
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
