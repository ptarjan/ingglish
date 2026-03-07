/**
 * Spell That Sound data.
 *
 * Each question shows a sound description, a word with a blank, and
 * multiple spelling options to fill the blank.
 *
 * Tier 1 = common/obvious, Tier 2 = less obvious, Tier 3 = tricky.
 */

import { mulberry32, shuffle } from '../games/prng';

export interface SpellThatSoundQuestion {
  category: string;
  choices: string[];
  correctSpelling: string;
  explanation: string;
  soundDescription: string;
  tier: 1 | 2 | 3;
  wordAfter: string;
  wordBefore: string;
}

const QUESTIONS: SpellThatSoundQuestion[] = [
  // === K sound spellings ===
  {
    category: 'k-sound',
    choices: ['c', 'k', 'ck', 'ch'],
    correctSpelling: 'c',
    explanation: 'Before A, O, U, the "k" sound is usually spelled C: "cake".',
    soundDescription: '"k" sound',
    tier: 1,
    wordAfter: 'ake',
    wordBefore: '',
  },
  {
    category: 'k-sound',
    choices: ['c', 'k', 'ck', 'ch'],
    correctSpelling: 'k',
    explanation: 'Before I and E, the "k" sound is spelled K (C would be soft): "kite".',
    soundDescription: '"k" sound',
    tier: 1,
    wordAfter: 'ite',
    wordBefore: '',
  },
  {
    category: 'k-sound',
    choices: ['c', 'k', 'ck', 'ch'],
    correctSpelling: 'ck',
    explanation: 'After a short vowel at the end of a word, use CK: "back".',
    soundDescription: '"k" sound',
    tier: 1,
    wordAfter: '',
    wordBefore: 'ba',
  },
  {
    category: 'k-sound',
    choices: ['c', 'k', 'ck', 'ch'],
    correctSpelling: 'k',
    explanation: 'After a long vowel or consonant, use K alone: "book".',
    soundDescription: '"k" sound',
    tier: 2,
    wordAfter: '',
    wordBefore: 'boo',
  },
  {
    category: 'k-sound',
    choices: ['k', 'qu', 'ck', 'c'],
    correctSpelling: 'qu',
    explanation: 'QU spells the "kw" sound in "unique" — from French/Latin.',
    soundDescription: '"k" sound',
    tier: 3,
    wordAfter: 'ue',
    wordBefore: 'uni',
  },
  {
    category: 'k-sound',
    choices: ['k', 'ch', 'ck', 'c'],
    correctSpelling: 'ch',
    explanation: 'In Greek-origin words, CH spells the "k" sound: "school".',
    soundDescription: '"k" sound',
    tier: 3,
    wordAfter: 'ool',
    wordBefore: 's',
  },

  // === Long A spellings ===
  {
    category: 'long-a',
    choices: ['ai', 'ay', 'a_e', 'ei'],
    correctSpelling: 'ai',
    explanation: 'In the middle of a word, long A is often spelled AI: "rain".',
    soundDescription: 'long "ay" sound',
    tier: 1,
    wordAfter: 'n',
    wordBefore: 'r',
  },
  {
    category: 'long-a',
    choices: ['ai', 'ay', 'a_e', 'ei'],
    correctSpelling: 'ay',
    explanation: 'At the end of a word, long A is spelled AY: "play".',
    soundDescription: 'long "ay" sound',
    tier: 1,
    wordAfter: '',
    wordBefore: 'pl',
  },
  {
    category: 'long-a',
    choices: ['ai', 'ay', 'a_e', 'ei'],
    correctSpelling: 'a_e',
    explanation: 'Split by a consonant + silent E: "game" (a-consonant-e pattern).',
    soundDescription: 'long "ay" sound',
    tier: 1,
    wordAfter: 'me',
    wordBefore: 'g',
  },
  {
    category: 'long-a',
    choices: ['ai', 'ay', 'ea', 'a_e'],
    correctSpelling: 'ea',
    explanation: '"Great" is one of the few words where EA makes the long A sound.',
    soundDescription: 'long "ay" sound',
    tier: 3,
    wordAfter: 't',
    wordBefore: 'gr',
  },
  {
    category: 'long-a',
    choices: ['ai', 'a_e', 'ea', 'ay'],
    correctSpelling: 'ea',
    explanation: '"Steak" uses EA for the long A sound — a rare exception.',
    soundDescription: 'long "ay" sound',
    tier: 3,
    wordAfter: 'k',
    wordBefore: 'st',
  },

  // === -TION / -SION ===
  {
    category: 'shun-sound',
    choices: ['tion', 'sion', 'shun', 'cian'],
    correctSpelling: 'tion',
    explanation: 'After most consonants and vowels, use -TION: "nation".',
    soundDescription: '"shun" sound',
    tier: 1,
    wordAfter: '',
    wordBefore: 'na',
  },
  {
    category: 'shun-sound',
    choices: ['tion', 'sion', 'shun', 'cian'],
    correctSpelling: 'sion',
    explanation: 'After vowels (especially when the root ends in -de or -se), use -SION: "vision".',
    soundDescription: '"shun" sound',
    tier: 2,
    wordAfter: '',
    wordBefore: 'vi',
  },
  {
    category: 'shun-sound',
    choices: ['tion', 'sion', 'cion', 'shun'],
    correctSpelling: 'tion',
    explanation: '-TION is by far the most common spelling for the "shun" sound: "action".',
    soundDescription: '"shun" sound',
    tier: 1,
    wordAfter: '',
    wordBefore: 'ac',
  },
  {
    category: 'shun-sound',
    choices: ['tion', 'sion', 'zion', 'cian'],
    correctSpelling: 'sion',
    explanation: '-SION can also make a "zhun" sound: "decision".',
    soundDescription: '"zhun" sound',
    tier: 2,
    wordAfter: '',
    wordBefore: 'deci',
  },
  {
    category: 'shun-sound',
    choices: ['tion', 'sion', 'shion', 'cian'],
    correctSpelling: 'tion',
    explanation: 'After -ate words, drop the E and add -ION → -ATION: "education".',
    soundDescription: '"shun" sound',
    tier: 2,
    wordAfter: '',
    wordBefore: 'educa',
  },

  // === Long E spellings ===
  {
    category: 'long-e',
    choices: ['ea', 'ee', 'ie', 'ey'],
    correctSpelling: 'ea',
    explanation: 'EA is one of the most common long E spellings: "team".',
    soundDescription: 'long "ee" sound',
    tier: 1,
    wordAfter: 'm',
    wordBefore: 't',
  },
  {
    category: 'long-e',
    choices: ['ea', 'ee', 'e', 'ie'],
    correctSpelling: 'ee',
    explanation: 'EE often appears in the middle or end of words: "free".',
    soundDescription: 'long "ee" sound',
    tier: 1,
    wordAfter: '',
    wordBefore: 'fr',
  },
  {
    category: 'long-e',
    choices: ['ea', 'ee', 'ie', 'ey'],
    correctSpelling: 'ie',
    explanation: 'IE spells long E in some words: "believe" (I before E rule).',
    soundDescription: 'long "ee" sound',
    tier: 2,
    wordAfter: 've',
    wordBefore: 'bel',
  },
  {
    category: 'long-e',
    choices: ['ea', 'ee', 'ie', 'ey'],
    correctSpelling: 'ie',
    explanation: 'IE spells long E in "thief" — I before E except after C.',
    soundDescription: 'long "ee" sound',
    tier: 2,
    wordAfter: 'f',
    wordBefore: 'th',
  },
  {
    category: 'long-e',
    choices: ['ea', 'ee', 'ei', 'ie'],
    correctSpelling: 'ei',
    explanation: 'After C, it flips to EI: "receive" (I before E except after C).',
    soundDescription: 'long "ee" sound',
    tier: 3,
    wordAfter: 've',
    wordBefore: 'rec',
  },

  // === S vs Z sound for S ===
  {
    category: 's-z',
    choices: ['s', 'z', 'se', 'ss'],
    correctSpelling: 's',
    explanation: 'The word "is" spells the Z sound with just S — very common in short words.',
    soundDescription: '"z" sound',
    tier: 2,
    wordAfter: '',
    wordBefore: 'i',
  },
  {
    category: 's-z',
    choices: ['s', 'z', 'zz', 'se'],
    correctSpelling: 's',
    explanation: 'S between vowels often sounds like Z: "rose".',
    soundDescription: '"z" sound',
    tier: 2,
    wordAfter: 'e',
    wordBefore: 'ro',
  },

  // === F sound spellings ===
  {
    category: 'f-sound',
    choices: ['f', 'ph', 'gh', 'ff'],
    correctSpelling: 'ph',
    explanation: 'PH spells the "f" sound in Greek-origin words: "phone".',
    soundDescription: '"f" sound',
    tier: 2,
    wordAfter: 'one',
    wordBefore: '',
  },
  {
    category: 'f-sound',
    choices: ['f', 'ph', 'gh', 'ff'],
    correctSpelling: 'gh',
    explanation: 'GH can spell the "f" sound: "laugh".',
    soundDescription: '"f" sound',
    tier: 3,
    wordAfter: '',
    wordBefore: 'lau',
  },
  {
    category: 'f-sound',
    choices: ['f', 'ph', 'gh', 'ff'],
    correctSpelling: 'gh',
    explanation: 'GH at the end of "enough" sounds like "f".',
    soundDescription: '"f" sound',
    tier: 3,
    wordAfter: '',
    wordBefore: 'enou',
  },
];

/**
 * Pick quiz questions: 3 tier-1 + 4 tier-2 + 3 tier-3, shuffled within tiers.
 */
export function pickQuiz(seed: number, count = 10): SpellThatSoundQuestion[] {
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

  return [...t1.slice(0, t1Count), ...t2.slice(0, t2Count), ...t3.slice(0, t3Count)].map((q) => ({
    ...q,
    choices: shuffle([...q.choices], rng),
  }));
}
