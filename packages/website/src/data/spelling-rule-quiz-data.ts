/**
 * Spelling Rule Quiz data.
 *
 * Each question shows a word with a highlighted letter pattern and asks
 * what sound the pattern makes. Categories cover the major sources of
 * English spelling unpredictability.
 *
 * Sounds use plain-English "as in" labels instead of IPA so players
 * don't need linguistics training.
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
  // English "ch" as in chip
  {
    category: 'ch-digraph',
    choices: ['"ch" as in chip', '"k" as in kite', '"sh" as in ship', '"s" as in sit'],
    correctSound: '"ch" as in chip',
    explanation: 'English-origin words use CH for the "ch" sound as in "church".',
    pattern: 'ch',
    patternStart: 0,
    tier: 1,
    word: 'church',
  },
  {
    category: 'ch-digraph',
    choices: ['"ch" as in chip', '"k" as in kite', '"sh" as in ship', '"s" as in sit'],
    correctSound: '"ch" as in chip',
    explanation: 'CH makes the "ch" sound in native English words like "child".',
    pattern: 'ch',
    patternStart: 0,
    tier: 1,
    word: 'child',
  },
  {
    category: 'ch-digraph',
    choices: ['"ch" as in chip', '"k" as in kite', '"sh" as in ship', '"s" as in sit'],
    correctSound: '"ch" as in chip',
    explanation: 'In everyday English words, CH sounds like "ch" in "chip".',
    pattern: 'ch',
    patternStart: 0,
    tier: 1,
    word: 'cheap',
  },
  // Greek "k"
  {
    category: 'ch-digraph',
    choices: ['"ch" as in chip', '"k" as in kite', '"sh" as in ship', '"s" as in sit'],
    correctSound: '"k" as in kite',
    explanation: 'Greek-origin words use CH for a "k" sound. "School" comes from Greek scholē.',
    pattern: 'ch',
    patternStart: 1,
    tier: 2,
    word: 'school',
  },
  {
    category: 'ch-digraph',
    choices: ['"ch" as in chip', '"k" as in kite', '"sh" as in ship', '"s" as in sit'],
    correctSound: '"k" as in kite',
    explanation: 'CH sounds like "k" in Greek-origin words like "chorus".',
    pattern: 'ch',
    patternStart: 0,
    tier: 2,
    word: 'chorus',
  },
  {
    category: 'ch-digraph',
    choices: ['"ch" as in chip', '"k" as in kite', '"sh" as in ship', '"s" as in sit'],
    correctSound: '"k" as in kite',
    explanation: 'The CH in "anchor" sounds like "k", reflecting its Greek roots.',
    pattern: 'ch',
    patternStart: 2,
    tier: 2,
    word: 'anchor',
  },
  {
    category: 'ch-digraph',
    choices: ['"ch" as in chip', '"k" as in kite', '"sh" as in ship', '"s" as in sit'],
    correctSound: '"k" as in kite',
    explanation: 'The CH in "stomach" sounds like "k" — it came through Greek and Latin.',
    pattern: 'ch',
    patternStart: 5,
    tier: 2,
    word: 'stomach',
  },
  // French "sh"
  {
    category: 'ch-digraph',
    choices: ['"ch" as in chip', '"k" as in kite', '"sh" as in ship', '"s" as in sit'],
    correctSound: '"sh" as in ship',
    explanation: 'French-origin words use CH for an "sh" sound. "Machine" is from French.',
    pattern: 'ch',
    patternStart: 2,
    tier: 3,
    word: 'machine',
  },
  {
    category: 'ch-digraph',
    choices: ['"ch" as in chip', '"k" as in kite', '"sh" as in ship', '"s" as in sit'],
    correctSound: '"sh" as in ship',
    explanation: 'CH sounds like "sh" in French loanwords like "chef".',
    pattern: 'ch',
    patternStart: 0,
    tier: 2,
    word: 'chef',
  },
  {
    category: 'ch-digraph',
    choices: ['"ch" as in chip', '"k" as in kite', '"sh" as in ship', '"s" as in sit'],
    correctSound: '"sh" as in ship',
    explanation: '"Charade" is French, so CH makes the "sh" sound.',
    pattern: 'ch',
    patternStart: 0,
    tier: 3,
    word: 'charade',
  },

  // === TH digraph ===
  // Voiceless (as in "think")
  {
    category: 'th-digraph',
    choices: ['"th" as in thin', '"th" as in that', '"t" as in top', '"d" as in dog'],
    correctSound: '"th" as in thin',
    explanation: 'The TH in "think" is voiceless — air only, your vocal cords don\'t vibrate.',
    pattern: 'th',
    patternStart: 0,
    tier: 1,
    word: 'think',
  },
  {
    category: 'th-digraph',
    choices: ['"th" as in thin', '"th" as in that', '"t" as in top', '"d" as in dog'],
    correctSound: '"th" as in thin',
    explanation: 'The TH in "bath" is voiceless, like in "think".',
    pattern: 'th',
    patternStart: 2,
    tier: 1,
    word: 'bath',
  },
  {
    category: 'th-digraph',
    choices: ['"th" as in thin', '"th" as in that', '"t" as in top', '"d" as in dog'],
    correctSound: '"th" as in thin',
    explanation: 'TH in "three" is voiceless — feel the difference by touching your throat.',
    pattern: 'th',
    patternStart: 0,
    tier: 1,
    word: 'three',
  },
  {
    category: 'th-digraph',
    choices: ['"th" as in thin', '"th" as in that', '"t" as in top', '"d" as in dog'],
    correctSound: '"th" as in thin',
    explanation: 'The TH in "mouth" (noun) is voiceless, like in "think".',
    pattern: 'th',
    patternStart: 3,
    tier: 2,
    word: 'mouth',
  },
  // Voiced (as in "this")
  {
    category: 'th-digraph',
    choices: ['"th" as in thin', '"th" as in that', '"t" as in top', '"d" as in dog'],
    correctSound: '"th" as in that',
    explanation: 'TH is voiced in common function words like "this" — your throat buzzes.',
    pattern: 'th',
    patternStart: 0,
    tier: 1,
    word: 'this',
  },
  {
    category: 'th-digraph',
    choices: ['"th" as in thin', '"th" as in that', '"t" as in top', '"d" as in dog'],
    correctSound: '"th" as in that',
    explanation: '"The" uses the voiced TH — most function words (the, this, that, them) do.',
    pattern: 'th',
    patternStart: 0,
    tier: 1,
    word: 'the',
  },
  {
    category: 'th-digraph',
    choices: ['"th" as in thin', '"th" as in that', '"t" as in top', '"d" as in dog'],
    correctSound: '"th" as in that',
    explanation: 'The verb "breathe" has a voiced TH, while the noun "breath" has a voiceless TH.',
    pattern: 'th',
    patternStart: 3,
    tier: 2,
    word: 'breathe',
  },
  {
    category: 'th-digraph',
    choices: ['"th" as in thin', '"th" as in that', '"t" as in top', '"d" as in dog'],
    correctSound: '"th" as in that',
    explanation: '"Smooth" ends with a voiced TH, like in "this".',
    pattern: 'th',
    patternStart: 4,
    tier: 3,
    word: 'smooth',
  },

  // === EA ambiguity ===
  // "ee" as in feet
  {
    category: 'ea-vowel',
    choices: ['"ee" as in feet', '"e" as in bed', '"ay" as in day', '"i" as in sit'],
    correctSound: '"ee" as in feet',
    explanation: 'EA usually makes a long "ee" sound, as in "beat", "eat", "read" (present).',
    pattern: 'ea',
    patternStart: 1,
    tier: 1,
    word: 'beat',
  },
  {
    category: 'ea-vowel',
    choices: ['"ee" as in feet', '"e" as in bed', '"ay" as in day', '"i" as in sit'],
    correctSound: '"ee" as in feet',
    explanation: 'EA sounds like "ee" in "clean" — this is the more common pronunciation.',
    pattern: 'ea',
    patternStart: 2,
    tier: 1,
    word: 'clean',
  },
  {
    category: 'ea-vowel',
    choices: ['"ee" as in feet', '"e" as in bed', '"ay" as in day', '"i" as in sit'],
    correctSound: '"ee" as in feet',
    explanation: 'EA in "dream" makes the long "ee" sound.',
    pattern: 'ea',
    patternStart: 2,
    tier: 1,
    word: 'dream',
  },
  // "e" as in bed
  {
    category: 'ea-vowel',
    choices: ['"ee" as in feet', '"e" as in bed', '"ay" as in day', '"i" as in sit'],
    correctSound: '"e" as in bed',
    explanation: 'EA sounds like short "e" in "bread" — you just have to memorize these.',
    pattern: 'ea',
    patternStart: 2,
    tier: 2,
    word: 'bread',
  },
  {
    category: 'ea-vowel',
    choices: ['"ee" as in feet', '"e" as in bed', '"ay" as in day', '"i" as in sit'],
    correctSound: '"e" as in bed',
    explanation: 'The EA in "head" sounds like short "e", not "ee". Many common words do this.',
    pattern: 'ea',
    patternStart: 1,
    tier: 2,
    word: 'head',
  },
  {
    category: 'ea-vowel',
    choices: ['"ee" as in feet', '"e" as in bed', '"ay" as in day', '"i" as in sit'],
    correctSound: '"e" as in bed',
    explanation: '"Dead" rhymes with "head" and "bread" — EA sounds like short "e".',
    pattern: 'ea',
    patternStart: 1,
    tier: 2,
    word: 'dead',
  },
  {
    category: 'ea-vowel',
    choices: ['"ee" as in feet', '"e" as in bed', '"ay" as in day', '"i" as in sit'],
    correctSound: '"e" as in bed',
    explanation: '"Sweat" has the short "e" sound even though "sweet" has "ee".',
    pattern: 'ea',
    patternStart: 2,
    tier: 3,
    word: 'sweat',
  },

  // === Silent E ===
  // Rule works
  {
    category: 'silent-e',
    choices: ['"ay" as in day', '"a" as in cat', '"u" as in cup', '"e" as in bed'],
    correctSound: '"ay" as in day',
    explanation: 'Silent E makes the preceding vowel "say its name": cake has the "ay" sound.',
    pattern: 'a_e',
    patternStart: 1,
    tier: 1,
    word: 'cake',
  },
  {
    category: 'silent-e',
    choices: ['"eye" as in mine', '"i" as in sit', '"ee" as in feet', '"ay" as in day'],
    correctSound: '"eye" as in mine',
    explanation: 'Silent E makes I say its name: "pine" vs "pin".',
    pattern: 'i_e',
    patternStart: 1,
    tier: 1,
    word: 'pine',
  },
  {
    category: 'silent-e',
    choices: ['"oh" as in go', '"o" as in hot', '"u" as in cup', '"aw" as in law'],
    correctSound: '"oh" as in go',
    explanation: 'Silent E makes O say its name: "hope" vs "hop".',
    pattern: 'o_e',
    patternStart: 1,
    tier: 1,
    word: 'hope',
  },
  {
    category: 'silent-e',
    choices: ['"yoo" as in use', '"u" as in cup', '"oo" as in pool', '"oh" as in go'],
    correctSound: '"yoo" as in use',
    explanation: 'Silent E makes U say its name: "cute" vs "cut".',
    pattern: 'u_e',
    patternStart: 1,
    tier: 1,
    word: 'cute',
  },
  // Exceptions
  {
    category: 'silent-e',
    choices: ['"ay" as in day', '"a" as in cat', '"u" as in cup', '"e" as in bed'],
    correctSound: '"a" as in cat',
    explanation: '"Have" breaks the silent E rule — A still sounds like "a" in "cat".',
    pattern: 'a_e',
    patternStart: 1,
    tier: 2,
    word: 'have',
  },
  {
    category: 'silent-e',
    choices: ['"oh" as in go', '"o" as in hot', '"u" as in cup', '"aw" as in law'],
    correctSound: '"u" as in cup',
    explanation: '"Love" breaks the silent E rule — O sounds like "u" in "cup".',
    pattern: 'o_e',
    patternStart: 1,
    tier: 2,
    word: 'love',
  },
  {
    category: 'silent-e',
    choices: ['"oh" as in go', '"o" as in hot', '"u" as in cup', '"aw" as in law'],
    correctSound: '"o" as in hot',
    explanation: '"Gone" breaks the silent E rule — O sounds like "o" in "hot".',
    pattern: 'o_e',
    patternStart: 1,
    tier: 3,
    word: 'gone',
  },
  {
    category: 'silent-e',
    choices: ['"eye" as in mine', '"i" as in sit', '"ee" as in feet', '"ay" as in day'],
    correctSound: '"i" as in sit',
    explanation: '"Give" breaks the silent E rule — I sounds like "i" in "sit".',
    pattern: 'i_e',
    patternStart: 1,
    tier: 2,
    word: 'give',
  },

  // === OUGH ===
  {
    category: 'ough',
    choices: [
      '"oh" as in go',
      '"oo" as in pool',
      '"uff" as in stuff',
      '"off" as in off',
      '"ow" as in ouch',
      '"aw" as in law',
    ],
    correctSound: '"oh" as in go',
    explanation: 'OUGH sounds like "oh" in "though" — one of six different pronunciations!',
    pattern: 'ough',
    patternStart: 2,
    tier: 2,
    word: 'though',
  },
  {
    category: 'ough',
    choices: [
      '"oh" as in go',
      '"oo" as in pool',
      '"uff" as in stuff',
      '"off" as in off',
      '"ow" as in ouch',
      '"aw" as in law',
    ],
    correctSound: '"oo" as in pool',
    explanation: 'OUGH sounds like "oo" in "through".',
    pattern: 'ough',
    patternStart: 3,
    tier: 2,
    word: 'through',
  },
  {
    category: 'ough',
    choices: [
      '"oh" as in go',
      '"oo" as in pool',
      '"uff" as in stuff',
      '"off" as in off',
      '"ow" as in ouch',
      '"aw" as in law',
    ],
    correctSound: '"uff" as in stuff',
    explanation: 'OUGH sounds like "uff" in "tough", "rough", "enough".',
    pattern: 'ough',
    patternStart: 1,
    tier: 2,
    word: 'tough',
  },
  {
    category: 'ough',
    choices: [
      '"oh" as in go',
      '"oo" as in pool',
      '"uff" as in stuff',
      '"off" as in off',
      '"ow" as in ouch',
      '"aw" as in law',
    ],
    correctSound: '"off" as in off',
    explanation: 'OUGH sounds like "off" in "cough" — different from "tough"!',
    pattern: 'ough',
    patternStart: 1,
    tier: 3,
    word: 'cough',
  },
  {
    category: 'ough',
    choices: [
      '"oh" as in go',
      '"oo" as in pool',
      '"uff" as in stuff',
      '"off" as in off',
      '"ow" as in ouch',
      '"aw" as in law',
    ],
    correctSound: '"ow" as in ouch',
    explanation: 'OUGH sounds like "ow" in "bough" and "plough".',
    pattern: 'ough',
    patternStart: 1,
    tier: 3,
    word: 'bough',
  },
  {
    category: 'ough',
    choices: [
      '"oh" as in go',
      '"oo" as in pool',
      '"uff" as in stuff',
      '"off" as in off',
      '"ow" as in ouch',
      '"aw" as in law',
    ],
    correctSound: '"aw" as in law',
    explanation: 'OUGH sounds like "aw" in "thought", "bought", "ought".',
    pattern: 'ough',
    patternStart: 2,
    tier: 2,
    word: 'thought',
  },

  // === Soft C/G ===
  // Soft C ("s" before e, i, y)
  {
    category: 'soft-cg',
    choices: ['"s" as in sit', '"k" as in kite', '"ch" as in chip', '"sh" as in ship'],
    correctSound: '"s" as in sit',
    explanation: 'C sounds like "s" before E, I, or Y: "city", "cent", "cycle".',
    pattern: 'c',
    patternStart: 0,
    tier: 1,
    word: 'city',
  },
  {
    category: 'soft-cg',
    choices: ['"s" as in sit', '"k" as in kite', '"ch" as in chip', '"sh" as in ship'],
    correctSound: '"s" as in sit',
    explanation: 'C before E sounds like "s": "cell" starts with an S sound.',
    pattern: 'c',
    patternStart: 0,
    tier: 1,
    word: 'cell',
  },
  // Hard C ("k")
  {
    category: 'soft-cg',
    choices: ['"s" as in sit', '"k" as in kite', '"ch" as in chip', '"sh" as in ship'],
    correctSound: '"k" as in kite',
    explanation: 'C sounds like "k" before A, O, U, or consonants: "cat", "cold", "cup".',
    pattern: 'c',
    patternStart: 0,
    tier: 1,
    word: 'cat',
  },
  // Soft G ("j" before e, i, y)
  {
    category: 'soft-cg',
    choices: ['"j" as in jump', '"g" as in go', '"zh" as in measure', '"h" as in hat'],
    correctSound: '"j" as in jump',
    explanation: 'G often sounds like "j" before E, I, or Y: "gem", "giant".',
    pattern: 'g',
    patternStart: 0,
    tier: 1,
    word: 'gem',
  },
  {
    category: 'soft-cg',
    choices: ['"j" as in jump', '"g" as in go', '"zh" as in measure', '"h" as in hat'],
    correctSound: '"j" as in jump',
    explanation: 'G before I usually sounds like "j": "giraffe" starts with a J sound.',
    pattern: 'g',
    patternStart: 0,
    tier: 2,
    word: 'giraffe',
  },
  // Hard G exceptions before e/i
  {
    category: 'soft-cg',
    choices: ['"j" as in jump', '"g" as in go', '"zh" as in measure', '"h" as in hat'],
    correctSound: '"g" as in go',
    explanation:
      '"Get" breaks the soft-G rule — G stays hard despite the E. Germanic words often do this.',
    pattern: 'g',
    patternStart: 0,
    tier: 2,
    word: 'get',
  },
  {
    category: 'soft-cg',
    choices: ['"j" as in jump', '"g" as in go', '"zh" as in measure', '"h" as in hat'],
    correctSound: '"g" as in go',
    explanation: '"Girl" keeps the hard G before I — another Germanic exception.',
    pattern: 'g',
    patternStart: 0,
    tier: 2,
    word: 'girl',
  },
  {
    category: 'soft-cg',
    choices: ['"j" as in jump', '"g" as in go', '"zh" as in measure', '"h" as in hat'],
    correctSound: '"g" as in go',
    explanation:
      '"Give" has a hard G despite the I. Old English words often resist the soft-G rule.',
    pattern: 'g',
    patternStart: 0,
    tier: 3,
    word: 'give',
  },

  // === -ED suffix ===
  {
    category: 'ed-suffix',
    choices: ['"t" sound', '"d" sound', '"id" (extra syllable)', '"ed" (rhymes with red)'],
    correctSound: '"t" sound',
    explanation: 'After voiceless sounds (k, p, s, etc.), -ED sounds like "t".',
    pattern: 'ed',
    patternStart: 4,
    tier: 1,
    word: 'walked',
  },
  {
    category: 'ed-suffix',
    choices: ['"t" sound', '"d" sound', '"id" (extra syllable)', '"ed" (rhymes with red)'],
    correctSound: '"d" sound',
    explanation: 'After voiced sounds (vowels, l, n, etc.), -ED sounds like "d".',
    pattern: 'ed',
    patternStart: 4,
    tier: 1,
    word: 'played',
  },
  {
    category: 'ed-suffix',
    choices: ['"t" sound', '"d" sound', '"id" (extra syllable)', '"ed" (rhymes with red)'],
    correctSound: '"id" (extra syllable)',
    explanation: 'After a T or D sound, -ED adds a whole extra syllable: "want-id".',
    pattern: 'ed',
    patternStart: 4,
    tier: 1,
    word: 'wanted',
  },
  {
    category: 'ed-suffix',
    choices: ['"t" sound', '"d" sound', '"id" (extra syllable)', '"ed" (rhymes with red)'],
    correctSound: '"t" sound',
    explanation: '"Laughed" ends in an F sound (voiceless), so -ED sounds like "t".',
    pattern: 'ed',
    patternStart: 5,
    tier: 2,
    word: 'laughed',
  },
  {
    category: 'ed-suffix',
    choices: ['"t" sound', '"d" sound', '"id" (extra syllable)', '"ed" (rhymes with red)'],
    correctSound: '"id" (extra syllable)',
    explanation: '"Land" ends in a D sound, so -ED adds a syllable: "land-id".',
    pattern: 'ed',
    patternStart: 4,
    tier: 2,
    word: 'landed',
  },
  {
    category: 'ed-suffix',
    choices: ['"t" sound', '"d" sound', '"id" (extra syllable)', '"ed" (rhymes with red)'],
    correctSound: '"d" sound',
    explanation: '"Love" ends in a voiced V sound, so -ED sounds like "d".',
    pattern: 'ed',
    patternStart: 3,
    tier: 2,
    word: 'loved',
  },

  // === OW (two sounds) ===
  {
    category: 'ow-vowel',
    choices: ['"ow" as in ouch', '"oh" as in go', '"oo" as in pool', '"aw" as in law'],
    correctSound: '"ow" as in ouch',
    explanation: 'OW sounds like "ow" in "cow", "how", "now".',
    pattern: 'ow',
    patternStart: 1,
    tier: 1,
    word: 'cow',
  },
  {
    category: 'ow-vowel',
    choices: ['"ow" as in ouch', '"oh" as in go', '"oo" as in pool', '"aw" as in law'],
    correctSound: '"oh" as in go',
    explanation: 'OW sounds like "oh" in "show", "know", "grow".',
    pattern: 'ow',
    patternStart: 2,
    tier: 1,
    word: 'show',
  },
  {
    category: 'ow-vowel',
    choices: ['"ow" as in ouch', '"oh" as in go', '"oo" as in pool', '"aw" as in law'],
    correctSound: '"ow" as in ouch',
    explanation: 'OW in "down" sounds like "ow" — no rule tells you which sound OW makes.',
    pattern: 'ow',
    patternStart: 1,
    tier: 2,
    word: 'down',
  },
  {
    category: 'ow-vowel',
    choices: ['"ow" as in ouch', '"oh" as in go', '"oo" as in pool', '"aw" as in law'],
    correctSound: '"oh" as in go',
    explanation:
      'OW in "own" sounds like "oh". Compare with "down" — same spelling, different sound.',
    pattern: 'ow',
    patternStart: 0,
    tier: 2,
    word: 'own',
  },
  {
    category: 'ow-vowel',
    choices: ['"ow" as in ouch', '"oh" as in go', '"oo" as in pool', '"aw" as in law'],
    correctSound: '"oh" as in go',
    explanation: 'OW in "bowl" sounds like "oh", but in "howl" it sounds like "ow"!',
    pattern: 'ow',
    patternStart: 1,
    tier: 3,
    word: 'bowl',
  },
  {
    category: 'ow-vowel',
    choices: ['"ow" as in ouch', '"oh" as in go', '"oo" as in pool', '"aw" as in law'],
    correctSound: '"ow" as in ouch',
    explanation: '"Fowl" has the "ow" sound — compare with "bowl" which has the "oh" sound.',
    pattern: 'ow',
    patternStart: 1,
    tier: 3,
    word: 'fowl',
  },

  // === OO (two sounds) ===
  {
    category: 'oo-vowel',
    choices: ['"oo" as in pool', '"oo" as in look', '"u" as in cup', '"oh" as in go'],
    correctSound: '"oo" as in pool',
    explanation: 'OO usually makes the long sound as in "food", "moon", "cool".',
    pattern: 'oo',
    patternStart: 1,
    tier: 1,
    word: 'food',
  },
  {
    category: 'oo-vowel',
    choices: ['"oo" as in pool', '"oo" as in look', '"u" as in cup', '"oh" as in go'],
    correctSound: '"oo" as in look',
    explanation: 'OO makes the short sound in "book", "look", "cook".',
    pattern: 'oo',
    patternStart: 1,
    tier: 1,
    word: 'book',
  },
  {
    category: 'oo-vowel',
    choices: ['"oo" as in pool', '"oo" as in look', '"u" as in cup', '"oh" as in go'],
    correctSound: '"oo" as in pool',
    explanation: 'OO in "moon" makes the long sound.',
    pattern: 'oo',
    patternStart: 1,
    tier: 1,
    word: 'moon',
  },
  {
    category: 'oo-vowel',
    choices: ['"oo" as in pool', '"oo" as in look', '"u" as in cup', '"oh" as in go'],
    correctSound: '"oo" as in look',
    explanation: 'OO in "good" is the short sound — compare with "food" which is long.',
    pattern: 'oo',
    patternStart: 1,
    tier: 2,
    word: 'good',
  },
  {
    category: 'oo-vowel',
    choices: ['"oo" as in pool', '"oo" as in look', '"u" as in cup', '"oh" as in go'],
    correctSound: '"u" as in cup',
    explanation: '"Flood" is even stranger — OO sounds like "u" in "cup"! Same with "blood".',
    pattern: 'oo',
    patternStart: 2,
    tier: 3,
    word: 'flood',
  },
  {
    category: 'oo-vowel',
    choices: ['"oo" as in pool', '"oo" as in look', '"u" as in cup', '"oh" as in go'],
    correctSound: '"u" as in cup',
    explanation: 'OO in "blood" sounds like "u" in "cup" — a third sound for the same spelling.',
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

  return [...t1.slice(0, t1Count), ...t2.slice(0, t2Count), ...t3.slice(0, t3Count)].map((q) => ({
    ...q,
    choices: shuffle([...q.choices], rng),
  }));
}
