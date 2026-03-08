import { describe, expect, it } from 'vitest';
import { escapeXml, ROUTE_OG } from './generate-og-images';

describe('escapeXml', () => {
  it('escapes ampersands', () => {
    expect(escapeXml('a & b')).toBe('a &amp; b');
  });

  it('escapes angle brackets', () => {
    expect(escapeXml('<div>')).toBe('&lt;div&gt;');
  });

  it('escapes quotes', () => {
    expect(escapeXml('"hello"')).toBe('&quot;hello&quot;');
  });

  it('escapes apostrophes', () => {
    expect(escapeXml("it's")).toBe('it&apos;s');
  });

  it('handles multiple special characters', () => {
    expect(escapeXml('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  });

  it('returns empty string unchanged', () => {
    expect(escapeXml('')).toBe('');
  });

  it('leaves plain text unchanged', () => {
    expect(escapeXml('hello world')).toBe('hello world');
  });
});

describe('ROUTE_OG', () => {
  it('has a default route', () => {
    expect(ROUTE_OG['default']).toBeDefined();
    expect(ROUTE_OG['default'].subtitle).toBeTruthy();
    expect(ROUTE_OG['default'].examples).toBeTruthy();
  });

  it('has all expected routes', () => {
    const expectedRoutes = [
      'default',
      'text',
      'url',
      'guide',
      'explore',
      'experiment',
      'extension',
      'challenge',
      'docs',
    ];
    for (const route of expectedRoutes) {
      expect(ROUTE_OG[route], `missing route: ${route}`).toBeDefined();
    }
  });

  it('all routes have subtitle and examples', () => {
    for (const [route, config] of Object.entries(ROUTE_OG)) {
      expect(config.subtitle, `${route} missing subtitle`).toBeTruthy();
      expect(config.examples, `${route} missing examples`).toBeTruthy();
    }
  });
});
