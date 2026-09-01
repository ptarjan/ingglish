import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ALL_ROUTES, ROUTE_META } from './route-meta';
import { DOC_ENTRIES, sitePath, SITE, siteUrl } from './routes';

describe('sitePath', () => {
  it.each([
    ['guide', '/guide/'],
    ['/guide', '/guide/'],
    ['/guide/', '/guide/'],
    ['', '/'],
    ['/', '/'],
    ['docs/architecture', '/docs/architecture/'],
    ['/text?text=cat', '/text/?text=cat'],
    ['/text/?text=cat', '/text/?text=cat'],
  ])('%s -> %s', (route, expected) => {
    expect(sitePath(route)).toBe(expected);
  });
});

describe('siteUrl', () => {
  it.each([
    ['', `${SITE}/`],
    ['guide', `${SITE}/guide/`],
    ['/docs/architecture', `${SITE}/docs/architecture/`],
  ])('%s -> %s', (route, expected) => {
    expect(siteUrl(route)).toBe(expected);
  });
});

// GitHub Pages 301-redirects any directory URL missing its trailing slash, so a
// slash-less internal link costs a redirect hop and — when it is a canonical —
// makes Search Console file the page under "Page with redirect" instead of
// indexing it. Ban the literal form at the source rather than re-discovering it
// in Search Console three months later.
const SOURCE_DIRS = ['src', 'scripts'];
const SKIP_FILES = new Set(['crawlable-urls.test.ts']);

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(full));
    } else if (/\.tsx?$/.test(entry) && !SKIP_FILES.has(entry)) {
      out.push(full);
    }
  }
  return out;
}

// Matches href="/text" / to="/games/reading" / 'https://ingglish.com/guide' —
// an internal path of at least one segment that does not end in a slash and is
// not a file (no extension) or fragment.
const SLASHLESS_LINK =
  /(?:href|to)=["'](\/[a-z][\w-]*(?:\/[\w-]+)*)["']|https:\/\/ingglish\.com(\/[a-z][\w-]*(?:\/[\w-]+)*)["'`]/g;

describe('internal links are crawlable', () => {
  const files = SOURCE_DIRS.flatMap((d) => sourceFiles(path.join(__dirname, '..', d)));

  it('finds source files to check', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it.each(files)('%s has no slash-less internal links', (file) => {
    const contents = readFileSync(file, 'utf8');
    const offenders = [...contents.matchAll(SLASHLESS_LINK)]
      .map((m) => m[1] ?? m[2])
      .filter((path) => path !== undefined && !/\.[a-z0-9]+$/i.test(path));
    expect(offenders).toEqual([]);
  });
});

// Search Console recorded 1064 impressions at average position ~10 with zero
// clicks, because every one of these pages was titled for the project rather
// than for the person searching. Pin the shape so it cannot drift back: no doc
// may be published under the generic "| Ingglish Docs" label, and none may
// reuse the boilerplate description that made all twenty look identical.
describe('doc pages have search-facing metadata', () => {
  it.each(DOC_ENTRIES.map((d) => [d.id, d] as const))('%s', (_id, doc) => {
    expect(doc.seoTitle).not.toMatch(/\| Ingglish Docs$/);
    expect(doc.seoDescription).not.toMatch(/^Ingglish documentation —/);
    // Google truncates titles around 60 characters and descriptions around 160.
    expect(doc.seoTitle.length).toBeLessThanOrEqual(65);
    expect(doc.seoDescription.length).toBeGreaterThanOrEqual(80);
    expect(doc.seoDescription.length).toBeLessThanOrEqual(165);
  });

  it('every title is distinct', () => {
    const titles = DOC_ENTRIES.map((d) => d.seoTitle);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

// customizeHtml returns the page untouched when ROUTE_META has no entry for it,
// which leaves the shell's homepage <title> and — worse — the shell's canonical
// pointing at "/". Five game routes shipped that way and could never have been
// indexed under their own URL, however good the page was.
describe('every pre-rendered route has its own head metadata', () => {
  // Doc pages get theirs from DOC_ENTRIES, asserted above.
  const routes = ALL_ROUTES.filter((r) => !r.startsWith('docs/'));

  it.each(routes)('%s', (route) => {
    const meta = ROUTE_META[route];
    expect(meta).toBeDefined();
    // Google truncates titles around 60 characters and descriptions around 160.
    expect(meta?.title.length).toBeLessThanOrEqual(65);
    expect(meta?.description.length).toBeGreaterThanOrEqual(80);
    expect(meta?.description.length).toBeLessThanOrEqual(165);
  });

  it('every title is distinct', () => {
    // /challenge is the old URL of /games/reading and deliberately matches it.
    const titles = routes.filter((r) => r !== 'challenge').map((r) => ROUTE_META[r]?.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});
