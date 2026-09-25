// Single source of truth for routes and doc IDs.
// Shared between vite.config.ts (build-time HTML generation, sitemap) and the app (Docs.tsx).

export const SITE = 'https://ingglish.com';

// GitHub Pages serves every route as <route>/index.html and 301-redirects the
// slash-less form, so any URL we hand a crawler — canonical, og:url, sitemap
// entry, internal link — has to carry the trailing slash or Google indexes a
// redirect instead of the page. Query strings keep the slash on the path:
// /text/?text=cat.
export function sitePath(route: string): string {
  const path = route.startsWith('/') ? route : `/${route}`;
  const queryAt = path.indexOf('?');
  const pathname = queryAt === -1 ? path : path.slice(0, queryAt);
  const query = queryAt === -1 ? '' : path.slice(queryAt);
  return `${pathname.endsWith('/') ? pathname : `${pathname}/`}${query}`;
}

/** Absolute crawlable URL for a route — `guide` → `https://ingglish.com/guide/`. */
export function siteUrl(route: string): string {
  return `${SITE}${sitePath(route)}`;
}

export const TOP_LEVEL_ROUTES = [
  'text',
  'url',
  'guide',
  'extension',
  'explore',
  'experiment',
  'games',
  'docs',
] as const;

export const GAME_ENTRIES = [
  { id: 'reading', title: 'Reading Challenge' },
  { id: 'homophones', title: 'Homophones Quiz' },
  { id: 'learn', title: 'Learn to Read' },
  { id: 'daily', title: 'Daily Challenge' },
  { id: 'speedmatch', title: 'Speed Match' },
  { id: 'reverse', title: 'Reverse Spelling' },
  { id: 'spelling-rules', title: 'Spelling Rule Quiz' },
  { id: 'spell-that-sound', title: 'Spell That Sound' },
  { id: 'rule-or-exception', title: 'Rule or Exception?' },
  { id: 'pattern-sort', title: 'Pattern Sort' },
  { id: 'origin-detective', title: 'Origin Detective' },
] as const;

export type GameId = (typeof GAME_ENTRIES)[number]['id'];

// `title` is the sidebar label — short, and read in a context that already says
// "Ingglish docs". `seoTitle`/`seoDescription` are what a stranger sees in a
// search result, where none of that context exists. They were split because the
// docs rank respectably (phoneme-mapping sits at position ~8 on 266 impressions)
// and then convert at almost nothing: a page titled "Phoneme Mapping | Ingglish
// Docs" earns no click from someone searching for an ARPABET phoneme set. Say
// what the page contains, in the words people search for.
export const DOC_ENTRIES = [
  // Ingglish Design
  {
    id: 'design-decisions',
    seoDescription:
      'Why each Ingglish spelling was chosen: the sound it writes, the trade-offs weighed, and the alternatives that were tried and rejected.',
    seoTitle: 'How Ingglish Was Designed: Rules, Trade-offs & Rejected Ideas',
    title: 'Design Decisions',
  },
  {
    id: 'phoneme-mapping',
    seoDescription:
      'Every English phoneme in the CMU Pronouncing Dictionary, with its ARPABET code, IPA symbol, Ingglish spelling and example words.',
    seoTitle: 'English Phoneme Chart: All 39 Sounds in IPA and ARPABET',
    title: 'Phoneme Mapping',
  },
  {
    id: 'orthography-comparison',
    seoDescription:
      'Sound by sound, how 37 languages write the vowels and consonants of English, from sh and th to ng, and how widely each Ingglish spelling is used.',
    seoTitle: 'How 37 Languages Spell English Sounds: sh, th, ch, ng & More',
    title: 'Orthography Comparison',
  },
  {
    id: 'spelling-reform-comparison',
    seoDescription:
      'From Benjamin Franklin and Noah Webster to Shavian, Unifon and SoundSpel: a history of English spelling reform, why most attempts failed, and what worked.',
    seoTitle: 'English Spelling Reform: Every Major Attempt and Why It Failed',
    title: 'Spelling Reform History',
  },
  {
    id: 'community-landscape',
    seoDescription:
      'A survey of about 54 English spelling reforms posted to r/conorthography: where they agree, where they split, and the criticism every reform draws.',
    seoTitle: 'English Spelling Reform Proposals Today: A Survey',
    title: 'Community Landscape',
  },
  {
    id: 'spelling-iteration',
    seoDescription:
      'A log of every change to the Ingglish spelling rules: what was tried, the problem each change solved, and its measured effect on the dictionary.',
    seoTitle: 'Ingglish Spelling Iteration Log: What Changed and Why',
    title: 'Spelling Iteration Log',
  },
  {
    id: 'identical-words-analysis',
    seoDescription:
      "Over 10,000 English words are already spelled the way Ingglish spells them. Which words they are, and why Ingglish doesn't try to push that number higher.",
    seoTitle: 'Which English Words Are Already Spelled Phonetically?',
    title: 'Identical Words Analysis',
  },
  {
    id: 'metrics',
    seoDescription:
      'The metrics used to judge a phonetic spelling of English (text preserved, unambiguous text, pronounceability) and why surface-level metrics fall short.',
    seoTitle: 'How to Score a Phonetic Spelling: Mapping Quality Metrics',
    title: 'Mapping Quality Metrics',
  },
  {
    id: 'false-friends',
    seoDescription:
      'Some Ingglish spellings happen to match a different English word. A list of these false friends, how common they are, and why they cause no ambiguity.',
    seoTitle: 'Ingglish False Friends: Spellings That Match Other English Words',
    title: 'False Friends Analysis',
  },
  {
    id: 'orthographic-transparency',
    seoDescription:
      'What makes a spelling system transparent, how linguists measure it, and how English and Ingglish compare with Finnish, Italian, German and French.',
    seoTitle: 'Orthographic Transparency: Why Some Languages Are Easy to Read',
    title: 'Orthographic Transparency',
  },
  {
    id: 'morphological-analysis',
    seoDescription:
      'Does phonetic spelling hide word roots? Which English word families still look related in Ingglish, which drift apart, and which become clearer.',
    seoTitle: 'Do English Word Roots Survive Phonetic Spelling?',
    title: 'Morphological Analysis',
  },
  {
    id: 'dialect-assumptions',
    seoDescription:
      'Phonetic spelling has to pick an accent. Why Ingglish uses General American, where British and other accents differ, and what that means for their speakers.',
    seoTitle: 'Which English Accent Should Phonetic Spelling Use?',
    title: 'Dialect Assumptions',
  },
  // English Spelling
  {
    id: 'how-to-read-english',
    seoDescription:
      'The rules for reading English aloud: what each letter and letter combination sounds like, ranked by how many words they cover, with the exceptions.',
    seoTitle: 'English Pronunciation Rules: How Letters Turn Into Sounds',
    title: 'Reading: Letters to Sounds',
  },
  {
    id: 'how-to-spell-english',
    seoDescription:
      'How to spell each English sound: every letter pattern that can write it, which one to choose and when, and the most common spelling mistakes.',
    seoTitle: 'English Spelling Rules: How to Spell Every Sound',
    title: 'Writing: Sounds to Letters',
  },
  // Development
  {
    id: 'architecture',
    seoDescription:
      'How the Ingglish translator is built: the packages, dictionary lookup, phoneme mapping, and the rule-based fallback for words the dictionary lacks.',
    seoTitle: 'Ingglish Architecture: How the Translator Works',
    title: 'Architecture',
  },
  {
    id: 'api-reference',
    seoDescription:
      'API reference for the Ingglish packages: the functions, options and types for converting English text to phonetic spelling and back.',
    seoTitle: 'Ingglish API Reference: Translate English to Phonetic Spelling',
    title: 'API Reference',
  },
  {
    id: 'performance',
    seoDescription:
      'How fast the Ingglish translator is: benchmarks, profiling scripts, the complexity of each code path, and how the dictionary bundle is split.',
    seoTitle: 'Ingglish Performance: Benchmarks, Profiling & Bundle Size',
    title: 'Performance',
  },
  {
    id: 'deployment',
    seoDescription:
      'How to deploy Ingglish: the website on GitHub Pages, the Chrome extension (local and Web Store), and the Cloudflare Worker CORS proxy.',
    seoTitle: 'Deploying Ingglish: Website, Chrome Extension & CORS Proxy',
    title: 'Deployment',
  },
  {
    id: 'contributing',
    seoDescription:
      'How to contribute to Ingglish: local setup, build and test commands, debugging scripts, commit message format and the pull request process.',
    seoTitle: 'Contributing to Ingglish: Setup, Tests & Pull Requests',
    title: 'Contributing',
  },
  {
    id: 'troubleshooting',
    seoDescription:
      "Fixes for common Ingglish problems: build and type errors, a dictionary that won't load, extension issues, and words that change on a round trip to Ingglish.",
    seoTitle: 'Ingglish Troubleshooting: Common Problems and Fixes',
    title: 'Troubleshooting',
  },
] as const;

export type DocId = (typeof DOC_ENTRIES)[number]['id'];
