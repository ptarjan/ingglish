import { describe, expect, it } from 'vitest';
import { render } from './entry-ssg';

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

  describe('dict-dependent pages show noscript fallback', () => {
    it.each(['/', '/text', '/url', '/explore', '/experiment', '/games', '/challenge'])(
      '%s has noscript message',
      async (url) => {
        const html = await render(url);
        expect(html).toContain('loading-spinner');
        expect(html).toContain('<noscript>');
        expect(html).toContain('requires JavaScript');
      }
    );
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
    it.each(['/', '/text', '/guide', '/extension', '/docs', '/docs/architecture', '/games'])(
      '%s has no inline description or canonical',
      async (url) => {
        const html = await render(url);
        expect(html).not.toContain('name="description"');
        expect(html).not.toContain('rel="canonical"');
      }
    );
  });

  it('/challenge returns empty (redirect)', async () => {
    // /challenge is a redirect on client — SSG renders spinner fallback
    const html = await render('/challenge');
    expect(html).toContain('loading-spinner');
  });
});
