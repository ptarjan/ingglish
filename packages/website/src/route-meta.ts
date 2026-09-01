// Build-time <head> metadata: the title and description written into each
// pre-rendered index.html by customizeHtml in vite.config.ts. Nothing in the
// app imports this file, so none of these strings reach the browser bundle.
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
      'Test how quickly you can read Ingglish! 10 rounds of progressively harder sentences with shareable results.',
    title: 'Ingglish Reading Challenge',
  },
  docs: {
    description:
      'Technical documentation for the Ingglish phonetic English project. Design decisions, architecture, and API reference.',
    title: 'Ingglish Documentation',
  },
  experiment: {
    description:
      'Create your own phonetic spelling system. Customize how each sound is written, test with sample text, and compare statistics against standard Ingglish.',
    title: 'Ingglish Experiment - Design Your Own Spelling',
  },
  explore: {
    description:
      'Look up any English word to see its phoneme-by-phoneme translation pipeline, IPA transcription, homophones, and frequency data.',
    title: 'Ingglish Word Explorer',
  },
  extension: {
    description:
      'Translate any webpage to phonetic English with one click. Drag the bookmarklet to your bookmarks bar or install the Chrome extension.',
    title: 'Ingglish Bookmarklet & Extension',
  },
  games: {
    description:
      'Eleven free browser games for reading Ingglish and understanding English spelling. Wordle, speed matching, quizzes and eight guided lessons.',
    title: 'Ingglish Games',
  },
  'games/daily': {
    description:
      'Guess the five-letter Ingglish word in six tries. A new word every day at midnight UTC, the same one for everyone, with shareable colored squares.',
    title: 'Ingglish Wordle: Daily Phonetic Word Puzzle',
  },
  'games/homophones': {
    description:
      'Can you tell which English word an Ingglish spelling represents? Test your knowledge of homophones and phonetic spelling.',
    title: 'Ingglish Homophones Quiz',
  },
  'games/learn': {
    description:
      '8 progressive lessons teaching you to read phonetic English. From unchanged words to full sentences.',
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
      'Test how quickly you can read Ingglish! 10 rounds of progressively harder sentences with shareable results.',
    title: 'Ingglish Reading Challenge',
  },
  'games/reverse': {
    description:
      'See an English word and type how it looks in Ingglish. Tests your knowledge of phonetic spelling rules.',
    title: 'Ingglish Reverse Spelling',
  },
  'games/rule-or-exception': {
    description:
      'Silent E, soft C, double consonants: you get an English spelling rule and one word, and decide whether the word follows the rule or breaks it.',
    title: 'Rule or Exception? Test English Spelling Rules',
  },
  'games/speedmatch': {
    description:
      'Match Ingglish words to their English translations as fast as you can. Race the clock across 3 rounds.',
    title: 'Ingglish Speed Match',
  },
  'games/spell-that-sound': {
    description:
      'English writes most sounds several ways. See a sound and a word with a blank, then choose the spelling that belongs in it. 10 rounds, explained.',
    title: 'Spell That Sound: Which Spelling Fits This Word?',
  },
  'games/spelling-rules': {
    description:
      'A letter pattern is highlighted in an English word — pick the sound it makes there. 10 questions, each with the rule behind the answer explained.',
    title: 'English Spelling Rule Quiz: Which Sound Is That?',
  },
  guide: {
    description:
      'Complete guide to the Ingglish phonetic alphabet. See how every English sound maps to a consistent spelling.',
    title: 'Ingglish Spelling Guide',
  },
  text: {
    description:
      'Translate any English text to phonetic spelling instantly. See how words look when every spelling always makes the same sound.',
    title: 'Ingglish Text Translator',
  },
  url: {
    description:
      'Paste any URL and read the page in phonetic English. Every spelling always makes the same sound.',
    title: 'Ingglish URL Translator',
  },
};
