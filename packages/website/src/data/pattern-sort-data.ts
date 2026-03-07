/**
 * Pattern Sort data.
 *
 * Each round has a pattern (e.g. "EA"), two pronunciation buckets,
 * and words to sort into them.
 */

import { mulberry32, shuffle } from '../games/prng';

export interface PatternSortRound {
  bucketA: string;
  bucketB: string;
  pattern: string;
  words: { bucket: 'a' | 'b'; word: string }[];
}

const ROUNDS: PatternSortRound[] = [
  {
    bucketA: '"ee" as in feet',
    bucketB: '"e" as in bed',
    pattern: 'EA',
    words: [
      { bucket: 'a', word: 'beat' },
      { bucket: 'b', word: 'bread' },
      { bucket: 'a', word: 'clean' },
      { bucket: 'b', word: 'head' },
      { bucket: 'a', word: 'dream' },
      { bucket: 'b', word: 'dead' },
      { bucket: 'a', word: 'team' },
      { bucket: 'b', word: 'sweat' },
      { bucket: 'a', word: 'reach' },
      { bucket: 'b', word: 'spread' },
      { bucket: 'a', word: 'steam' },
      { bucket: 'b', word: 'thread' },
    ],
  },
  {
    bucketA: '"ow" as in ouch',
    bucketB: '"oh" as in go',
    pattern: 'OW',
    words: [
      { bucket: 'a', word: 'cow' },
      { bucket: 'b', word: 'show' },
      { bucket: 'a', word: 'down' },
      { bucket: 'b', word: 'know' },
      { bucket: 'a', word: 'how' },
      { bucket: 'b', word: 'grow' },
      { bucket: 'a', word: 'town' },
      { bucket: 'b', word: 'slow' },
      { bucket: 'a', word: 'brown' },
      { bucket: 'b', word: 'flow' },
      { bucket: 'a', word: 'owl' },
      { bucket: 'b', word: 'own' },
    ],
  },
  {
    bucketA: '"oo" as in pool',
    bucketB: '"oo" as in look',
    pattern: 'OO',
    words: [
      { bucket: 'a', word: 'food' },
      { bucket: 'b', word: 'book' },
      { bucket: 'a', word: 'moon' },
      { bucket: 'b', word: 'good' },
      { bucket: 'a', word: 'cool' },
      { bucket: 'b', word: 'cook' },
      { bucket: 'a', word: 'tool' },
      { bucket: 'b', word: 'foot' },
      { bucket: 'a', word: 'school' },
      { bucket: 'b', word: 'wood' },
      { bucket: 'a', word: 'room' },
      { bucket: 'b', word: 'hook' },
    ],
  },
  {
    bucketA: '"ow" as in ouch',
    bucketB: '"uh" as in cup',
    pattern: 'OU',
    words: [
      { bucket: 'a', word: 'house' },
      { bucket: 'b', word: 'touch' },
      { bucket: 'a', word: 'loud' },
      { bucket: 'b', word: 'young' },
      { bucket: 'a', word: 'count' },
      { bucket: 'b', word: 'double' },
      { bucket: 'a', word: 'found' },
      { bucket: 'b', word: 'trouble' },
      { bucket: 'a', word: 'round' },
      { bucket: 'b', word: 'cousin' },
      { bucket: 'a', word: 'shout' },
      { bucket: 'b', word: 'country' },
    ],
  },
];

/**
 * Pick a round and shuffle its words.
 */
export function pickRound(seed: number): PatternSortRound {
  const rng = mulberry32(seed);
  const round = ROUNDS[Math.floor(rng() * ROUNDS.length)]!;
  return {
    ...round,
    words: shuffle([...round.words], rng),
  };
}

/**
 * Pick a set of rounds (no repeats).
 */
export function pickRounds(seed: number, count = 3): PatternSortRound[] {
  const rng = mulberry32(seed);
  const shuffled = shuffle([...ROUNDS], rng);
  return shuffled.slice(0, Math.min(count, shuffled.length)).map((round) => ({
    ...round,
    words: shuffle([...round.words], rng).slice(0, 8),
  }));
}
