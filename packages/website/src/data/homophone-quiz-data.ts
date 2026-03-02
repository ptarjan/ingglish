/**
 * Homophones Quiz data.
 *
 * Each entry has an Ingglish spelling and the English words that produce it.
 * Tier 1 = obvious homophones, Tier 2 = less obvious, Tier 3 = tricky.
 */

import { mulberry32, shuffle } from '../games/prng';

export interface HomophoneGroup {
  answers: string[]; // all valid English words for this Ingglish spelling
  distractors: string[]; // near-miss words (differ by a vowel from an answer)
  ingglish: string;
  tier: 1 | 2 | 3;
}

const GROUPS: HomophoneGroup[] = [
  // === Tier 1: Obvious homophones ===
  // Distractors differ from answers by ~1 vowel (swap, add, or remove)
  { answers: ['to', 'too', 'two'], distractors: ['toe', 'tie', 'ten'], ingglish: 'too', tier: 1 },
  {
    answers: ['there', 'their', "they're"],
    distractors: ['three', 'the', 'tire'],
    ingglish: 'dhair',
    tier: 1,
  },
  { answers: ["it's", 'its'], distractors: ['oats', 'outs', 'eats'], ingglish: 'its', tier: 1 },
  { answers: ['your', "you're"], distractors: ['yore', 'year', 'our'], ingglish: 'yoor', tier: 1 },
  {
    answers: ['no', 'know'],
    distractors: ['now', 'new', 'knew', 'knee'],
    ingglish: 'noh',
    tier: 1,
  },
  { answers: ['see', 'sea'], distractors: ['sue', 'say', 'so'], ingglish: 'see', tier: 1 },
  { answers: ['one', 'won'], distractors: ['on', 'win', 'own', 'wan'], ingglish: 'wun', tier: 1 },
  { answers: ['son', 'sun'], distractors: ['soon', 'sin', 'sane'], ingglish: 'son', tier: 1 },
  {
    answers: ['for', 'four'],
    distractors: ['far', 'fur', 'fore', 'fir', 'fair'],
    ingglish: 'for',
    tier: 1,
  },
  { answers: ['by', 'buy', 'bye'], distractors: ['boy', 'bay', 'buoy'], ingglish: 'bai', tier: 1 },
  {
    answers: ['write', 'right', 'rite'],
    distractors: ['wrote', 'writ', 'rate', 'rote'],
    ingglish: 'rait',
    tier: 1,
  },
  {
    answers: ['here', 'hear'],
    distractors: ['her', 'hire', 'hare', 'heir'],
    ingglish: 'heer',
    tier: 1,
  },
  {
    answers: ['wait', 'weight'],
    distractors: ['wit', 'wight', 'wet', 'white'],
    ingglish: 'wayt',
    tier: 1,
  },
  {
    answers: ['week', 'weak'],
    distractors: ['wake', 'woke', 'wick', 'walk'],
    ingglish: 'week',
    tier: 1,
  },
  {
    answers: ['meet', 'meat'],
    distractors: ['met', 'mat', 'moat', 'moot'],
    ingglish: 'meet',
    tier: 1,
  },
  {
    answers: ['news', "gnu's"],
    distractors: ['nose', 'noise', 'noose', 'nous'],
    ingglish: 'nooz',
    tier: 1,
  },
  {
    answers: ['flow', 'floe'],
    distractors: ['flew', 'flaw', 'flee', 'flue'],
    ingglish: 'flou',
    tier: 1,
  },

  // === Tier 2: Less obvious ===
  {
    answers: ['not', 'knot'],
    distractors: ['note', 'nut', 'net', 'knit'],
    ingglish: 'not',
    tier: 2,
  },
  {
    answers: ['him', 'hymn'],
    distractors: ['ham', 'hum', 'hem', 'harm'],
    ingglish: 'him',
    tier: 2,
  },
  {
    answers: ['way', 'weigh'],
    distractors: ['why', 'woe', 'wig', 'wag'],
    ingglish: 'way',
    tier: 2,
  },
  {
    answers: ['whole', 'hole'],
    distractors: ['whale', 'hale', 'hull', 'while'],
    ingglish: 'hohl',
    tier: 2,
  },
  {
    answers: ['made', 'maid'],
    distractors: ['mad', 'mid', 'mode', 'mud'],
    ingglish: 'mayd',
    tier: 2,
  },
  {
    answers: ['die', 'dye'],
    distractors: ['doe', 'due', 'dee', 'day'],
    ingglish: 'dai',
    tier: 2,
  },
  {
    answers: ['or', 'ore', 'oar'],
    distractors: ['our', 'air', 'err', 'ire'],
    ingglish: 'or',
    tier: 2,
  },
  {
    answers: ['knight', 'night'],
    distractors: ['knit', 'nit', 'knot', 'neat'],
    ingglish: 'nait',
    tier: 2,
  },
  {
    answers: ['pair', 'pear', 'pare'],
    distractors: ['par', 'per', 'pier', 'peer', 'pure', 'pore'],
    ingglish: 'pair',
    tier: 2,
  },
  {
    answers: ['stake', 'steak'],
    distractors: ['stock', 'stoke', 'stick', 'stuck'],
    ingglish: 'stayk',
    tier: 2,
  },
  {
    answers: ['bare', 'bear'],
    distractors: ['bar', 'bore', 'beer', 'boar'],
    ingglish: 'bair',
    tier: 2,
  },
  {
    answers: ['steel', 'steal'],
    distractors: ['stale', 'stool', 'still', 'stall'],
    ingglish: 'steel',
    tier: 2,
  },
  {
    answers: ['tail', 'tale'],
    distractors: ['til', 'toil', 'tile', 'toll', 'tall'],
    ingglish: 'tayl',
    tier: 2,
  },
  {
    answers: ['role', 'roll'],
    distractors: ['rule', 'rile', 'rail', 'rill'],
    ingglish: 'rohl',
    tier: 2,
  },
  {
    answers: ['waist', 'waste'],
    distractors: ['wist', 'west', 'worst', 'wrist'],
    ingglish: 'waist',
    tier: 2,
  },
  {
    answers: ['haul', 'hall'],
    distractors: ['hail', 'heal', 'heel', 'hell', 'hill', 'hull'],
    ingglish: 'haul',
    tier: 2,
  },
  {
    answers: ['rain', 'reign', 'rein'],
    distractors: ['ran', 'ruin', 'run', 'roan'],
    ingglish: 'reyn',
    tier: 2,
  },
  {
    answers: ['ceiling', 'sealing'],
    distractors: ['coiling', 'sailing', 'soiling'],
    ingglish: 'seeling',
    tier: 2,
  },
  {
    answers: ['flair', 'flare'],
    distractors: ['floor', 'flour', 'flier', 'flora'],
    ingglish: 'flair',
    tier: 2,
  },
  {
    answers: ['groan', 'grown'],
    distractors: ['grain', 'green', 'groin', 'gran'],
    ingglish: 'grohn',
    tier: 2,
  },
  {
    answers: ['peace', 'piece'],
    distractors: ['pace', 'pike', 'pick', 'puce'],
    ingglish: 'pees',
    tier: 2,
  },
  {
    answers: ['bread', 'bred'],
    distractors: ['broad', 'breed', 'brad', 'braid'],
    ingglish: 'bred',
    tier: 2,
  },
  {
    answers: ['cell', 'sell'],
    distractors: ['call', 'cull', 'sill', 'sail', 'sole'],
    ingglish: 'sel',
    tier: 2,
  },

  // === Tier 3: Tricky ===
  {
    answers: ['so', 'sew'],
    distractors: ['saw', 'sue', 'say', 'sow'],
    ingglish: 'soh',
    tier: 3,
  },
  {
    answers: ['where', 'wear', 'ware'],
    distractors: ['war', 'wire', 'were', 'wore'],
    ingglish: 'wair',
    tier: 3,
  },
  {
    answers: ['would', 'wood'],
    distractors: ['wade', 'weed', 'word', 'wild'],
    ingglish: 'wud',
    tier: 3,
  },
  {
    answers: ['through', 'threw'],
    distractors: ['throw', 'thorough', 'thaw', 'three'],
    ingglish: 'throo',
    tier: 3,
  },
  {
    answers: ['which', 'witch'],
    distractors: ['watch', 'wish', 'with', 'such'],
    ingglish: 'wich',
    tier: 3,
  },
  {
    answers: ['course', 'coarse'],
    distractors: ['curse', 'worse', 'horse', 'cross'],
    ingglish: 'kors',
    tier: 3,
  },
  {
    answers: ['scene', 'seen'],
    distractors: ['scan', 'sane', 'soon', 'sin'],
    ingglish: 'seen',
    tier: 3,
  },
  {
    answers: ['morning', 'mourning'],
    distractors: ['mooring', 'meaning', 'mining', 'moaning'],
    ingglish: 'morning',
    tier: 3,
  },
  {
    answers: ['check', 'cheque', 'czech'],
    distractors: ['chick', 'chuck', 'choke', 'chalk'],
    ingglish: 'chek',
    tier: 3,
  },
  {
    answers: ['heard', 'herd'],
    distractors: ['hard', 'hoard', 'hired', 'horde'],
    ingglish: 'herd',
    tier: 3,
  },
  {
    answers: ['knows', 'nose'],
    distractors: ['noise', 'noose', 'knees', 'nosy'],
    ingglish: 'nohz',
    tier: 3,
  },
  {
    answers: ['great', 'grate'],
    distractors: ['greet', 'groat', 'grit', 'grout'],
    ingglish: 'grayt',
    tier: 3,
  },
  {
    answers: ['done', 'dun'],
    distractors: ['don', 'dine', 'dane', 'dune'],
    ingglish: 'duhn',
    tier: 3,
  },
  {
    answers: ['damn', 'dam'],
    distractors: ['dame', 'dim', 'dome', 'deem'],
    ingglish: 'dam',
    tier: 3,
  },
  {
    answers: ['gnu', 'new', 'knew'],
    distractors: ['now', 'know', 'anew', 'gnaw'],
    ingglish: 'noo',
    tier: 3,
  },
  {
    answers: ['cite', 'sight', 'site'],
    distractors: ['cute', 'suit', 'sit', 'soot', 'suite'],
    ingglish: 'sait',
    tier: 3,
  },
  {
    answers: ['cents', 'scents', 'sense'],
    distractors: ['saint', 'since', 'sons', 'suns'],
    ingglish: 'sens',
    tier: 3,
  },
  {
    answers: ['earn', 'urn'],
    distractors: ['iron', 'ore', 'ire', 'inn'],
    ingglish: 'urn',
    tier: 3,
  },
  {
    answers: ['board', 'bored'],
    distractors: ['beard', 'bard', 'bird', 'bared'],
    ingglish: 'bord',
    tier: 3,
  },
  {
    answers: ['profit', 'prophet'],
    distractors: ['private', 'promote', 'protect', 'protest'],
    ingglish: 'profit',
    tier: 3,
  },
  {
    answers: ['chorus', 'cores'],
    distractors: ['chores', 'cares', 'cures', 'course'],
    ingglish: 'korus',
    tier: 3,
  },
  {
    answers: ['cereal', 'serial'],
    distractors: ['coral', 'casual', 'several', 'surreal'],
    ingglish: 'seeryal',
    tier: 3,
  },
  {
    answers: ['idle', 'idol', 'idyll'],
    distractors: ['ideal', 'ogle', 'aisle', 'addle'],
    ingglish: 'idol',
    tier: 3,
  },
  {
    answers: ['sword', 'soared'],
    distractors: ['sward', 'soured', 'seared', 'stored'],
    ingglish: 'sord',
    tier: 3,
  },
  {
    answers: ['wrought', 'rot'],
    distractors: ['rat', 'root', 'rut', 'rout', 'riot'],
    ingglish: 'rawt',
    tier: 3,
  },
  {
    answers: ['principal', 'principle'],
    distractors: ['princely', 'practical', 'protocol'],
    ingglish: 'prinsipal',
    tier: 3,
  },
  {
    answers: ['medal', 'meddle'],
    distractors: ['model', 'modal', 'middle', 'muddle'],
    ingglish: 'medl',
    tier: 3,
  },
  {
    answers: ['coarser', 'courser'],
    distractors: ['cruiser', 'closer', 'cursor', 'corset'],
    ingglish: 'koarser',
    tier: 3,
  },
  {
    answers: ['pause', 'paws'],
    distractors: ['pose', 'poise', 'pews', 'pies'],
    ingglish: 'maws',
    tier: 3,
  },
  {
    answers: ['liquor', 'licker'],
    distractors: ['locker', 'lacquer', 'looker', 'laker'],
    ingglish: 'likker',
    tier: 3,
  },
];

export interface QuizQuestion {
  choices: string[]; // 4 choices (1+ correct + distractors)
  correctAnswers: string[];
  ingglish: string;
  tier: 1 | 2 | 3;
}

// Fallback pool: answers from other groups, used when a group has fewer
// than 3 curated distractors (shouldn't normally happen).
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

    // Use curated near-miss distractors (words that differ by ~1 vowel)
    const answerSet = new Set(group.answers.map((a) => a.toLowerCase()));
    const curated = shuffle([...group.distractors], rng);
    // Fall back to cross-group pool if not enough curated distractors
    const fallback = shuffle(
      ALL_ANSWERS.filter((d) => !answerSet.has(d) && !group.distractors.includes(d)),
      rng
    );
    const wrongChoices = [...curated, ...fallback].slice(0, 3);

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
