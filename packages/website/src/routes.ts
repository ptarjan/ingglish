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
      'Every design decision behind the Ingglish phonetic alphabet — which sounds got which spellings, the trade-offs weighed, and the alternatives rejected.',
    seoTitle: 'How Ingglish Was Designed: Rules, Trade-offs & Rejected Ideas',
    title: 'Design Decisions',
  },
  {
    id: 'phoneme-mapping',
    seoDescription:
      'Complete table of English phonemes — vowels and consonants in IPA, ARPABET (CMU Pronouncing Dictionary) and Ingglish spelling, with example words for each.',
    seoTitle: 'English Phoneme Chart: All 44 Sounds in IPA and ARPABET',
    title: 'Phoneme Mapping',
  },
  {
    id: 'orthography-comparison',
    seoDescription:
      'English spelling measured against other writing systems. Why Spanish, Finnish and Korean are read exactly as written, and how far English has drifted.',
    seoTitle: 'How English Spelling Compares to Spanish, Finnish, Korean & More',
    title: 'Orthography Comparison',
  },
  {
    id: 'spelling-reform-comparison',
    seoDescription:
      'From Noah Webster and the Simplified Spelling Board to Shavian, Unifon and SoundSpel — a history of English spelling reform and what stopped each one.',
    seoTitle: 'English Spelling Reform: Every Major Attempt and Why It Failed',
    title: 'Spelling Reform History',
  },
  {
    id: 'community-landscape',
    seoDescription:
      'Who is still working on English spelling reform — the societies, forums and active projects, what each proposes, and where they disagree.',
    seoTitle: 'Spelling Reform Communities, Groups & Projects Today',
    title: 'Community Landscape',
  },
  {
    id: 'spelling-iteration',
    seoDescription:
      'A running log of every change to the Ingglish spelling rules, the problem each one solved, and the measured effect on the dictionary.',
    seoTitle: 'Ingglish Spelling Iteration Log: What Changed and Why',
    title: 'Spelling Iteration Log',
  },
  {
    id: 'identical-words-analysis',
    seoDescription:
      'Thousands of English words already follow their own sounds. An analysis of which words survive the switch to phonetic spelling unchanged, and what they share.',
    seoTitle: 'Which English Words Are Already Spelled Phonetically?',
    title: 'Identical Words Analysis',
  },
  {
    id: 'metrics',
    seoDescription:
      'How consistent is English spelling, quantified — sound-to-letter ambiguity, silent letters, and irregularity rates, measured across the whole dictionary.',
    seoTitle: 'Measuring English Spelling Consistency: The Numbers',
    title: 'Mapping Quality Metrics',
  },
  {
    id: 'false-friends',
    seoDescription:
      'Words spelled the same that sound different, and words spelled differently that sound the same. Where English spelling misleads readers most.',
    seoTitle: 'False Friends: English Words That Look Alike but Sound Different',
    title: 'False Friends Analysis',
  },
  {
    id: 'orthographic-transparency',
    seoDescription:
      'What makes a writing system transparent, how transparency is measured, and where English ranks against shallow orthographies like Spanish and Italian.',
    seoTitle: 'Orthographic Transparency: Why Some Languages Are Easy to Read',
    title: 'Orthographic Transparency',
  },
  {
    id: 'morphological-analysis',
    seoDescription:
      'Phonetic spelling is often accused of hiding word roots. An analysis of prefixes, suffixes and word families under Ingglish spelling, with the evidence.',
    seoTitle: 'Do English Word Roots Survive Phonetic Spelling?',
    title: 'Morphological Analysis',
  },
  {
    id: 'dialect-assumptions',
    seoDescription:
      'Phonetic spelling has to pick an accent. Why Ingglish uses General American, how British and other dialects differ, and what that costs.',
    seoTitle: 'Which English Accent Should Phonetic Spelling Use?',
    title: 'Dialect Assumptions',
  },
  // English Spelling
  {
    id: 'how-to-read-english',
    seoDescription:
      'Every rule for reading English aloud — what each letter and letter combination sounds like, when the rules hold, and the exceptions that break them.',
    seoTitle: 'English Pronunciation Rules: How Letters Turn Into Sounds',
    title: 'Reading: Letters to Sounds',
  },
  {
    id: 'how-to-spell-english',
    seoDescription:
      'How to spell each English sound — every letter combination that can write it, which to choose and when, and the patterns that make the choice predictable.',
    seoTitle: 'English Spelling Rules: How to Spell Every Sound',
    title: 'Writing: Sounds to Letters',
  },
  // Development
  {
    id: 'architecture',
    seoDescription:
      'How the Ingglish translator is built — dictionary lookup, phoneme mapping, and the fallback that handles words no dictionary has.',
    seoTitle: 'Ingglish Architecture: How the Translator Works',
    title: 'Architecture',
  },
  {
    id: 'api-reference',
    seoDescription:
      'API reference for the Ingglish translation packages — functions, options and types for converting English text to phonetic spelling and back.',
    seoTitle: 'Ingglish API Reference: Translate English to Phonetic Spelling',
    title: 'API Reference',
  },
  {
    id: 'performance',
    seoDescription:
      'Benchmarks and optimizations for the Ingglish translator — dictionary load time, per-word lookup cost, and how the bundle stays small.',
    seoTitle: 'Ingglish Performance: Translating at Dictionary Scale',
    title: 'Performance',
  },
  {
    id: 'deployment',
    seoDescription:
      'How Ingglish is built and deployed — the static site build, generated word pages, and the release pipeline.',
    seoTitle: 'Deploying Ingglish: Build and Release Process',
    title: 'Deployment',
  },
  {
    id: 'contributing',
    seoDescription:
      'How to contribute to Ingglish — local setup, running the tests, code conventions, and how to propose a change to the spelling rules.',
    seoTitle: 'Contributing to Ingglish: Setup, Tests & Conventions',
    title: 'Contributing',
  },
  {
    id: 'troubleshooting',
    seoDescription:
      'Fixes for common Ingglish problems — dictionary build failures, unexpected translations, and browser extension issues.',
    seoTitle: 'Ingglish Troubleshooting: Common Problems and Fixes',
    title: 'Troubleshooting',
  },
] as const;

export type DocId = (typeof DOC_ENTRIES)[number]['id'];
