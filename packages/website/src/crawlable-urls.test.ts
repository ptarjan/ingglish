import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { sitePath, SITE, siteUrl } from './routes';

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
