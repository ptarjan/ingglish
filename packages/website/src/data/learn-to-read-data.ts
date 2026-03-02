/**
 * Learn-to-Read lesson data.
 *
 * 8 progressive lessons, each teaching one Ingglish rule.
 * Quiz words are [ingglish, english] pairs for typed input.
 */

export interface Lesson {
  description: string;
  examples: { english: string; ingglish: string }[];
  explanation: string;
  id: number;
  quiz: { english: string; ingglish: string }[];
  title: string;
}

export const LESSONS: Lesson[] = [
  {
    description: 'Many common words stay the same in Ingglish.',
    examples: [
      { english: 'and', ingglish: 'and' },
      { english: 'in', ingglish: 'in' },
      { english: 'not', ingglish: 'not' },
      { english: 'run', ingglish: 'run' },
      { english: 'big', ingglish: 'big' },
    ],
    explanation:
      'Lots of English words already have phonetic spellings — they sound exactly like they look. These stay the same in Ingglish.',
    id: 1,
    quiz: [
      { english: 'and', ingglish: 'and' },
      { english: 'not', ingglish: 'not' },
      { english: 'run', ingglish: 'run' },
      { english: 'hot', ingglish: 'hot' },
      { english: 'big', ingglish: 'big' },
    ],
    title: 'Unchanged Words',
  },
  {
    description: "Ingglish drops letters you don't pronounce.",
    examples: [
      { english: 'knee', ingglish: 'nee' },
      { english: 'wrap', ingglish: 'rap' },
      { english: 'lamb', ingglish: 'lam' },
      { english: 'knight', ingglish: 'nait' },
      { english: 'could', ingglish: 'kud' },
    ],
    explanation:
      'English has many silent letters — the K in "knee", the W in "wrap", the B in "lamb". Ingglish removes them so every letter you see is pronounced.',
    id: 2,
    quiz: [
      { english: 'knee', ingglish: 'nee' },
      { english: 'knight', ingglish: 'nait' },
      { english: 'lamb', ingglish: 'lam' },
      { english: 'wrap', ingglish: 'rap' },
      { english: 'write', ingglish: 'rait' },
    ],
    title: 'Silent Letters',
  },
  {
    description: '"ee" always says /ee/, "ay" always says /ay/.',
    examples: [
      { english: 'sea', ingglish: 'see' },
      { english: 'key', ingglish: 'kee' },
      { english: 'field', ingglish: 'feeld' },
      { english: 'weigh', ingglish: 'way' },
      { english: 'steak', ingglish: 'stayk' },
    ],
    explanation:
      'In English, the "ee" sound can be spelled ea, ey, ie, e, ee, and more. Ingglish always uses "ee" for the /ee/ sound and "ay" for the /ay/ sound.',
    id: 3,
    quiz: [
      { english: 'sea', ingglish: 'see' },
      { english: 'key', ingglish: 'kee' },
      { english: 'great', ingglish: 'grayt' },
      { english: 'day', ingglish: 'day' },
      { english: 'me', ingglish: 'mee' },
    ],
    title: 'Vowel Consistency',
  },
  {
    description: '"ph" is just "f" — phone becomes fohn.',
    examples: [
      { english: 'phone', ingglish: 'fohn' },
      { english: 'photo', ingglish: 'fohtoh' },
      { english: 'pharmacy', ingglish: 'farmasee' },
      { english: 'alphabet', ingglish: 'alfabet' },
      { english: 'elephant', ingglish: 'elafant' },
    ],
    explanation:
      'The "ph" digraph came from Greek. It always makes the /f/ sound, so Ingglish just writes "f".',
    id: 4,
    quiz: [
      { english: 'phone', ingglish: 'fohn' },
      { english: 'photo', ingglish: 'fohtoh' },
      { english: 'alphabet', ingglish: 'alfabet' },
      { english: 'elephant', ingglish: 'elafant' },
      { english: 'graph', ingglish: 'graf' },
    ],
    title: 'ph becomes f',
  },
  {
    description: '"c" picks a lane: "k" before a/o/u, "s" before e/i.',
    examples: [
      { english: 'cat', ingglish: 'kat' },
      { english: 'city', ingglish: 'sitee' },
      { english: 'cool', ingglish: 'kool' },
      { english: 'cell', ingglish: 'sel' },
      { english: 'cut', ingglish: 'kuht' },
    ],
    explanation:
      'The letter C makes two different sounds: /k/ (as in "cat") and /s/ (as in "city"). Ingglish spells them differently so you always know which sound to make.',
    id: 5,
    quiz: [
      { english: 'cat', ingglish: 'kat' },
      { english: 'city', ingglish: 'sitee' },
      { english: 'cup', ingglish: 'kuhp' },
      { english: 'race', ingglish: 'rays' },
      { english: 'cake', ingglish: 'kayk' },
    ],
    title: 'c becomes k or s',
  },
  {
    description: '-ight becomes -ait, -tion becomes -shan.',
    examples: [
      { english: 'night', ingglish: 'nait' },
      { english: 'light', ingglish: 'lait' },
      { english: 'fight', ingglish: 'fait' },
      { english: 'nation', ingglish: 'nayshan' },
      { english: 'action', ingglish: 'akshan' },
    ],
    explanation:
      'English has many spelling patterns that hide their pronunciation. Ingglish rewrites them phonetically: "-ight" becomes "-ait" and "-tion" becomes "-shan".',
    id: 6,
    quiz: [
      { english: 'night', ingglish: 'nait' },
      { english: 'flight', ingglish: 'flait' },
      { english: 'nation', ingglish: 'nayshan' },
      { english: 'right', ingglish: 'rait' },
      { english: 'station', ingglish: 'stayshan' },
    ],
    title: 'Common Patterns',
  },
  {
    description: '"th" is voiceless (think), "dh" is voiced (the).',
    examples: [
      { english: 'think', ingglish: 'thingk' },
      { english: 'thought', ingglish: 'thawt' },
      { english: 'the', ingglish: 'dha' },
      { english: 'this', ingglish: 'dhis' },
      { english: 'mother', ingglish: 'muhdher' },
    ],
    explanation:
      'English uses "th" for two different sounds. The voiceless /th/ in "think" stays as "th". The voiced /th/ in "the" becomes "dh" so you can tell them apart.',
    id: 7,
    quiz: [
      { english: 'think', ingglish: 'thingk' },
      { english: 'the', ingglish: 'dha' },
      { english: 'that', ingglish: 'dhat' },
      { english: 'both', ingglish: 'bohth' },
      { english: 'other', ingglish: 'uhdher' },
    ],
    title: 'th vs dh',
  },
  {
    description: 'Put it all together — read full Ingglish sentences.',
    examples: [
      { english: 'The cat sat on the mat.', ingglish: 'Dha kat sat on dha mat.' },
      { english: 'I like to run.', ingglish: 'Ai laik too run.' },
      { english: 'She has a big red dog.', ingglish: 'Shee haz a big red dog.' },
    ],
    explanation:
      'Now you know all the rules! Read these Ingglish sentences and type what they say in English. Use everything you have learned.',
    id: 8,
    quiz: [
      { english: 'cat', ingglish: 'kat' },
      { english: 'night', ingglish: 'nait' },
      { english: 'phone', ingglish: 'fohn' },
      { english: 'the', ingglish: 'dha' },
      { english: 'sea', ingglish: 'see' },
    ],
    title: 'Full Sentences',
  },
];
