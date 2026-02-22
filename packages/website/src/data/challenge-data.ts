/**
 * Reading Challenge sentence data.
 *
 * Sentences are stored in English and translated to Ingglish at runtime.
 * Tiers: 1 = easy (short common words), 2 = medium (silent letters, vowel changes),
 * 3 = hard (literary/complex passages).
 */

import type { TranslatedToken } from 'ingglish';
import { translateSyncWithMapping } from 'ingglish';

export interface ChallengeSentence extends ChallengeSentenceSource {
  tokens: TranslatedToken[];
}

export interface ChallengeSentenceSource {
  english: string;
  tier: 1 | 2 | 3;
}

const SENTENCES: ChallengeSentenceSource[] = [
  // === Tier 1: Easy — short common words ===
  { english: 'The cat sat on the mat.', tier: 1 },
  { english: 'I like to run and jump.', tier: 1 },
  { english: 'She has a big red dog.', tier: 1 },
  { english: 'We went to the park today.', tier: 1 },
  { english: 'He can swim in the lake.', tier: 1 },
  { english: 'My mom made a cake for me.', tier: 1 },
  { english: 'The sun is hot and bright.', tier: 1 },
  { english: 'I see a blue bird in the tree.', tier: 1 },
  { english: 'They play games after school.', tier: 1 },
  { english: 'Put the cup on the desk.', tier: 1 },

  // === Tier 2: Medium — silent letters, vowel shifts, common irregularities ===
  { english: 'The knight knew the answer right away.', tier: 2 },
  { english: 'She would write a letter to her friend.', tier: 2 },
  { english: 'The ocean waves crashed against the shore.', tier: 2 },
  { english: 'They thought about moving to another country.', tier: 2 },
  { english: 'The children laughed at the funny story.', tier: 2 },
  { english: 'Please measure the weight of this package.', tier: 2 },
  { english: 'The beautiful garden was full of flowers.', tier: 2 },
  { english: 'Science teaches us about nature and the world.', tier: 2 },
  { english: 'Wednesday is my favorite day of the week.', tier: 2 },
  { english: 'The guests brought enough food for everyone.', tier: 2 },

  // === Tier 3: Hard — literary passages, complex vocabulary ===
  {
    english: 'The extraordinary journey through the ancient wilderness was unforgettable.',
    tier: 3,
  },
  { english: 'Knowledge and imagination are more valuable than treasure.', tier: 3 },
  { english: 'The photographer captured the magnificent autumn landscape.', tier: 3 },
  { english: 'Throughout history, communication has transformed civilization.', tier: 3 },
  { english: 'The mysterious disappearance puzzled the authorities completely.', tier: 3 },
  { english: 'Architecture reflects the philosophy of its generation.', tier: 3 },
  { english: 'The accomplished musician performed a breathtaking symphony.', tier: 3 },
  { english: 'Psychological research reveals fascinating patterns of behavior.', tier: 3 },
  { english: 'The entrepreneur established a successful business through perseverance.', tier: 3 },
  { english: 'Extraordinary circumstances require extraordinary measures of courage.', tier: 3 },
];

/**
 * Pick challenge sentences: 3 easy + 4 medium + 3 hard, shuffled within tiers.
 * Translates each sentence to Ingglish at call time (dictionary must be loaded).
 */
export function pickChallenge(seed: number, count = 10): ChallengeSentence[] {
  const rng = mulberry32(seed);

  const easy = shuffle(
    SENTENCES.filter((s) => s.tier === 1),
    rng
  );
  const medium = shuffle(
    SENTENCES.filter((s) => s.tier === 2),
    rng
  );
  const hard = shuffle(
    SENTENCES.filter((s) => s.tier === 3),
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

  return selected.map((source) => ({
    ...source,
    tokens: translateSyncWithMapping(source.english, 'ingglish'),
  }));
}

/**
 * Simple seeded PRNG (mulberry32).
 */
function mulberry32(seed: number): () => number {
  // eslint-disable-next-line unicorn/prefer-math-trunc -- intentional int32 coercion for PRNG
  let s = seed | 0;
  return () => {
    // eslint-disable-next-line unicorn/prefer-math-trunc -- intentional int32 coercion for PRNG
    s = (s + 0x6D_2B_79_F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/**
 * Shuffle an array in-place using Fisher-Yates with the given RNG.
 */
function shuffle<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}
