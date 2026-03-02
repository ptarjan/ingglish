/**
 * Homophones Quiz data.
 *
 * Each entry has an Ingglish spelling and the English words that produce it.
 * Tier 1 = obvious homophones, Tier 2 = less obvious, Tier 3 = tricky.
 */

import { mulberry32, shuffle } from '../games/prng';

export interface HomophoneGroup {
  answers: string[]; // all valid English words for this Ingglish spelling
  ingglish: string;
  tier: 1 | 2 | 3;
}

const GROUPS: HomophoneGroup[] = [
  // === Tier 1: Obvious homophones ===
  { answers: ['to', 'too', 'two'], ingglish: 'too', tier: 1 },
  { answers: ['there', 'their', "they're"], ingglish: 'dhair', tier: 1 },
  { answers: ["it's", 'its'], ingglish: 'its', tier: 1 },
  { answers: ['your', "you're"], ingglish: 'yoor', tier: 1 },
  { answers: ['no', 'know'], ingglish: 'noh', tier: 1 },
  { answers: ['see', 'sea'], ingglish: 'see', tier: 1 },
  { answers: ['one', 'won'], ingglish: 'wun', tier: 1 },
  { answers: ['son', 'sun'], ingglish: 'son', tier: 1 },
  { answers: ['for', 'four'], ingglish: 'for', tier: 1 },
  { answers: ['by', 'buy', 'bye'], ingglish: 'bai', tier: 1 },
  { answers: ['write', 'right', 'rite'], ingglish: 'rait', tier: 1 },
  { answers: ['here', 'hear'], ingglish: 'heer', tier: 1 },
  { answers: ['wait', 'weight'], ingglish: 'wayt', tier: 1 },
  { answers: ['week', 'weak'], ingglish: 'week', tier: 1 },
  { answers: ['meet', 'meat'], ingglish: 'meet', tier: 1 },
  { answers: ['news', "gnu's"], ingglish: 'nooz', tier: 1 },
  { answers: ['flow', 'floe'], ingglish: 'flou', tier: 1 },

  // === Tier 2: Less obvious ===
  { answers: ['knight', 'night'], ingglish: 'nait', tier: 2 },
  { answers: ['pair', 'pear', 'pare'], ingglish: 'pair', tier: 2 },
  { answers: ['stake', 'steak'], ingglish: 'stayk', tier: 2 },
  { answers: ['bare', 'bear'], ingglish: 'bair', tier: 2 },
  { answers: ['steel', 'steal'], ingglish: 'steel', tier: 2 },
  { answers: ['tail', 'tale'], ingglish: 'tayl', tier: 2 },
  { answers: ['flow', 'floe'], ingglish: 'flou', tier: 2 },
  { answers: ['role', 'roll'], ingglish: 'rohl', tier: 2 },
  { answers: ['waist', 'waste'], ingglish: 'waist', tier: 2 },
  { answers: ['haul', 'hall'], ingglish: 'haul', tier: 2 },
  { answers: ['rain', 'reign', 'rein'], ingglish: 'reyn', tier: 2 },
  { answers: ['ceiling', 'sealing'], ingglish: 'seeling', tier: 2 },
  { answers: ['flair', 'flare'], ingglish: 'flair', tier: 2 },
  { answers: ['groan', 'grown'], ingglish: 'grohn', tier: 2 },
  { answers: ['peace', 'piece'], ingglish: 'pees', tier: 2 },
  { answers: ['bread', 'bred'], ingglish: 'bred', tier: 2 },
  { answers: ['cell', 'sell'], ingglish: 'sel', tier: 2 },

  // === Tier 3: Tricky ===
  { answers: ['gnu', 'new', 'knew'], ingglish: 'noo', tier: 3 },
  { answers: ['cite', 'sight', 'site'], ingglish: 'sait', tier: 3 },
  { answers: ['cents', 'scents', 'sense'], ingglish: 'sens', tier: 3 },
  { answers: ['earn', 'urn'], ingglish: 'urn', tier: 3 },
  { answers: ['board', 'bored'], ingglish: 'bord', tier: 3 },
  { answers: ['profit', 'prophet'], ingglish: 'profit', tier: 3 },
  { answers: ['chorus', 'cores'], ingglish: 'korus', tier: 3 },
  { answers: ['cereal', 'serial'], ingglish: 'seeryal', tier: 3 },
  { answers: ['idle', 'idol', 'idyll'], ingglish: 'idol', tier: 3 },
  { answers: ['sword', 'soared'], ingglish: 'sord', tier: 3 },
  { answers: ['wrought', 'rot'], ingglish: 'rawt', tier: 3 },
  { answers: ['principal', 'principle'], ingglish: 'prinsipal', tier: 3 },
  { answers: ['medal', 'meddle'], ingglish: 'medl', tier: 3 },
  { answers: ['coarser', 'courser'], ingglish: 'koarser', tier: 3 },
  { answers: ['pause', 'paws'], ingglish: 'maws', tier: 3 },
  { answers: ['liquor', 'licker'], ingglish: 'likker', tier: 3 },
];

export interface QuizQuestion {
  choices: string[]; // 4 choices (1+ correct + distractors)
  correctAnswers: string[];
  ingglish: string;
  tier: 1 | 2 | 3;
}

// Collect all unique answers across groups so distractors come from other
// homophone sets — much more plausible than random common words.
const ALL_ANSWERS = [...new Set(GROUPS.flatMap((g) => g.answers.map((a) => a.toLowerCase())))];

/**
 * Pick quiz questions: 3 tier-1 + 4 tier-2 + 3 tier-3, shuffled within tiers.
 */
export function pickQuiz(seed: number, count = 10): QuizQuestion[] {
  const rng = mulberry32(seed);

  const t1 = shuffle(
    GROUPS.filter((g) => g.tier === 1),
    rng
  );
  const t2 = shuffle(
    GROUPS.filter((g) => g.tier === 2),
    rng
  );
  const t3 = shuffle(
    GROUPS.filter((g) => g.tier === 3),
    rng
  );

  const t1Count = Math.min(3, Math.floor(count * 0.3));
  const t3Count = Math.min(3, Math.floor(count * 0.3));
  const t2Count = count - t1Count - t3Count;

  const selected = [...t1.slice(0, t1Count), ...t2.slice(0, t2Count), ...t3.slice(0, t3Count)];

  return selected.map((group) => {
    // Pick one correct answer to show
    const correct = group.answers[Math.floor(rng() * group.answers.length)]!;

    // Build distractors from other homophone groups' answers (more plausible)
    const answerSet = new Set(group.answers.map((a) => a.toLowerCase()));
    const available = ALL_ANSWERS.filter((d) => !answerSet.has(d));
    const shuffledDistractors = shuffle([...available], rng);
    const wrongChoices = shuffledDistractors.slice(0, 3);

    // Combine and shuffle all choices
    const choices = shuffle([correct, ...wrongChoices], rng);

    return {
      choices,
      correctAnswers: group.answers,
      ingglish: group.ingglish,
      tier: group.tier,
    };
  });
}
