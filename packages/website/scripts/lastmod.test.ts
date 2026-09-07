import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ALL_ROUTES } from '../src/route-meta';
import { DOC_ENTRIES, SITE } from '../src/routes';
import {
  DOC_FILE_MAP,
  LASTMOD_FALLBACK,
  ROUTE_SOURCE,
  docSourcePath,
  lastmodFor,
  lastmodForRoute,
  newestLastmod,
  newestLastmodIn,
  readGitDate,
  renderPagesSitemap,
  WORD_PAGE_SOURCES,
  wordPagesLastmod,
} from './lastmod';

const REPO_ROOT = join(import.meta.dirname, '..', '..', '..');

/** A CI checkout with fetch-depth 1 dates every file at HEAD, so skip the real-git assertions. */
const SHALLOW = (() => {
  try {
    return (
      execFileSync('git', ['rev-parse', '--is-shallow-repository'], {
        cwd: REPO_ROOT,
        encoding: 'utf-8',
      }).trim() !== 'false'
    );
  } catch {
    return true;
  }
})();

/** A reader that dates each path from a table, so the mapping is testable without git. */
function fakeReader(table: Record<string, string>) {
  return (paths: string[]): string =>
    newestLastmod(paths.map((p) => table[p] ?? '').filter(Boolean));
}

const W3C = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2}))?$/;

describe('LASTMOD_FALLBACK', () => {
  it('is a valid W3C date', () => {
    expect(LASTMOD_FALLBACK).toMatch(W3C);
    expect(Number.isNaN(Date.parse(LASTMOD_FALLBACK))).toBe(false);
  });

  // A page whose source git cannot date must never claim to be fresher than it
  // is, so the fallback is a fixed past date and never "now".
  it('is a fixed date in the past, not today', () => {
    expect(Date.parse(LASTMOD_FALLBACK)).toBeLessThan(Date.now());
    expect(LASTMOD_FALLBACK).not.toBe(new Date().toISOString().slice(0, 10));
  });
});

describe('lastmodFor', () => {
  it('returns the newest commit date among the inputs', () => {
    const read = fakeReader({ a: '2026-01-02T00:00:00+00:00', b: '2026-05-06T00:00:00+00:00' });
    expect(lastmodFor(['a', 'b'], read)).toBe('2026-05-06T00:00:00+00:00');
  });

  it('falls back when git returns nothing (uncommitted file or no git)', () => {
    expect(lastmodFor(['nope'], () => '')).toBe(LASTMOD_FALLBACK);
  });

  it('falls back when git is unavailable entirely', () => {
    expect(
      lastmodFor(['whatever'], () => {
        throw new Error('git: command not found');
      })
    ).toBe(LASTMOD_FALLBACK);
  });
});

describe('newestLastmod', () => {
  it.each([
    [[], LASTMOD_FALLBACK],
    [['2026-03-01'], '2026-03-01'],
    [['2026-03-01', '2026-01-01'], '2026-03-01'],
    // Compared as instants, not strings: an earlier local time can be a later instant.
    [['2026-03-01T00:00:00+00:00', '2026-02-28T23:00:00-05:00'], '2026-02-28T23:00:00-05:00'],
  ])('%s -> %s', (dates, expected) => {
    expect(newestLastmod(dates)).toBe(expected);
  });
});

describe('newestLastmodIn', () => {
  it('reads the newest <lastmod> out of a sitemap', () => {
    const xml =
      '<urlset><url><loc>a</loc><lastmod>2026-01-01</lastmod></url>' +
      '<url><loc>b</loc><lastmod>2026-07-04</lastmod></url></urlset>';
    expect(newestLastmodIn(xml)).toBe('2026-07-04');
  });

  it('falls back for a sitemap with no dates', () => {
    expect(newestLastmodIn('<urlset></urlset>')).toBe(LASTMOD_FALLBACK);
  });
});

describe('route sources', () => {
  it('covers every route that gets an index.html', () => {
    const uncovered = ['', ...ALL_ROUTES].filter(
      (r) => !r.startsWith('docs/') && ROUTE_SOURCE[r] === undefined
    );
    expect(uncovered).toEqual([]);
  });

  it('names files that exist', () => {
    const missing = Object.values(ROUTE_SOURCE)
      .flat()
      .filter((p) => !existsSync(join(REPO_ROOT, p)));
    expect(missing).toEqual([]);
  });

  it('maps every doc to its markdown source', () => {
    // docs/generated/README.md is built by typedoc and is not committed, so it
    // is the one doc allowed to be absent from a clean checkout.
    const missing = DOC_ENTRIES.map((e) => docSourcePath(e.id))
      .filter((p) => !p.startsWith('docs/generated/'))
      .filter((p) => !existsSync(join(REPO_ROOT, p)));
    expect(missing).toEqual([]);
    expect(DOC_FILE_MAP['api-reference']).toBe('generated/README.md');
  });
});

describe('lastmodForRoute', () => {
  it.each(['', ...ALL_ROUTES])('%s gets a parseable W3C date', (route) => {
    const value = lastmodForRoute(route);
    expect(value).toMatch(W3C);
    expect(Number.isNaN(Date.parse(value))).toBe(false);
  });

  it('dates a doc from its own markdown, not from the app', () => {
    const read = fakeReader({
      'docs/design-decisions.md': '2026-02-23T06:42:25-07:00',
      'packages/website/src/route-meta.ts': '2026-09-01T17:25:37-06:00',
    });
    expect(lastmodForRoute('docs/design-decisions', read)).toBe('2026-02-23T06:42:25-07:00');
  });

  it('dates an app route from its component or route-meta, whichever is newer', () => {
    const read = fakeReader({
      'packages/website/src/components/Extension.tsx': '2026-04-01T00:00:00+00:00',
      'packages/website/src/route-meta.ts': '2026-09-01T00:00:00+00:00',
    });
    expect(lastmodForRoute('extension', read)).toBe('2026-09-01T00:00:00+00:00');
  });

  // The whole point of lastmod: pages of different ages must not share a date.
  it('gives pages of different ages different dates', () => {
    if (SHALLOW) return;
    const dates = new Set(['', ...ALL_ROUTES].map((r) => lastmodForRoute(r)));
    expect(dates.size).toBeGreaterThan(1);
    const today = new Date().toISOString().slice(0, 10);
    expect([...dates].every((d) => d.startsWith(today))).toBe(false);
  });

  it('keeps an untouched doc on its old date', () => {
    if (SHALLOW) return;
    const doc = Date.parse(lastmodForRoute('docs/design-decisions'));
    expect(doc).toBeLessThan(Date.parse(lastmodFor(WORD_PAGE_SOURCES)));
  });
});

describe('wordPagesLastmod', () => {
  it('takes the newest of the generator and the packages it embeds', () => {
    const read = fakeReader({
      'packages/website/scripts/build-word-pages.ts': '2026-09-01T18:20:28-06:00',
      'packages/core/src': '2026-07-13T22:24:54-06:00',
    });
    expect(wordPagesLastmod(read)).toBe('2026-09-01T18:20:28-06:00');
  });
});

describe('readGitDate', () => {
  it('dates a committed file', () => {
    if (SHALLOW) return;
    expect(readGitDate(['docs/design-decisions.md'])).toMatch(W3C);
  });

  it('returns nothing for a path git does not track', () => {
    expect(readGitDate(['no/such/path/anywhere.md'])).toBe('');
  });
});

describe('renderPagesSitemap', () => {
  const xml = renderPagesSitemap(['', ...ALL_ROUTES]);

  it('gives every url a lastmod', () => {
    const locs = xml.match(/<loc>/g) ?? [];
    const mods = xml.match(/<lastmod>/g) ?? [];
    expect(locs).toHaveLength(ALL_ROUTES.length + 1);
    expect(mods).toHaveLength(locs.length);
  });

  it('emits only loc and lastmod — changefreq and priority are ignored by Google', () => {
    expect(xml).not.toContain('changefreq');
    expect(xml).not.toContain('priority');
  });

  it('emits absolute crawlable urls', () => {
    expect(xml).toContain(`<loc>${SITE}/guide/</loc>`);
  });

  it('emits parseable dates', () => {
    for (const [, value] of xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) {
      expect(value).toMatch(W3C);
    }
  });
});
