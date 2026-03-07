/**
 * Rule or Exception? data.
 *
 * Each question shows a word and a spelling rule, and the player decides
 * whether the word follows the rule or is an exception.
 *
 * Tier 1 = obvious rule-followers, Tier 2 = less obvious, Tier 3 = tricky exceptions.
 */

import { mulberry32, shuffle } from '../games/prng';

export interface RuleOrExceptionQuestion {
  category: string;
  explanation: string;
  isException: boolean;
  rule: string;
  tier: 1 | 2 | 3;
  word: string;
}

const QUESTIONS: RuleOrExceptionQuestion[] = [
  // === Silent E rule ===
  // Follows rule
  {
    category: 'silent-e',
    explanation: '"Cake" follows the rule — the E makes A say "ay".',
    isException: false,
    rule: 'Silent E makes the vowel say its name',
    tier: 1,
    word: 'cake',
  },
  {
    category: 'silent-e',
    explanation: '"Hope" follows the rule — the E makes O say "oh".',
    isException: false,
    rule: 'Silent E makes the vowel say its name',
    tier: 1,
    word: 'hope',
  },
  {
    category: 'silent-e',
    explanation: '"Pine" follows the rule — the E makes I say "eye".',
    isException: false,
    rule: 'Silent E makes the vowel say its name',
    tier: 1,
    word: 'pine',
  },
  {
    category: 'silent-e',
    explanation: '"Cute" follows the rule — the E makes U say "yoo".',
    isException: false,
    rule: 'Silent E makes the vowel say its name',
    tier: 1,
    word: 'cute',
  },
  {
    category: 'silent-e',
    explanation: '"Name" follows the rule — A says "ay".',
    isException: false,
    rule: 'Silent E makes the vowel say its name',
    tier: 1,
    word: 'name',
  },
  // Exceptions
  {
    category: 'silent-e',
    explanation: '"Have" is an exception — A still says "a" as in "cat" despite the E.',
    isException: true,
    rule: 'Silent E makes the vowel say its name',
    tier: 2,
    word: 'have',
  },
  {
    category: 'silent-e',
    explanation: '"Love" is an exception — O says "u" as in "cup", not "oh".',
    isException: true,
    rule: 'Silent E makes the vowel say its name',
    tier: 2,
    word: 'love',
  },
  {
    category: 'silent-e',
    explanation: '"Give" is an exception — I says "i" as in "sit", not "eye".',
    isException: true,
    rule: 'Silent E makes the vowel say its name',
    tier: 2,
    word: 'give',
  },
  {
    category: 'silent-e',
    explanation: '"Gone" is an exception — O says "o" as in "hot", not "oh".',
    isException: true,
    rule: 'Silent E makes the vowel say its name',
    tier: 3,
    word: 'gone',
  },
  {
    category: 'silent-e',
    explanation: '"Come" is an exception — O says "u" as in "cup", not "oh".',
    isException: true,
    rule: 'Silent E makes the vowel say its name',
    tier: 2,
    word: 'come',
  },
  {
    category: 'silent-e',
    explanation: '"Done" is an exception — O says "u" as in "cup", not "oh".',
    isException: true,
    rule: 'Silent E makes the vowel say its name',
    tier: 2,
    word: 'done',
  },
  {
    category: 'silent-e',
    explanation: '"Some" is an exception — O says "u" as in "cup", not "oh".',
    isException: true,
    rule: 'Silent E makes the vowel say its name',
    tier: 3,
    word: 'some',
  },

  // === Soft C rule ===
  // Follows rule
  {
    category: 'soft-c',
    explanation: '"City" follows the rule — C before I sounds like "s".',
    isException: false,
    rule: 'C sounds like "s" before E, I, or Y',
    tier: 1,
    word: 'city',
  },
  {
    category: 'soft-c',
    explanation: '"Cent" follows the rule — C before E sounds like "s".',
    isException: false,
    rule: 'C sounds like "s" before E, I, or Y',
    tier: 1,
    word: 'cent',
  },
  {
    category: 'soft-c',
    explanation: '"Cycle" follows the rule — C before Y sounds like "s".',
    isException: false,
    rule: 'C sounds like "s" before E, I, or Y',
    tier: 1,
    word: 'cycle',
  },
  {
    category: 'soft-c',
    explanation: '"Cell" follows the rule — C before E sounds like "s".',
    isException: false,
    rule: 'C sounds like "s" before E, I, or Y',
    tier: 1,
    word: 'cell',
  },
  // Exceptions (very rare for C)
  {
    category: 'soft-c',
    explanation: '"Soccer" is an exception — the second C before E stays hard as "k".',
    isException: true,
    rule: 'C sounds like "s" before E, I, or Y',
    tier: 3,
    word: 'soccer',
  },
  {
    category: 'soft-c',
    explanation: '"Cello" is an exception from Italian — C before E sounds like "ch".',
    isException: true,
    rule: 'C sounds like "s" before E, I, or Y',
    tier: 3,
    word: 'cello',
  },

  // === Soft G rule ===
  // Follows rule
  {
    category: 'soft-g',
    explanation: '"Gem" follows the rule — G before E sounds like "j".',
    isException: false,
    rule: 'G sounds like "j" before E, I, or Y',
    tier: 1,
    word: 'gem',
  },
  {
    category: 'soft-g',
    explanation: '"Giant" follows the rule — G before I sounds like "j".',
    isException: false,
    rule: 'G sounds like "j" before E, I, or Y',
    tier: 1,
    word: 'giant',
  },
  {
    category: 'soft-g',
    explanation: '"Gym" follows the rule — G before Y sounds like "j".',
    isException: false,
    rule: 'G sounds like "j" before E, I, or Y',
    tier: 2,
    word: 'gym',
  },
  // Exceptions
  {
    category: 'soft-g',
    explanation: '"Get" is an exception — G stays hard before E. Common in Germanic words.',
    isException: true,
    rule: 'G sounds like "j" before E, I, or Y',
    tier: 2,
    word: 'get',
  },
  {
    category: 'soft-g',
    explanation: '"Girl" is an exception — G stays hard before I.',
    isException: true,
    rule: 'G sounds like "j" before E, I, or Y',
    tier: 2,
    word: 'girl',
  },
  {
    category: 'soft-g',
    explanation: '"Give" is an exception — G stays hard before I.',
    isException: true,
    rule: 'G sounds like "j" before E, I, or Y',
    tier: 2,
    word: 'give',
  },
  {
    category: 'soft-g',
    explanation: '"Gift" is an exception — G stays hard before I.',
    isException: true,
    rule: 'G sounds like "j" before E, I, or Y',
    tier: 3,
    word: 'gift',
  },
  {
    category: 'soft-g',
    explanation: '"Gear" is an exception — G stays hard before E.',
    isException: true,
    rule: 'G sounds like "j" before E, I, or Y',
    tier: 3,
    word: 'gear',
  },

  // === OO sounds ===
  // Long "oo" (follows the common pattern)
  {
    category: 'oo',
    explanation: '"Food" follows the common pattern — OO sounds like "oo" in "pool".',
    isException: false,
    rule: 'OO makes the long sound as in "pool"',
    tier: 1,
    word: 'food',
  },
  {
    category: 'oo',
    explanation: '"Moon" follows the common pattern.',
    isException: false,
    rule: 'OO makes the long sound as in "pool"',
    tier: 1,
    word: 'moon',
  },
  {
    category: 'oo',
    explanation: '"Cool" follows the common pattern.',
    isException: false,
    rule: 'OO makes the long sound as in "pool"',
    tier: 1,
    word: 'cool',
  },
  // Short "oo" exceptions
  {
    category: 'oo',
    explanation: '"Book" is an exception — OO makes the short sound as in "look".',
    isException: true,
    rule: 'OO makes the long sound as in "pool"',
    tier: 2,
    word: 'book',
  },
  {
    category: 'oo',
    explanation: '"Good" is an exception — OO makes the short sound.',
    isException: true,
    rule: 'OO makes the long sound as in "pool"',
    tier: 2,
    word: 'good',
  },
  {
    category: 'oo',
    explanation: '"Foot" is an exception — OO makes the short sound.',
    isException: true,
    rule: 'OO makes the long sound as in "pool"',
    tier: 2,
    word: 'foot',
  },
  // Really weird exceptions
  {
    category: 'oo',
    explanation: '"Flood" is a double exception — OO sounds like "u" in "cup"!',
    isException: true,
    rule: 'OO makes the long sound as in "pool"',
    tier: 3,
    word: 'flood',
  },
  {
    category: 'oo',
    explanation: '"Blood" is a double exception — OO sounds like "u" in "cup"!',
    isException: true,
    rule: 'OO makes the long sound as in "pool"',
    tier: 3,
    word: 'blood',
  },

  // === Double consonant shortens vowel ===
  {
    category: 'double-consonant',
    explanation: '"Hopping" follows the rule — double P keeps O short (compare "hoping").',
    isException: false,
    rule: 'Double consonant keeps the vowel short',
    tier: 1,
    word: 'hopping',
  },
  {
    category: 'double-consonant',
    explanation: '"Sitting" follows the rule — double T keeps I short (compare "siting").',
    isException: false,
    rule: 'Double consonant keeps the vowel short',
    tier: 1,
    word: 'sitting',
  },
  {
    category: 'double-consonant',
    explanation: '"Running" follows the rule — double N keeps U short.',
    isException: false,
    rule: 'Double consonant keeps the vowel short',
    tier: 1,
    word: 'running',
  },
  {
    category: 'double-consonant',
    explanation:
      '"Hoping" has a single P, so the vowel stays long — this is the contrast that proves the rule.',
    isException: true,
    rule: 'Double consonant keeps the vowel short',
    tier: 2,
    word: 'hoping',
  },
];

/**
 * Pick quiz questions: 3 tier-1 + 4 tier-2 + 3 tier-3, shuffled within tiers.
 */
export function pickQuiz(seed: number, count = 10): RuleOrExceptionQuestion[] {
  const rng = mulberry32(seed);

  const t1 = shuffle(
    QUESTIONS.filter((q) => q.tier === 1),
    rng
  );
  const t2 = shuffle(
    QUESTIONS.filter((q) => q.tier === 2),
    rng
  );
  const t3 = shuffle(
    QUESTIONS.filter((q) => q.tier === 3),
    rng
  );

  const t1Count = Math.min(3, Math.floor(count * 0.3));
  const t3Count = Math.min(3, Math.floor(count * 0.3));
  const t2Count = count - t1Count - t3Count;

  return [...t1.slice(0, t1Count), ...t2.slice(0, t2Count), ...t3.slice(0, t3Count)];
}
