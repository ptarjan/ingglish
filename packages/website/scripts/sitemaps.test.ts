import { describe, expect, it } from 'vitest';
import {
  renderRhymesSitemaps,
  renderSitemapIndex,
  renderWordsSitemaps,
  SITEMAP_CHUNK_SIZE,
} from './sitemaps';

describe('sitemaps', () => {
  const MOD = '2026-09-01T18:20:28-06:00';

  it('renders the words sitemap with the hub, letter pages, and every word', () => {
    const maps = renderWordsSitemaps(['cat', 'hello'], ['c', 'h'], MOD);
    expect(maps).toHaveLength(1);
    expect(maps[0]!.filename).toBe('sitemap-words.xml');
    const xml = maps[0]!.xml;
    expect(xml).toContain('<loc>https://ingglish.com/words/</loc>');
    expect(xml).toContain('<loc>https://ingglish.com/words/c/</loc>');
    expect(xml).toContain('<loc>https://ingglish.com/word/cat/</loc>');
    expect(xml).toContain('<loc>https://ingglish.com/word/hello/</loc>');
  });

  // Google discounts lastmod on a site that stamps everything with the build
  // time, so the date has to come from the generator's own commit, and every
  // URL has to carry one or the ones that do look arbitrary.
  it('gives every word url a lastmod', () => {
    const maps = renderWordsSitemaps(['cat', 'hello'], ['c', 'h'], MOD);
    const xml = maps[0]!.xml;
    expect([...xml.matchAll(/<lastmod>/g)]).toHaveLength([...xml.matchAll(/<loc>/g)].length);
    expect(xml).toContain(`<lastmod>${MOD}</lastmod>`);
    expect(Number.isNaN(Date.parse(MOD))).toBe(false);
  });

  it('emits no changefreq or priority', () => {
    const xml = renderWordsSitemaps(['cat'], ['c'], MOD)[0]!.xml;
    expect(xml).not.toContain('changefreq');
    expect(xml).not.toContain('priority');
  });

  describe('renderRhymesSitemaps', () => {
    it('renders the hub and every rhyme page', () => {
      const maps = renderRhymesSitemaps(['cat', 'colonel'], MOD);
      expect(maps).toHaveLength(1);
      expect(maps[0]!.filename).toBe('sitemap-rhymes.xml');
      const xml = maps[0]!.xml;
      expect(xml).toContain('<loc>https://ingglish.com/rhymes/</loc>');
      expect(xml).toContain('<loc>https://ingglish.com/rhymes/cat/</loc>');
      expect(xml).toContain('<loc>https://ingglish.com/rhymes/colonel/</loc>');
    });

    it('gives every url a lastmod and no changefreq or priority', () => {
      const xml = renderRhymesSitemaps(['cat'], MOD)[0]!.xml;
      expect([...xml.matchAll(/<lastmod>/g)]).toHaveLength([...xml.matchAll(/<loc>/g)].length);
      expect(xml).toContain(`<lastmod>${MOD}</lastmod>`);
      expect(xml).not.toContain('changefreq');
      expect(xml).not.toContain('priority');
    });

    // Today's 6,361 rhyme pages fit in one file. The split is here so growing
    // into the 50,000-URL cap is a non-event, not a rejected sitemap.
    it('splits past the chunk size and keeps the first filename', () => {
      const words = Array.from({ length: SITEMAP_CHUNK_SIZE + 5 }, (_, i) => `w${i}`);
      const maps = renderRhymesSitemaps(words, MOD);
      expect(maps.map((m) => m.filename)).toEqual(['sitemap-rhymes.xml', 'sitemap-rhymes-2.xml']);
      expect([...maps[0]!.xml.matchAll(/<loc>/g)]).toHaveLength(SITEMAP_CHUNK_SIZE);
      expect([...maps[1]!.xml.matchAll(/<loc>/g)]).toHaveLength(6); // 5 words + the hub
    });

    it('is reachable from the sitemap index', () => {
      const maps = renderRhymesSitemaps(['cat'], MOD);
      const index = renderSitemapIndex(maps.map((m) => ({ filename: m.filename, lastmod: MOD })));
      expect(index).toContain('https://ingglish.com/sitemap-rhymes.xml');
    });
  });

  it('renders a sitemap index pointing at page and word sitemaps', () => {
    const xml = renderSitemapIndex([
      { filename: 'sitemap-pages.xml', lastmod: '2026-07-04T00:00:00+00:00' },
      { filename: 'sitemap-words.xml', lastmod: MOD },
    ]);
    expect(xml).toContain('<sitemapindex');
    expect(xml).toContain('https://ingglish.com/sitemap-pages.xml');
    expect(xml).toContain('https://ingglish.com/sitemap-words.xml');
  });

  it('gives every index entry its own lastmod', () => {
    const xml = renderSitemapIndex([
      { filename: 'sitemap-pages.xml', lastmod: '2026-07-04T00:00:00+00:00' },
      { filename: 'sitemap-words.xml', lastmod: MOD },
    ]);
    expect([...xml.matchAll(/<lastmod>/g)]).toHaveLength(2);
    expect(xml).toContain('<lastmod>2026-07-04T00:00:00+00:00</lastmod>');
    expect(xml).toContain(`<lastmod>${MOD}</lastmod>`);
  });

  // A sitemap over 50,000 URLs is rejected whole, not truncated, so the split
  // has to happen before the dictionary grows into it — never after.
  it('splits past the chunk size and keeps the historical first filename', () => {
    const words = Array.from({ length: SITEMAP_CHUNK_SIZE + 10 }, (_, i) => `w${i}`);
    const maps = renderWordsSitemaps(words, ['w'], MOD);
    expect(maps).toHaveLength(2);
    expect(maps.map((m) => m.filename)).toEqual(['sitemap-words.xml', 'sitemap-words-2.xml']);
    expect([...maps[0]!.xml.matchAll(/<loc>/g)]).toHaveLength(SITEMAP_CHUNK_SIZE);
    expect([...maps[1]!.xml.matchAll(/<loc>/g)]).toHaveLength(12); // 10 words + hub + letter
  });

  it.each([0, 1, SITEMAP_CHUNK_SIZE * 2 + 5])('%i words stays under the cap', (count) => {
    const words = Array.from({ length: count }, (_, i) => `w${i}`);
    const maps = renderWordsSitemaps(words, ['w'], MOD);
    const total = maps.reduce((n, m) => n + [...m.xml.matchAll(/<loc>/g)].length, 0);
    expect(total).toBe(count + 2); // every word, plus the hub and the one letter page
    for (const m of maps) {
      expect([...m.xml.matchAll(/<loc>/g)].length).toBeLessThanOrEqual(SITEMAP_CHUNK_SIZE);
      expect([...m.xml.matchAll(/<lastmod>/g)]).toHaveLength([...m.xml.matchAll(/<loc>/g)].length);
    }
    // Every chunk must be reachable, or its pages are invisible.
    const index = renderSitemapIndex(maps.map((m) => ({ filename: m.filename, lastmod: MOD })));
    for (const m of maps) expect(index).toContain(`https://ingglish.com/${m.filename}`);
  });
});
