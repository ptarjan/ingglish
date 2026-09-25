// Page descriptions, the one source for both copies of each: the <head> that
// customizeHtml in vite.config.ts writes into each pre-rendered index.html, and
// the <meta name="description"> AppLayout renders at runtime. The titles here
// are build-time only; AppLayout sets its own shorter runtime titles.
//
// A route missing from ROUTE_META keeps the shell's homepage title AND the
// shell's canonical, which points at "/" — Google reads that as "this page is
// the homepage" and drops it. crawlable-urls.test.ts asserts every route in
// ALL_ROUTES has an entry here, so that cannot ship again.

import { DOC_ENTRIES, GAME_ENTRIES, TOP_LEVEL_ROUTES } from './routes';

export interface RouteMeta {
  description: string;
  title: string;
}

/** The homepage keeps index.html's own <head>; static-examples.test.ts checks it matches. */
export const HOME_META: RouteMeta = {
  description:
    'What if English spelling made sense? Ingglish respells English phonetically, so each spelling always stands for the same sound.',
  title: 'Ingglish - Phonetic English Spelling',
};

/** Every route that gets its own index.html in dist/. */
export const ALL_ROUTES = [
  ...TOP_LEVEL_ROUTES,
  // Backward compat: /challenge redirects to /games/reading
  'challenge',
  ...GAME_ENTRIES.map((e) => `games/${e.id}`),
  ...DOC_ENTRIES.map((e) => `docs/${e.id}`),
];

export const ROUTE_META: Record<string, RouteMeta> = {
  challenge: {
    description:
      'How fast can you read Ingglish? 10 rounds of sentences that get harder as you go, with results you can share.',
    title: 'Ingglish Reading Challenge',
  },
  docs: {
    description:
      'How the Ingglish phonetic English project works: its design decisions, its architecture and its API reference.',
    title: 'Ingglish Documentation',
  },
  experiment: {
    description:
      'Design your own phonetic spelling system. Choose how each sound is written, try it on sample text, and compare its statistics with standard Ingglish.',
    title: 'Ingglish Experiment - Design Your Own Spelling',
  },
  explore: {
    description:
      'Look up any English word: see how it becomes Ingglish sound by sound, its IPA pronunciation, words that sound the same, and how common it is.',
    title: 'Ingglish Word Explorer',
  },
  extension: {
    description:
      'Translate any webpage into phonetic English with one click. Drag the bookmarklet to your bookmarks bar, or install the Chrome extension.',
    title: 'Ingglish Bookmarklet & Extension',
  },
  games: {
    description:
      'Eleven free browser games for learning to read Ingglish and making sense of English spelling: Wordle, speed matching, quizzes and eight guided lessons.',
    title: 'Ingglish Games',
  },
  'games/daily': {
    description:
      'Guess the five-letter Ingglish word in six tries. A new word every day at midnight UTC, the same one for everyone, with shareable colored squares.',
    title: 'Ingglish Wordle: Daily Phonetic Word Puzzle',
  },
  'games/homophones': {
    description:
      'See an Ingglish spelling and work out which English word it stands for. A quiz on homophones (words that sound alike) and phonetic spelling.',
    title: 'Ingglish Homophones Quiz',
  },
  'games/learn': {
    description:
      'Eight lessons that teach you to read phonetic English step by step, starting with words that stay the same and ending with full sentences.',
    title: 'Learn to Read Ingglish',
  },
  'games/origin-detective': {
    description:
      'Germanic, French, Latin or Greek? Odd English spellings are borrowed ones. Use the spelling as your clue across 10 words, each with its etymology.',
    title: "Origin Detective: Guess a Word's Language of Origin",
  },
  'games/pattern-sort': {
    description:
      'EA, OW, OO and OU each have two pronunciations. Sort 24 English words into the right sound bucket and find out which pattern keeps fooling you.',
    title: 'Pattern Sort: How Do EA, OW, OO and OU Sound?',
  },
  'games/reading': {
    description:
      'How fast can you read Ingglish? 10 rounds of sentences that get harder as you go, with results you can share.',
    title: 'Ingglish Reading Challenge',
  },
  'games/reverse': {
    description:
      'See an English word and type its Ingglish spelling. Tests how well you know the Ingglish spelling rules, with half credit for near misses.',
    title: 'Ingglish Reverse Spelling',
  },
  'games/rule-or-exception': {
    description:
      'Silent E, soft C, double consonants: you get an English spelling rule and one word, and decide whether the word follows the rule or breaks it.',
    title: 'Rule or Exception? Test English Spelling Rules',
  },
  'games/speedmatch': {
    description:
      'Match Ingglish words to their English translations as fast as you can, racing the clock across 3 rounds.',
    title: 'Ingglish Speed Match',
  },
  'games/spell-that-sound': {
    description:
      'English writes most sounds several ways. See a sound and a word with a blank, then pick the spelling that fills it. 10 rounds, each one explained.',
    title: 'Spell That Sound: Which Spelling Fits This Word?',
  },
  'games/spelling-rules': {
    description:
      'One letter pattern in an English word is highlighted. Pick the sound it makes in that word. 10 questions, each answer explained by its rule.',
    title: 'English Spelling Rule Quiz: Which Sound Is That?',
  },
  guide: {
    description:
      'The complete guide to the Ingglish phonetic alphabet: every English sound and the one spelling Ingglish always uses for it.',
    title: 'Ingglish Spelling Guide',
  },
  text: {
    description:
      'Translate any English text into phonetic spelling instantly, and see how words look when each spelling always makes the same sound.',
    title: 'Ingglish Text Translator',
  },
  url: {
    description:
      'Paste any URL and read the page in phonetic English, where each spelling always makes the same sound.',
    title: 'Ingglish URL Translator',
  },
};
