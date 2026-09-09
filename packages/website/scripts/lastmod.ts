/**
 * <lastmod> dates for every sitemap the site emits.
 *
 * The date has to be true. Google discounts — and eventually ignores —
 * lastmod on a site that stamps every URL with the build time, which would
 * make this worse than emitting nothing. So no date here comes from the clock:
 * each one is the commit date of the source that actually decides that page's
 * content, read straight out of git.
 *
 * Considered and rejected: hashing each generated page and committing a
 * manifest of hash -> first-seen date. Measured over a real build of 48,804
 * word pages it costs 3.7s (fine) but 1.79 MB of committed, every-build churn
 * — over CI's 500 KB per-file limit, and the deploy job that would have to
 * write it back has no push rights. The generator's own commit already gives
 * the same date, because every word page is rebuilt from it as a batch.
 */
import { execFileSync } from 'node:child_process';

import { siteUrl } from '../src/routes';

/**
 * The date a page gets when git can give none — an uncommitted source file, a
 * generated doc, a checkout with no git at all. Fixed and in the past on
 * purpose: an under-stated date costs a slower recrawl, an over-stated one
 * teaches Google to ignore the whole file. Never `new Date()`.
 */
export const LASTMOD_FALLBACK = '2026-09-01';

/** Reads the newest commit date touching any of `paths`. Injectable for tests. */
export type GitDateReader = (paths: string[]) => string;

/**
 * `git log -1` over repo-root-relative paths (the `:/` pathspec resolves from
 * the top level, so the caller's cwd does not matter). Empty when git knows
 * nothing about them.
 */
export const readGitDate: GitDateReader = (paths) =>
  execFileSync('git', ['log', '-1', '--format=%cI', '--', ...paths.map((p) => `:/${p}`)], {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();

/** The newest of a set of W3C datetimes, compared as instants rather than strings. */
export function newestLastmod(dates: string[]): string {
  if (dates.length === 0) {
    return LASTMOD_FALLBACK;
  }
  return dates.reduce((a, b) => (Date.parse(b) > Date.parse(a) ? b : a));
}

/** The newest <lastmod> inside a rendered sitemap — what its index entry carries. */
export function newestLastmodIn(xml: string): string {
  return newestLastmod([...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]!));
}

/** W3C datetime for a page whose content comes from `paths`. */
export function lastmodFor(paths: string[], read: GitDateReader = readGitDate): string {
  try {
    return read(paths) || LASTMOD_FALLBACK;
  } catch {
    return LASTMOD_FALLBACK;
  }
}

/** Markdown source for each doc id, relative to docs/. */
export const DOC_FILE_MAP: Record<string, string> = {
  'how-to-read-english': 'english-spelling-rules.md',
  'how-to-spell-english': 'english-spelling-choices.md',
  'api-reference': 'generated/README.md',
};

/** Repo-root-relative markdown source behind /docs/<id>/. */
export function docSourcePath(docId: string): string {
  return `docs/${DOC_FILE_MAP[docId] ?? `${docId}.md`}`;
}

const SRC = 'packages/website/src';

/**
 * The component that renders each app route. Only the route's own component is
 * listed: the shared shell touches every page, so folding it in would collapse
 * all 41 dates onto one and throw away the signal.
 */
export const ROUTE_SOURCE: Record<string, string[]> = {
  '': [`${SRC}/components/Tutorial.tsx`, `${SRC}/components/tutorial`],
  challenge: [`${SRC}/routes-config.tsx`], // a redirect stub to /games/reading/
  docs: [`${SRC}/components/Docs.tsx`],
  experiment: [`${SRC}/components/Experiment.tsx`],
  explore: [`${SRC}/components/WordExplorer.tsx`, `${SRC}/components/word-explorer`],
  extension: [`${SRC}/components/Extension.tsx`],
  games: [`${SRC}/components/Games.tsx`, `${SRC}/components/games/GamesHub.tsx`],
  guide: [`${SRC}/components/SpellingGuide.tsx`],
  text: [`${SRC}/components/TextTranslator.tsx`],
  url: [`${SRC}/components/UrlTranslator.tsx`],
  ...Object.fromEntries(
    (
      [
        ['reading', 'ReadingChallenge'],
        ['homophones', 'HomophonesQuiz'],
        ['learn', 'LearnToRead'],
        ['daily', 'DailyChallenge'],
        ['speedmatch', 'SpeedMatch'],
        ['reverse', 'ReverseSpelling'],
        ['spelling-rules', 'SpellingRuleQuiz'],
        ['spell-that-sound', 'SpellThatSound'],
        ['rule-or-exception', 'RuleOrException'],
        ['pattern-sort', 'PatternSort'],
        ['origin-detective', 'OriginDetective'],
      ] as const
    ).map(([id, component]) => [`games/${id}`, [`${SRC}/components/games/${component}.tsx`]])
  ),
};

/** Every route's <title> and description live here, so it dates every app page. */
const ROUTE_META_SOURCE = `${SRC}/route-meta.ts`;

/**
 * Sources behind the generated word pages: the generator, the rhyme model it
 * groups its rhyme block on, and the packages whose output it embeds. Every
 * word page is rebuilt from all of them at once, so they honestly share one
 * date.
 */
export const WORD_PAGE_SOURCES = [
  'packages/website/scripts/build-word-pages.ts',
  'packages/website/scripts/rhymes.ts',
  'packages/core/src',
  'packages/dictionary/src',
  'packages/dictionary/scripts',
  'packages/phonemes/src',
  'packages/ipa/src',
  'packages/g2p/src',
];

/** The date every /word/, /words/ and /words/<letter>/ page carries. */
export function wordPagesLastmod(read: GitDateReader = readGitDate): string {
  return lastmodFor(WORD_PAGE_SOURCES, read);
}

/**
 * Sources behind the generated rhyme pages. build-rhyme-pages.ts is here and
 * deliberately absent from WORD_PAGE_SOURCES: retouching a rhyme table would
 * otherwise re-date 48,804 word pages whose HTML did not change, which is the
 * lastmod abuse this module exists to avoid.
 */
export const RHYME_PAGE_SOURCES = [
  'packages/website/scripts/build-rhyme-pages.ts',
  'packages/website/scripts/rhymes.ts',
  'packages/core/src',
  'packages/dictionary/src',
  'packages/dictionary/scripts',
  'packages/phonemes/src',
  'packages/ipa/src',
];

/** The date every /rhymes/ and /rhymes/<word>/ page carries. */
export function rhymePagesLastmod(read: GitDateReader = readGitDate): string {
  return lastmodFor(RHYME_PAGE_SOURCES, read);
}

/**
 * The date for one app or docs route. A doc is dated by its markdown alone, so
 * a page untouched since February keeps its February date instead of inheriting
 * the day its search snippet was retuned.
 */
export function lastmodForRoute(route: string, read: GitDateReader = readGitDate): string {
  if (route.startsWith('docs/')) {
    return lastmodFor([docSourcePath(route.slice('docs/'.length))], read);
  }
  return lastmodFor([...(ROUTE_SOURCE[route] ?? []), ROUTE_META_SOURCE], read);
}

/**
 * sitemap-pages.xml: the homepage, the app routes and the docs. No changefreq
 * or priority — Google ignores both, so they are pure noise.
 */
export function renderPagesSitemap(routes: readonly string[], read: GitDateReader = readGitDate) {
  const urls = routes
    .map(
      (r) =>
        `  <url>\n    <loc>${siteUrl(r)}</loc>\n` +
        `    <lastmod>${lastmodForRoute(r, read)}</lastmod>\n  </url>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
