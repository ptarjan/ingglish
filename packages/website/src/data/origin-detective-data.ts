/**
 * Origin Detective data.
 *
 * Each question shows a word with an unusual spelling and asks the player
 * to guess its etymology (Germanic, French, Latin, or Greek).
 *
 * Tier 1 = obvious clues, Tier 2 = less obvious, Tier 3 = surprising.
 */

import { mulberry32, shuffle } from '../games/prng';

export type Origin = 'French' | 'Germanic' | 'Greek' | 'Latin';

export interface OriginDetectiveQuestion {
  choices: Origin[];
  correctOrigin: Origin;
  explanation: string;
  spellingClue: string;
  tier: 1 | 2 | 3;
  word: string;
}

const QUESTIONS: OriginDetectiveQuestion[] = [
  // === Greek ===
  {
    choices: ['Germanic', 'French', 'Latin', 'Greek'],
    correctOrigin: 'Greek',
    explanation: 'CH = "k" is a hallmark of Greek: school, chorus, chemistry, character.',
    spellingClue: 'CH sounds like "k"',
    tier: 1,
    word: 'school',
  },
  {
    choices: ['Germanic', 'French', 'Latin', 'Greek'],
    correctOrigin: 'Greek',
    explanation: 'Silent P in PS- is Greek: psychology, psalm, pseudo, pneumonia.',
    spellingClue: 'Starts with silent P',
    tier: 1,
    word: 'psychology',
  },
  {
    choices: ['Germanic', 'French', 'Latin', 'Greek'],
    correctOrigin: 'Greek',
    explanation: 'PH = "f" is a Greek spelling: phone, photo, philosophy, pharmacy.',
    spellingClue: 'PH sounds like "f"',
    tier: 1,
    word: 'phone',
  },
  {
    choices: ['Germanic', 'French', 'Latin', 'Greek'],
    correctOrigin: 'Greek',
    explanation: 'RH- and Y as a vowel are Greek markers: rhythm, rhyme, myth.',
    spellingClue: 'RH and no vowel pattern',
    tier: 2,
    word: 'rhythm',
  },
  {
    choices: ['Germanic', 'French', 'Latin', 'Greek'],
    correctOrigin: 'Greek',
    explanation: 'Silent PT- is Greek: pterodactyl, Ptolemy. The P was pronounced in Greek.',
    spellingClue: 'Starts with silent P',
    tier: 2,
    word: 'pterodactyl',
  },
  {
    choices: ['Germanic', 'French', 'Latin', 'Greek'],
    correctOrigin: 'Greek',
    explanation: 'Multiple Greek markers: CH = "k", TH digraph, and -um ending.',
    spellingClue: 'CH sounds like "k", TH, -um ending',
    tier: 3,
    word: 'chrysanthemum',
  },

  // === French ===
  {
    choices: ['Germanic', 'French', 'Latin', 'Greek'],
    correctOrigin: 'French',
    explanation: 'CH = "sh" is French: machine, chef, chauffeur, brochure.',
    spellingClue: 'CH sounds like "sh"',
    tier: 1,
    word: 'machine',
  },
  {
    choices: ['Germanic', 'French', 'Latin', 'Greek'],
    correctOrigin: 'French',
    explanation: 'Silent final consonants are a French hallmark: ballet, bouquet, depot.',
    spellingClue: 'Silent T at the end',
    tier: 1,
    word: 'ballet',
  },
  {
    choices: ['Germanic', 'French', 'Latin', 'Greek'],
    correctOrigin: 'French',
    explanation: 'CH = "sh" plus the -EUR ending are French markers.',
    spellingClue: 'CH = "sh" and -EUR ending',
    tier: 2,
    word: 'chauffeur',
  },
  {
    choices: ['Germanic', 'French', 'Latin', 'Greek'],
    correctOrigin: 'French',
    explanation: 'The AU vowel and -ANT ending suggest French origin.',
    spellingClue: 'Silent letters and -ANT ending',
    tier: 2,
    word: 'restaurant',
  },
  {
    choices: ['Germanic', 'French', 'Latin', 'Greek'],
    correctOrigin: 'French',
    explanation: 'Five letters, one sound — the extreme silent letters are French.',
    spellingClue: 'UEUE is all silent after Q',
    tier: 2,
    word: 'queue',
  },
  {
    choices: ['Germanic', 'French', 'Latin', 'Greek'],
    correctOrigin: 'French',
    explanation: 'Named after the French region. CH = "sh" and -GNE are French patterns.',
    spellingClue: 'CH = "sh" and -AGNE ending',
    tier: 3,
    word: 'champagne',
  },

  // === Germanic (Old English) ===
  {
    choices: ['Germanic', 'French', 'Latin', 'Greek'],
    correctOrigin: 'Germanic',
    explanation:
      'Silent KN- and -GH are Old English: knight, know, night, light. The K and GH were once pronounced.',
    spellingClue: 'Silent K and GH',
    tier: 1,
    word: 'knight',
  },
  {
    choices: ['Germanic', 'French', 'Latin', 'Greek'],
    correctOrigin: 'Germanic',
    explanation: 'Silent WR- is Old English: write, wrong, wrist. The W was once pronounced.',
    spellingClue: 'Silent W',
    tier: 1,
    word: 'write',
  },
  {
    choices: ['Germanic', 'French', 'Latin', 'Greek'],
    correctOrigin: 'Germanic',
    explanation: '-OUGH spellings are Old English. The GH was once a throaty sound.',
    spellingClue: '-OUGH with "off" sound',
    tier: 2,
    word: 'cough',
  },
  {
    choices: ['Germanic', 'French', 'Latin', 'Greek'],
    correctOrigin: 'Germanic',
    explanation: 'Silent GH inside a word is Old English: daughter, thought, eight.',
    spellingClue: 'Silent GH in the middle',
    tier: 2,
    word: 'daughter',
  },
  {
    choices: ['Germanic', 'French', 'Latin', 'Greek'],
    correctOrigin: 'Germanic',
    explanation: 'Silent GN- is Old English/Germanic: gnaw, gnat, gnome.',
    spellingClue: 'Silent G before N',
    tier: 3,
    word: 'gnaw',
  },
  {
    choices: ['Germanic', 'French', 'Latin', 'Greek'],
    correctOrigin: 'Germanic',
    explanation: 'The silent W in "sword" is from Old English — the W was once pronounced.',
    spellingClue: 'Silent W',
    tier: 3,
    word: 'sword',
  },

  // === Latin ===
  {
    choices: ['Germanic', 'French', 'Latin', 'Greek'],
    correctOrigin: 'Latin',
    explanation: 'SC = "s" before E or I comes from Latin: science, scissors, scene.',
    spellingClue: 'SC sounds like "s"',
    tier: 2,
    word: 'science',
  },
  {
    choices: ['Germanic', 'French', 'Latin', 'Greek'],
    correctOrigin: 'Latin',
    explanation: 'Silent C in -SCLE is Latin: muscle (from Latin musculus, "little mouse").',
    spellingClue: 'Silent C',
    tier: 2,
    word: 'muscle',
  },
  {
    choices: ['Germanic', 'French', 'Latin', 'Greek'],
    correctOrigin: 'Latin',
    explanation: 'The silent B was added by scholars to show the Latin root "debitum".',
    spellingClue: 'Silent B',
    tier: 2,
    word: 'debt',
  },
  {
    choices: ['Germanic', 'French', 'Latin', 'Greek'],
    correctOrigin: 'Latin',
    explanation: 'Like "debt", the B was added to show the Latin root "dubitare".',
    spellingClue: 'Silent B',
    tier: 3,
    word: 'doubt',
  },
  {
    choices: ['Germanic', 'French', 'Latin', 'Greek'],
    correctOrigin: 'Latin',
    explanation: 'The silent P was added to show the Latin root "recepta".',
    spellingClue: 'Silent P',
    tier: 3,
    word: 'receipt',
  },
  {
    choices: ['Germanic', 'French', 'Latin', 'Greek'],
    correctOrigin: 'Latin',
    explanation: 'The silent B reflects the Latin "subtilis". English borrowed it through French.',
    spellingClue: 'Silent B',
    tier: 3,
    word: 'subtle',
  },
];

/**
 * Pick quiz questions: 3 tier-1 + 4 tier-2 + 3 tier-3, shuffled within tiers.
 */
export function pickQuiz(seed: number, count = 10): OriginDetectiveQuestion[] {
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
