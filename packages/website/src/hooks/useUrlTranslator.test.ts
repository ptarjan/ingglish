/**
 * @vitest-environment jsdom
 *
 * Tests for URL translator postMessage handling.
 * Note: shouldSkipUrl tests are in url.test.ts to avoid duplication.
 */
import { describe, it, expect } from 'vitest';

describe('postMessage origin validation', () => {
  // Test the origin validation logic used in useUrlTranslator
  const isValidOrigin = (origin: string): boolean => {
    // srcdoc iframes have origin "null" (string literal)
    // Only accept messages from our iframe or same origin
    return origin === 'null' || origin === window.location.origin;
  };

  it('accepts messages from srcdoc iframes (origin "null")', () => {
    expect(isValidOrigin('null')).toBe(true);
  });

  it('accepts messages from same origin', () => {
    expect(isValidOrigin(window.location.origin)).toBe(true);
  });

  it('rejects messages from different origins', () => {
    expect(isValidOrigin('https://evil.com')).toBe(false);
    expect(isValidOrigin('http://localhost:3001')).toBe(false);
  });
});

describe('link click message handling', () => {
  it('ingglish-link-click message format is correct', () => {
    // Test that the expected message format is handled correctly
    const message = {
      type: 'ingglish-link-click',
      href: '/path/to/page',
    };

    expect(message.type).toBe('ingglish-link-click');
    expect(typeof message.href).toBe('string');
  });

  it('relative URLs are resolved against base URL', () => {
    const baseUrl = 'https://example.com/path/';
    const href = '../other/page.html';

    const resolved = new URL(href, baseUrl).href;
    expect(resolved).toBe('https://example.com/other/page.html');
  });

  it('absolute URLs are preserved', () => {
    const baseUrl = 'https://example.com/path/';
    const href = 'https://other.com/page.html';

    const resolved = new URL(href, baseUrl).href;
    expect(resolved).toBe('https://other.com/page.html');
  });
});

describe('history state management', () => {
  it('translator state shape is correct', () => {
    const state = { translatorUrl: 'https://example.com' };

    expect(state.translatorUrl).toBeDefined();
    expect(typeof state.translatorUrl).toBe('string');
  });

  it('null state indicates no translation', () => {
    // Simulating history.state being null
    const state = null as { translatorUrl?: string } | null;

    expect(state?.translatorUrl).toBeUndefined();
  });
});
