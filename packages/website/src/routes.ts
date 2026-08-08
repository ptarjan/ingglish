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

export const DOC_ENTRIES = [
  // Ingglish Design
  { id: 'design-decisions', title: 'Design Decisions' },
  { id: 'phoneme-mapping', title: 'Phoneme Mapping' },
  { id: 'orthography-comparison', title: 'Orthography Comparison' },
  { id: 'spelling-reform-comparison', title: 'Spelling Reform History' },
  { id: 'community-landscape', title: 'Community Landscape' },
  { id: 'spelling-iteration', title: 'Spelling Iteration Log' },
  { id: 'identical-words-analysis', title: 'Identical Words Analysis' },
  { id: 'metrics', title: 'Mapping Quality Metrics' },
  { id: 'false-friends', title: 'False Friends Analysis' },
  { id: 'orthographic-transparency', title: 'Orthographic Transparency' },
  { id: 'morphological-analysis', title: 'Morphological Analysis' },
  { id: 'dialect-assumptions', title: 'Dialect Assumptions' },
  // English Spelling
  { id: 'how-to-read-english', title: 'Reading: Letters to Sounds' },
  { id: 'how-to-spell-english', title: 'Writing: Sounds to Letters' },
  // Development
  { id: 'architecture', title: 'Architecture' },
  { id: 'api-reference', title: 'API Reference' },
  { id: 'performance', title: 'Performance' },
  { id: 'deployment', title: 'Deployment' },
  { id: 'contributing', title: 'Contributing' },
  { id: 'troubleshooting', title: 'Troubleshooting' },
] as const;

export type DocId = (typeof DOC_ENTRIES)[number]['id'];
