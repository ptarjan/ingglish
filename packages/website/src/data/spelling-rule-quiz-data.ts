/**
 * Spelling Rule Quiz data.
 *
 * Each question shows a word with a highlighted letter pattern and asks
 * what sound the pattern makes. Categories cover the major sources of
 * English spelling unpredictability.
 *
 * Tier 1 = common/predictable, Tier 2 = less obvious, Tier 3 = tricky exceptions.
 */

import { mulberry32, shuffle } from '../games/prng';

export interface SpellingRuleQuestion {
  category: string;
  choices: string[];
  correctSound: string;
  explanation: string;
  pattern: string;
  patternStart: number;
  tier: 1 | 2 | 3;
  word: string;
}

const QUESTIONS: SpellingRuleQuestion[] = [
  // === CH digraph ===
  // English /tʃ/
  {
    category: 'ch-digraph',
    choices: ['/tʃ/', '/k/', '/ʃ/'],
    correctSound: '/tʃ/',
    explanation: 'English-origin words use CH for /tʃ/ as in "church".',
    pattern: 'ch',
    patternStart: 0,
    tier: 1,
    word: 'church',
  },
  {
    category: 'ch-digraph',
    choices: ['/tʃ/', '/k/', '/ʃ/'],
    correctSound: '/tʃ/',
    explanation: 'CH makes the /tʃ/ sound in native English words like "child".',
    pattern: 'ch',
    patternStart: 0,
    tier: 1,
    word: 'child',
  },
  {
    category: 'ch-digraph',
    choices: ['/tʃ/', '/k/', '/ʃ/'],
    correctSound: '/tʃ/',
    explanation: 'In everyday English words, CH says /tʃ/.',
    pattern: 'ch',
    patternStart: 0,
    tier: 1,
    word: 'cheap',
  },
  // Greek /k/
  {
    category: 'ch-digraph',
    choices: ['/tʃ/', '/k/', '/ʃ/'],
    correctSound: '/k/',
    explanation: 'Greek-origin words use CH for /k/. "School" comes from Greek scholē.',
    pattern: 'ch',
    patternStart: 1,
    tier: 2,
    word: 'school',
  },
  {
    category: 'ch-digraph',
    choices: ['/tʃ/', '/k/', '/ʃ/'],
    correctSound: '/k/',
    explanation: 'CH says /k/ in Greek-origin words like "chorus".',
    pattern: 'ch',
    patternStart: 0,
    tier: 2,
    word: 'chorus',
  },
  {
    category: 'ch-digraph',
    choices: ['/tʃ/', '/k/', '/ʃ/'],
    correctSound: '/k/',
    explanation: 'The CH in "anchor" is /k/, reflecting its Greek roots.',
    pattern: 'ch',
    patternStart: 2,
    tier: 2,
    word: 'anchor',
  },
  {
    category: 'ch-digraph',
    choices: ['/tʃ/', '/k/', '/ʃ/'],
    correctSound: '/k/',
    explanation: 'The CH in "stomach" says /k/ — it came through Greek and Latin.',
    pattern: 'ch',
    patternStart: 5,
    tier: 2,
    word: 'stomach',
  },
  // French /ʃ/
  {
    category: 'ch-digraph',
    choices: ['/tʃ/', '/k/', '/ʃ/'],
    correctSound: '/ʃ/',
    explanation: 'French-origin words use CH for /ʃ/. "Machine" is from French.',
    pattern: 'ch',
    patternStart: 2,
    tier: 3,
    word: 'machine',
  },
  {
    category: 'ch-digraph',
    choices: ['/tʃ/', '/k/', '/ʃ/'],
    correctSound: '/ʃ/',
    explanation: 'CH says /ʃ/ in French loanwords like "chef".',
    pattern: 'ch',
    patternStart: 0,
    tier: 2,
    word: 'chef',
  },
  {
    category: 'ch-digraph',
    choices: ['/tʃ/', '/k/', '/ʃ/'],
    correctSound: '/ʃ/',
    explanation: '"Charade" is French, so CH makes the /ʃ/ sound.',
    pattern: 'ch',
    patternStart: 0,
    tier: 3,
    word: 'charade',
  },

  // === TH digraph ===
  // Voiceless /θ/
  {
    category: 'th-digraph',
    choices: ['/θ/', '/ð/'],
    correctSound: '/θ/',
    explanation: 'TH is voiceless /θ/ in "think" — your vocal cords don\'t vibrate.',
    pattern: 'th',
    patternStart: 0,
    tier: 1,
    word: 'think',
  },
  {
    category: 'th-digraph',
    choices: ['/θ/', '/ð/'],
    correctSound: '/θ/',
    explanation: 'The TH in "bath" is voiceless /θ/.',
    pattern: 'th',
    patternStart: 2,
    tier: 1,
    word: 'bath',
  },
  {
    category: 'th-digraph',
    choices: ['/θ/', '/ð/'],
    correctSound: '/θ/',
    explanation: 'TH in "three" is voiceless — feel the difference by touching your throat.',
    pattern: 'th',
    patternStart: 0,
    tier: 1,
    word: 'three',
  },
  {
    category: 'th-digraph',
    choices: ['/θ/', '/ð/'],
    correctSound: '/θ/',
    explanation: 'The TH in "mouth" (noun) is voiceless /θ/.',
    pattern: 'th',
    patternStart: 3,
    tier: 2,
    word: 'mouth',
  },
  // Voiced /ð/
  {
    category: 'th-digraph',
    choices: ['/θ/', '/ð/'],
    correctSound: '/ð/',
    explanation: 'TH is voiced /ð/ in common function words like "this".',
    pattern: 'th',
    patternStart: 0,
    tier: 1,
    word: 'this',
  },
  {
    category: 'th-digraph',
    choices: ['/θ/', '/ð/'],
    correctSound: '/ð/',
    explanation: '"The" uses voiced /ð/ — most function words (the, this, that, them) do.',
    pattern: 'th',
    patternStart: 0,
    tier: 1,
    word: 'the',
  },
  {
    category: 'th-digraph',
    choices: ['/θ/', '/ð/'],
    correctSound: '/ð/',
    explanation: 'The verb "breathe" has voiced /ð/, while the noun "breath" has voiceless /θ/.',
    pattern: 'th',
    patternStart: 3,
    tier: 2,
    word: 'breathe',
  },
  {
    category: 'th-digraph',
    choices: ['/θ/', '/ð/'],
    correctSound: '/ð/',
    explanation: '"Smooth" ends with voiced /ð/.',
    pattern: 'th',
    patternStart: 4,
    tier: 3,
    word: 'smooth',
  },

  // === EA ambiguity ===
  // /iː/
  {
    category: 'ea-vowel',
    choices: ['/iː/', '/ɛ/'],
    correctSound: '/iː/',
    explanation: 'EA usually says /iː/ as in "beat", "eat", "read" (present tense).',
    pattern: 'ea',
    patternStart: 1,
    tier: 1,
    word: 'beat',
  },
  {
    category: 'ea-vowel',
    choices: ['/iː/', '/ɛ/'],
    correctSound: '/iː/',
    explanation: 'EA says /iː/ in "clean" — this is the more common pronunciation.',
    pattern: 'ea',
    patternStart: 2,
    tier: 1,
    word: 'clean',
  },
  {
    category: 'ea-vowel',
    choices: ['/iː/', '/ɛ/'],
    correctSound: '/iː/',
    explanation: 'EA in "dream" makes the long /iː/ sound.',
    pattern: 'ea',
    patternStart: 2,
    tier: 1,
    word: 'dream',
  },
  // /ɛ/
  {
    category: 'ea-vowel',
    choices: ['/iː/', '/ɛ/'],
    correctSound: '/ɛ/',
    explanation: 'EA says /ɛ/ in "bread" — you just have to memorize these exceptions.',
    pattern: 'ea',
    patternStart: 2,
    tier: 2,
    word: 'bread',
  },
  {
    category: 'ea-vowel',
    choices: ['/iː/', '/ɛ/'],
    correctSound: '/ɛ/',
    explanation: 'The EA in "head" is /ɛ/, not /iː/. Many common words have this.',
    pattern: 'ea',
    patternStart: 1,
    tier: 2,
    word: 'head',
  },
  {
    category: 'ea-vowel',
    choices: ['/iː/', '/ɛ/'],
    correctSound: '/ɛ/',
    explanation: '"Dead" rhymes with "head" and "bread" — EA says /ɛ/.',
    pattern: 'ea',
    patternStart: 1,
    tier: 2,
    word: 'dead',
  },
  {
    category: 'ea-vowel',
    choices: ['/iː/', '/ɛ/'],
    correctSound: '/ɛ/',
    explanation: '"Sweat" has /ɛ/ even though "sweet" has /iː/.',
    pattern: 'ea',
    patternStart: 2,
    tier: 3,
    word: 'sweat',
  },

  // === Silent E ===
  // Rule works
  {
    category: 'silent-e',
    choices: ['/eɪ/', '/æ/', '/ʌ/'],
    correctSound: '/eɪ/',
    explanation: 'Silent E makes the preceding vowel "say its name": cake → /eɪ/.',
    pattern: 'a_e',
    patternStart: 1,
    tier: 1,
    word: 'cake',
  },
  {
    category: 'silent-e',
    choices: ['/aɪ/', '/ɪ/', '/iː/'],
    correctSound: '/aɪ/',
    explanation: 'Silent E makes I say /aɪ/: "pine" vs "pin".',
    pattern: 'i_e',
    patternStart: 1,
    tier: 1,
    word: 'pine',
  },
  {
    category: 'silent-e',
    choices: ['/oʊ/', '/ɒ/', '/ʌ/'],
    correctSound: '/oʊ/',
    explanation: 'Silent E makes O say /oʊ/: "hope" vs "hop".',
    pattern: 'o_e',
    patternStart: 1,
    tier: 1,
    word: 'hope',
  },
  {
    category: 'silent-e',
    choices: ['/juː/', '/ʌ/', '/uː/'],
    correctSound: '/juː/',
    explanation: 'Silent E makes U say /juː/: "cute" vs "cut".',
    pattern: 'u_e',
    patternStart: 1,
    tier: 1,
    word: 'cute',
  },
  // Exceptions
  {
    category: 'silent-e',
    choices: ['/eɪ/', '/æ/', '/ʌ/'],
    correctSound: '/æ/',
    explanation: '"Have" breaks the silent E rule — A still says /æ/, not /eɪ/.',
    pattern: 'a_e',
    patternStart: 1,
    tier: 2,
    word: 'have',
  },
  {
    category: 'silent-e',
    choices: ['/oʊ/', '/ɒ/', '/ʌ/'],
    correctSound: '/ʌ/',
    explanation: '"Love" breaks the silent E rule — O says /ʌ/, not /oʊ/.',
    pattern: 'o_e',
    patternStart: 1,
    tier: 2,
    word: 'love',
  },
  {
    category: 'silent-e',
    choices: ['/oʊ/', '/ɒ/', '/ʌ/'],
    correctSound: '/ɒ/',
    explanation: '"Gone" breaks the silent E rule — O says /ɒ/, not /oʊ/.',
    pattern: 'o_e',
    patternStart: 1,
    tier: 3,
    word: 'gone',
  },
  {
    category: 'silent-e',
    choices: ['/aɪ/', '/ɪ/', '/iː/'],
    correctSound: '/ɪ/',
    explanation: '"Give" breaks the silent E rule — I says /ɪ/, not /aɪ/.',
    pattern: 'i_e',
    patternStart: 1,
    tier: 2,
    word: 'give',
  },

  // === OUGH ===
  {
    category: 'ough',
    choices: ['/oʊ/', '/uː/', '/ʌf/', '/ɒf/', '/aʊ/', '/ɔː/'],
    correctSound: '/oʊ/',
    explanation: 'OUGH says /oʊ/ in "though" — one of six different pronunciations!',
    pattern: 'ough',
    patternStart: 2,
    tier: 2,
    word: 'though',
  },
  {
    category: 'ough',
    choices: ['/oʊ/', '/uː/', '/ʌf/', '/ɒf/', '/aʊ/', '/ɔː/'],
    correctSound: '/uː/',
    explanation: 'OUGH says /uː/ in "through".',
    pattern: 'ough',
    patternStart: 3,
    tier: 2,
    word: 'through',
  },
  {
    category: 'ough',
    choices: ['/oʊ/', '/uː/', '/ʌf/', '/ɒf/', '/aʊ/', '/ɔː/'],
    correctSound: '/ʌf/',
    explanation: 'OUGH says /ʌf/ in "tough", "rough", "enough".',
    pattern: 'ough',
    patternStart: 1,
    tier: 2,
    word: 'tough',
  },
  {
    category: 'ough',
    choices: ['/oʊ/', '/uː/', '/ʌf/', '/ɒf/', '/aʊ/', '/ɔː/'],
    correctSound: '/ɒf/',
    explanation: 'OUGH says /ɒf/ in "cough" — different from "tough"!',
    pattern: 'ough',
    patternStart: 1,
    tier: 3,
    word: 'cough',
  },
  {
    category: 'ough',
    choices: ['/oʊ/', '/uː/', '/ʌf/', '/ɒf/', '/aʊ/', '/ɔː/'],
    correctSound: '/aʊ/',
    explanation: 'OUGH says /aʊ/ in "bough" and "plough".',
    pattern: 'ough',
    patternStart: 1,
    tier: 3,
    word: 'bough',
  },
  {
    category: 'ough',
    choices: ['/oʊ/', '/uː/', '/ʌf/', '/ɒf/', '/aʊ/', '/ɔː/'],
    correctSound: '/ɔː/',
    explanation: 'OUGH says /ɔː/ in "thought", "bought", "ought".',
    pattern: 'ough',
    patternStart: 2,
    tier: 2,
    word: 'thought',
  },

  // === Soft C/G ===
  // Soft C (/s/ before e, i, y)
  {
    category: 'soft-cg',
    choices: ['/s/', '/k/'],
    correctSound: '/s/',
    explanation: 'C is soft (/s/) before E, I, or Y: "city", "cent", "cycle".',
    pattern: 'c',
    patternStart: 0,
    tier: 1,
    word: 'city',
  },
  {
    category: 'soft-cg',
    choices: ['/s/', '/k/'],
    correctSound: '/s/',
    explanation: 'C before E is soft: "cell" starts with /s/.',
    pattern: 'c',
    patternStart: 0,
    tier: 1,
    word: 'cell',
  },
  // Hard C (/k/)
  {
    category: 'soft-cg',
    choices: ['/s/', '/k/'],
    correctSound: '/k/',
    explanation: 'C is hard (/k/) before A, O, U, or consonants: "cat", "cold", "cup".',
    pattern: 'c',
    patternStart: 0,
    tier: 1,
    word: 'cat',
  },
  // Soft G (/dʒ/ before e, i, y)
  {
    category: 'soft-cg',
    choices: ['/dʒ/', '/ɡ/'],
    correctSound: '/dʒ/',
    explanation: 'G is often soft (/dʒ/) before E, I, or Y: "gem", "giant".',
    pattern: 'g',
    patternStart: 0,
    tier: 1,
    word: 'gem',
  },
  {
    category: 'soft-cg',
    choices: ['/dʒ/', '/ɡ/'],
    correctSound: '/dʒ/',
    explanation: 'G before I is usually soft: "giraffe" starts with /dʒ/.',
    pattern: 'g',
    patternStart: 0,
    tier: 2,
    word: 'giraffe',
  },
  // Hard G exceptions before e/i
  {
    category: 'soft-cg',
    choices: ['/dʒ/', '/ɡ/'],
    correctSound: '/ɡ/',
    explanation:
      '"Get" breaks the soft-G rule — G stays hard /ɡ/ despite the E. Germanic words often do this.',
    pattern: 'g',
    patternStart: 0,
    tier: 2,
    word: 'get',
  },
  {
    category: 'soft-cg',
    choices: ['/dʒ/', '/ɡ/'],
    correctSound: '/ɡ/',
    explanation: '"Girl" keeps hard /ɡ/ before I — another Germanic exception.',
    pattern: 'g',
    patternStart: 0,
    tier: 2,
    word: 'girl',
  },
  {
    category: 'soft-cg',
    choices: ['/dʒ/', '/ɡ/'],
    correctSound: '/ɡ/',
    explanation:
      '"Give" has hard /ɡ/ despite the I. Old English words often resist the soft-G rule.',
    pattern: 'g',
    patternStart: 0,
    tier: 3,
    word: 'give',
  },

  // === -ED suffix ===
  {
    category: 'ed-suffix',
    choices: ['/t/', '/d/', '/ɪd/'],
    correctSound: '/t/',
    explanation: 'After voiceless sounds (k, p, s, etc.), -ED says /t/.',
    pattern: 'ed',
    patternStart: 4,
    tier: 1,
    word: 'walked',
  },
  {
    category: 'ed-suffix',
    choices: ['/t/', '/d/', '/ɪd/'],
    correctSound: '/d/',
    explanation: 'After voiced sounds (vowels, l, n, etc.), -ED says /d/.',
    pattern: 'ed',
    patternStart: 4,
    tier: 1,
    word: 'played',
  },
  {
    category: 'ed-suffix',
    choices: ['/t/', '/d/', '/ɪd/'],
    correctSound: '/ɪd/',
    explanation: 'After /t/ or /d/, -ED adds a syllable: /ɪd/.',
    pattern: 'ed',
    patternStart: 4,
    tier: 1,
    word: 'wanted',
  },
  {
    category: 'ed-suffix',
    choices: ['/t/', '/d/', '/ɪd/'],
    correctSound: '/t/',
    explanation: '"Laughed" ends in /ft/, so -ED says /t/.',
    pattern: 'ed',
    patternStart: 5,
    tier: 2,
    word: 'laughed',
  },
  {
    category: 'ed-suffix',
    choices: ['/t/', '/d/', '/ɪd/'],
    correctSound: '/ɪd/',
    explanation: '"Land" ends in /d/, so -ED adds a syllable: "land-id".',
    pattern: 'ed',
    patternStart: 4,
    tier: 2,
    word: 'landed',
  },
  {
    category: 'ed-suffix',
    choices: ['/t/', '/d/', '/ɪd/'],
    correctSound: '/d/',
    explanation: '"Love" ends in a voiced sound /v/, so -ED says /d/.',
    pattern: 'ed',
    patternStart: 3,
    tier: 2,
    word: 'loved',
  },

  // === OW (two sounds) ===
  {
    category: 'ow-vowel',
    choices: ['/aʊ/', '/oʊ/'],
    correctSound: '/aʊ/',
    explanation: 'OW says /aʊ/ in "cow", "how", "now".',
    pattern: 'ow',
    patternStart: 1,
    tier: 1,
    word: 'cow',
  },
  {
    category: 'ow-vowel',
    choices: ['/aʊ/', '/oʊ/'],
    correctSound: '/oʊ/',
    explanation: 'OW says /oʊ/ in "show", "know", "grow".',
    pattern: 'ow',
    patternStart: 2,
    tier: 1,
    word: 'show',
  },
  {
    category: 'ow-vowel',
    choices: ['/aʊ/', '/oʊ/'],
    correctSound: '/aʊ/',
    explanation: 'OW in "down" is /aʊ/ — no rule tells you which sound OW makes.',
    pattern: 'ow',
    patternStart: 1,
    tier: 2,
    word: 'down',
  },
  {
    category: 'ow-vowel',
    choices: ['/aʊ/', '/oʊ/'],
    correctSound: '/oʊ/',
    explanation: 'OW in "own" is /oʊ/. Compare with "down" — same spelling, different sound.',
    pattern: 'ow',
    patternStart: 0,
    tier: 2,
    word: 'own',
  },
  {
    category: 'ow-vowel',
    choices: ['/aʊ/', '/oʊ/'],
    correctSound: '/oʊ/',
    explanation: 'OW in "bowl" is /oʊ/, but in "howl" it\'s /aʊ/!',
    pattern: 'ow',
    patternStart: 1,
    tier: 3,
    word: 'bowl',
  },
  {
    category: 'ow-vowel',
    choices: ['/aʊ/', '/oʊ/'],
    correctSound: '/aʊ/',
    explanation: '"Fowl" has /aʊ/ — compare with "bowl" which has /oʊ/.',
    pattern: 'ow',
    patternStart: 1,
    tier: 3,
    word: 'fowl',
  },

  // === OO (two sounds) ===
  {
    category: 'oo-vowel',
    choices: ['/uː/', '/ʊ/'],
    correctSound: '/uː/',
    explanation: 'OO usually says /uː/ as in "food", "moon", "cool".',
    pattern: 'oo',
    patternStart: 1,
    tier: 1,
    word: 'food',
  },
  {
    category: 'oo-vowel',
    choices: ['/uː/', '/ʊ/'],
    correctSound: '/ʊ/',
    explanation: 'OO says short /ʊ/ in "book", "look", "cook".',
    pattern: 'oo',
    patternStart: 1,
    tier: 1,
    word: 'book',
  },
  {
    category: 'oo-vowel',
    choices: ['/uː/', '/ʊ/'],
    correctSound: '/uː/',
    explanation: 'OO in "moon" is long /uː/.',
    pattern: 'oo',
    patternStart: 1,
    tier: 1,
    word: 'moon',
  },
  {
    category: 'oo-vowel',
    choices: ['/uː/', '/ʊ/'],
    correctSound: '/ʊ/',
    explanation: 'OO in "good" is short /ʊ/ — compare with "food" which is long /uː/.',
    pattern: 'oo',
    patternStart: 1,
    tier: 2,
    word: 'good',
  },
  {
    category: 'oo-vowel',
    choices: ['/uː/', '/ʊ/', '/ʌ/'],
    correctSound: '/ʌ/',
    explanation: '"Flood" is even stranger — OO says /ʌ/! Same with "blood".',
    pattern: 'oo',
    patternStart: 2,
    tier: 3,
    word: 'flood',
  },
  {
    category: 'oo-vowel',
    choices: ['/uː/', '/ʊ/', '/ʌ/'],
    correctSound: '/ʌ/',
    explanation: 'OO in "blood" says /ʌ/ — a third pronunciation for the same spelling.',
    pattern: 'oo',
    patternStart: 2,
    tier: 3,
    word: 'blood',
  },
];

export type { SpellingRuleQuestion as QuizQuestion };

/**
 * Pick quiz questions: 3 tier-1 + 4 tier-2 + 3 tier-3, shuffled within tiers.
 */
export function pickQuiz(seed: number, count = 10): SpellingRuleQuestion[] {
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
