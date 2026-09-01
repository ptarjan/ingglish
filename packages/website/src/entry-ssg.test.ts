import { describe, expect, it } from 'vitest';
import { render } from './entry-ssg';
import { GAME_ENTRIES, sitePath } from './routes';

describe('SSG render', () => {
  describe('static content pages render full content', () => {
    it.each([
      ['/docs', 'docs-container'],
      ['/docs/architecture', 'docs-container'],
      ['/extension', 'extension-page'],
      ['/guide', 'mapping-table'],
    ])('%s contains %s', async (url, marker) => {
      const html = await render(url);
      expect(html).toContain(marker);
    });
  });

  const DICT_DEPENDENT = [
    '/',
    '/text',
    '/url',
    '/explore',
    '/experiment',
    '/games',
    '/challenge',
    ...GAME_ENTRIES.map((g) => `/games/${g.id}`),
  ];

  describe('dict-dependent pages show noscript fallback', () => {
    it.each(DICT_DEPENDENT)('%s has noscript message', async (url) => {
      const html = await render(url);
      expect(html).toContain('loading-spinner');
      expect(html).toContain('<noscript>');
      expect(html).toContain('requires JavaScript');
    });
  });

  // A spinner is not a page. Every route whose component needs the dictionary
  // used to render nothing a crawler could read, which is what
  // "Crawled - currently not indexed" means. Each of these phrases appears on
  // exactly one route, so a copy-paste template would fail this table.
  describe('dict-dependent pages render route-specific prose', () => {
    it.each([
      ['/', 'six sounds, six spellings'],
      ['/text', 'highlights the matching word in the other pane'],
      ['/url', 'links inside the page are re-translated'],
      ['/explore', 'ARPAbet symbol'],
      ['/experiment', 're-scores your alphabet against the whole dictionary'],
      ['/games', 'Eleven browser games'],
      ['/challenge', 'used to live at this address'],
      ['/games/reading', 'Ten sentences appear in Ingglish'],
      ['/games/homophones', '63 groups of English homophones'],
      ['/games/learn', 'Eight short lessons, taken in any order'],
      ['/games/daily', 'no q and no x'],
      ['/games/speedmatch', 'stopwatch that starts when you do'],
      ['/games/reverse', 'one within a letter or two scores half'],
      ['/games/spelling-rules', 'the same letters keep changing their minds'],
      ['/games/spell-that-sound', 'a word with a gap in it'],
      ['/games/rule-or-exception', 'follows the rule, or breaks it'],
      ['/games/pattern-sort', 'as in pool or as in look'],
      ['/games/origin-detective', 'wearing their old country'],
    ])('%s contains %j', async (url, phrase) => {
      const html = await render(url);
      expect(html).toContain(phrase);
    });

    it.each(DICT_DEPENDENT)('%s has a heading and enough text to index', async (url) => {
      const html = await render(url);
      expect(html).toContain('class="seo-content"');
      expect(html).toMatch(/<h2[^>]*>/);
      // Strip tags; the prose alone (not markup) has to be substantial.
      const text = html.replaceAll(/<[^>]+>/g, ' ');
      expect(text.length).toBeGreaterThan(600);
    });

    it('no two routes share the same prose', async () => {
      const bodies = await Promise.all(
        DICT_DEPENDENT.map(async (url) => {
          const html = await render(url);
          const start = html.indexOf('class="seo-content"');
          return html.slice(start, html.indexOf('loading-screen', start));
        })
      );
      expect(new Set(bodies).size).toBe(bodies.length);
    });

    it('/games links to every game route', async () => {
      const html = await render('/games');
      for (const game of GAME_ENTRIES) {
        expect(html).toContain(`href="${sitePath(`games/${game.id}`)}"`);
      }
    });

    it('every game page links back to the games hub', async () => {
      for (const game of GAME_ENTRIES) {
        const html = await render(`/games/${game.id}`);
        expect(html).toContain('href="/games/"');
      }
    });

    it('an unknown game id falls back to the hub copy', async () => {
      const html = await render('/games/not-a-game');
      expect(html).toContain('Eleven browser games');
    });
  });

  describe('all pages include header', () => {
    it.each(['/', '/text', '/url', '/guide', '/extension', '/docs', '/explore', '/games'])(
      '%s has header with title',
      async (url) => {
        const html = await render(url);
        expect(html).toContain('Ingglish');
        expect(html).toContain('class="header');
      }
    );
  });

  describe('non-tutorial pages include tab nav', () => {
    it.each(['/text', '/url', '/guide', '/extension', '/docs', '/explore', '/games'])(
      '%s has tabs',
      async (url) => {
        const html = await render(url);
        expect(html).toContain('class="tabs');
      }
    );
  });

  // The <head> copies written by customizeHtml are authoritative; anything the
  // React tree emits would land inside #root and give the page two or three
  // conflicting descriptions.
  describe('no head-only tags leak into the body', () => {
    it.each([
      '/',
      '/text',
      '/guide',
      '/extension',
      '/docs',
      '/docs/architecture',
      '/games',
      '/games/daily',
      '/challenge',
    ])('%s has no inline description or canonical', async (url) => {
      const html = await render(url);
      expect(html).not.toContain('name="description"');
      expect(html).not.toContain('rel="canonical"');
    });
  });

  it('/challenge points at its replacement', async () => {
    // /challenge redirects on the client; the SSG copy says so and links there
    const html = await render('/challenge');
    expect(html).toContain('loading-spinner');
    expect(html).toContain('href="/games/reading/"');
  });
});
