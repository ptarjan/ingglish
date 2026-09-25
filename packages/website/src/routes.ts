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
      'The goals behind Ingglish, the limits it had to work within, how each candidate spelling was tested, and the phonetic spelling that resulted.',
    seoTitle: 'How Ingglish Was Designed: Goals, Constraints & Trade-offs',
    title: 'How It Was Designed',
  },
  {
    id: 'phoneme-mapping',
    seoDescription:
      'Every English phoneme in the CMU Pronouncing Dictionary, with its ARPABET code, IPA symbol, Ingglish spelling and example words.',
    seoTitle: 'English Phoneme Chart: All 39 Sounds in IPA and ARPABET',
    title: 'Phoneme Chart',
  },
  {
    id: 'orthography-comparison',
    seoDescription:
      'Sound by sound, how 37 languages write the vowels and consonants of English, from sh and th to ng, and how widely each Ingglish spelling is used.',
    seoTitle: 'How 37 Languages Spell English Sounds: sh, th, ch, ng & More',
    title: 'How Other Languages Spell It',
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
    title: 'Reforms Proposed Today',
  },
  {
    id: 'spelling-iteration',
    seoDescription:
      'Every change to how Ingglish spells a sound, in order, with its date and commit: what it replaced and why, and what was tried and not adopted.',
    seoTitle: 'Ingglish Spelling History: Every Change and Why',
    title: 'Spelling History',
  },
  {
    id: 'identical-words-analysis',
    seoDescription:
      '9,385 English words (7.45%) are already spelled the Ingglish way. A search of every sound against 70 spellings shows which changes would add more, and why each lost.',
    seoTitle: 'Testing Every Alternative Spelling for Each English Sound',
    title: 'Testing Every Alternative',
  },
  {
    id: 'metrics',
    seoDescription:
      'The yardsticks used to judge a phonetic spelling of English (text preserved, unambiguous text, pronounceability), how each is calculated, and where each misleads.',
    seoTitle: 'How to Score a Phonetic Spelling: Mapping Quality Metrics',
    title: 'How a Spelling Is Scored',
  },
  {
    id: 'vowel-spellings',
    seoDescription:
      'For every English vowel sound: the Ingglish spelling chosen, the alternatives measured and rejected, and how that spelling is used elsewhere.',
    seoTitle: 'How Ingglish Spells Every English Vowel Sound',
    title: 'Vowels, Sound by Sound',
  },
  {
    id: 'consonant-spellings',
    seoDescription:
      'For every English consonant sound: the letters Ingglish keeps, the ones it drops (c, q, x), the new spellings dh and zh, and how other languages write each sound.',
    seoTitle: 'How Ingglish Spells Every English Consonant',
    title: 'Consonants, Sound by Sound',
  },
  {
    id: 'false-friends',
    seoDescription:
      'Spelling by sound merges homophones like there and their. How Ingglish refuses spellings that merge different words, and which look like other English words.',
    seoTitle: 'Homophones, Collisions & False Friends in Phonetic Spelling',
    title: 'Homophones & False Friends',
  },
  {
    id: 'orthographic-transparency',
    seoDescription:
      'What makes a spelling system transparent, how linguists measure it, and how English and Ingglish compare with Finnish, Italian, German and French.',
    seoTitle: 'Orthographic Transparency: Why Some Languages Are Easy to Read',
    title: 'How Transparent Is It?',
  },
  {
    id: 'morphological-analysis',
    seoDescription:
      'Does phonetic spelling hide word roots? Which English word families still look related in Ingglish, which drift apart, and which become clearer.',
    seoTitle: 'Do English Word Roots Survive Phonetic Spelling?',
    title: 'Word Families',
  },
  {
    id: 'dialect-assumptions',
    seoDescription:
      'Phonetic spelling has to pick an accent. Why Ingglish uses General American, where British and other accents differ, and what that means for their speakers.',
    seoTitle: 'Which English Accent Should Phonetic Spelling Use?',
    title: 'Which Accent',
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
