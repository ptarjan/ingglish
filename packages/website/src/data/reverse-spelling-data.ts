/**
 * Reverse Spelling data.
 *
 * Curated English words grouped by tier. The Ingglish translation
 * is computed at runtime via translateSync so it stays in sync
 * with the current spelling rules.
 */

import { translateSync } from 'ingglish';
import { mulberry32, shuffle } from '../games/prng';

export interface ReverseWord {
  english: string;
  ingglish: string;
  tier: 1 | 2 | 3;
}

const WORD_POOL: { tier: 1 | 2 | 3; word: string; }[] = [
  // === Tier 1: Easy — common words with visible changes ===
  { tier: 1, word: 'night' },
  { tier: 1, word: 'light' },
  { tier: 1, word: 'phone' },
  { tier: 1, word: 'write' },
  { tier: 1, word: 'know' },
  { tier: 1, word: 'would' },
  { tier: 1, word: 'through' },
  { tier: 1, word: 'thought' },
  { tier: 1, word: 'laugh' },
  { tier: 1, word: 'enough' },
  { tier: 1, word: 'people' },
  { tier: 1, word: 'should' },

  // === Tier 2: Medium — silent letters, unusual vowels ===
  { tier: 2, word: 'knight' },
  { tier: 2, word: 'science' },
  { tier: 2, word: 'ocean' },
  { tier: 2, word: 'measure' },
  { tier: 2, word: 'beautiful' },
  { tier: 2, word: 'wednesday' },
  { tier: 2, word: 'daughter' },
  { tier: 2, word: 'foreign' },
  { tier: 2, word: 'tongue' },
  { tier: 2, word: 'building' },
  { tier: 2, word: 'receipt' },
  { tier: 2, word: 'colonel' },

  // === Tier 3: Hard — complex, multi-syllable ===
  { tier: 3, word: 'extraordinary' },
  { tier: 3, word: 'psychology' },
  { tier: 3, word: 'architecture' },
  { tier: 3, word: 'photographer' },
  { tier: 3, word: 'civilization' },
  { tier: 3, word: 'entrepreneur' },
  { tier: 3, word: 'symphony' },
  { tier: 3, word: 'catastrophe' },
  { tier: 3, word: 'phenomenon' },
  { tier: 3, word: 'miscellaneous' },
  { tier: 3, word: 'onomatopoeia' },
  { tier: 3, word: 'bureaucracy' },
];

/**
 * Pick 10 reverse spelling words: 3 easy + 4 medium + 3 hard.
 * Translates each to Ingglish at call time (dictionary must be loaded).
 */
export function pickReverseSpelling(seed: number, count = 10): ReverseWord[] {
  const rng = mulberry32(seed);

  const easy = shuffle(
    WORD_POOL.filter((w) => w.tier === 1),
    rng
  );
  const medium = shuffle(
    WORD_POOL.filter((w) => w.tier === 2),
    rng
  );
  const hard = shuffle(
    WORD_POOL.filter((w) => w.tier === 3),
    rng
  );

  const easyCount = Math.min(3, Math.floor(count * 0.3));
  const hardCount = Math.min(3, Math.floor(count * 0.3));
  const mediumCount = count - easyCount - hardCount;

  const selected = [
    ...easy.slice(0, easyCount),
    ...medium.slice(0, mediumCount),
    ...hard.slice(0, hardCount),
  ];

  return selected.map((w) => ({
    english: w.word,
    ingglish: translateSync(w.word, { format: 'ingglish' }),
    tier: w.tier,
  }));
}
