/**
 * The word sitemaps and the sitemap index: dist/sitemap-words[-N].xml and
 * dist/sitemap.xml. (dist/sitemap-pages.xml is written by the vite plugin from
 * renderPagesSitemap in ./lastmod.)
 *
 * This lives apart from the word-page generator on purpose. WORD_PAGE_SOURCES
 * in ./lastmod dates all 48,831 word URLs from the commit history of the files
 * that decide what those pages say, and build-word-pages.ts is one of them.
 * While the sitemap renderers sat in that file, editing a sitemap re-dated
 * every word page whose HTML had not changed. Sitemap code belongs where
 * touching it cannot claim a freshness the pages do not have.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { SITE } from '../src/routes';

import { LASTMOD_FALLBACK, newestLastmodIn, wordPagesLastmod } from './lastmod';

// A sitemap may hold at most 50,000 URLs, and crossing the line does not drop
// the overflow — Google rejects the whole file, so every word page would go
// dark at once. The dictionary had reached 48,831. Chunk well below the cap so
// the next few thousand words are a non-event.
export const SITEMAP_CHUNK_SIZE = 25_000;

/**
 * Builds the words sitemaps: the hub, each letter page, and every word, split
 * into files of at most SITEMAP_CHUNK_SIZE URLs.
 *
 * Every URL shares one `lastmod` because every page here is regenerated as a
 * batch from the same generator and dictionaries — see wordPagesLastmod, which
 * reads that date out of git rather than off the clock.
 *
 * The first chunk keeps the historical `sitemap-words.xml` name. Google has
 * that URL on file from earlier submissions, and renaming it would 404 a
 * sitemap it is still fetching — an avoidable Search Console error for no gain.
 */
export function renderWordsSitemaps(
  words: string[],
  letters: string[],
  lastmod: string
): { filename: string; xml: string }[] {
  const locs = [
    `${SITE}/words/`,
    ...letters.map((l) => `${SITE}/words/${l}/`),
    ...words.map((w) => `${SITE}/word/${w}/`),
  ];
  const result: { filename: string; xml: string }[] = [];
  for (let i = 0; i < locs.length; i += SITEMAP_CHUNK_SIZE) {
    const urls = locs
      .slice(i, i + SITEMAP_CHUNK_SIZE)
      .map((loc) => `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`)
      .join('\n');
    const n = result.length + 1;
    result.push({
      filename: n === 1 ? 'sitemap-words.xml' : `sitemap-words-${n}.xml`,
      xml: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    });
  }
  return result;
}

/** Builds the sitemap index referencing the page sitemap and every word sitemap. */
export function renderSitemapIndex(sitemaps: { filename: string; lastmod: string }[]): string {
  const maps = sitemaps
    .map(
      ({ filename, lastmod }) =>
        `  <sitemap><loc>${SITE}/${filename}</loc><lastmod>${lastmod}</lastmod></sitemap>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${maps}\n</sitemapindex>\n`;
}

/* v8 ignore start -- filesystem orchestration; the pure builders above are unit-tested */
/**
 * Writes the word sitemaps and the sitemap index into `distDir`, and returns
 * how many word sitemaps were written.
 */
export function writeSitemaps(distDir: string, words: string[], letters: string[]): number {
  const wordsLastmod = wordPagesLastmod();
  const wordSitemaps = renderWordsSitemaps(words, letters, wordsLastmod);
  for (const { filename, xml } of wordSitemaps) {
    writeFileSync(join(distDir, filename), xml);
  }
  // The index entry for sitemap-pages.xml is dated from the file vite already
  // wrote, so the two can never disagree about what is in it.
  const pagesSitemap = join(distDir, 'sitemap-pages.xml');
  const pagesLastmod = existsSync(pagesSitemap)
    ? newestLastmodIn(readFileSync(pagesSitemap, 'utf-8'))
    : LASTMOD_FALLBACK;
  writeFileSync(
    join(distDir, 'sitemap.xml'),
    renderSitemapIndex([
      { filename: 'sitemap-pages.xml', lastmod: pagesLastmod },
      ...wordSitemaps.map((s) => ({ filename: s.filename, lastmod: wordsLastmod })),
    ])
  );
  return wordSitemaps.length;
}
/* v8 ignore stop */
