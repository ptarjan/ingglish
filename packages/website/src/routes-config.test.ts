// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { initialParam } from './routes-config';

function at(href: string) {
  globalThis.history.replaceState(null, '', href);
}

describe('initialParam', () => {
  it('reads the query form that shared links use', () => {
    at('/text/?text=cat&lang=es');
    expect(initialParam('text')).toBe('cat');
    expect(initialParam('lang')).toBe('es');
  });

  it('reads the fragment form that internal links use', () => {
    at('/text/#text=colonel');
    expect(initialParam('text')).toBe('colonel');
  });

  it('prefers the query string when a URL carries both', () => {
    at('/text/?text=query#text=fragment');
    expect(initialParam('text')).toBe('query');
  });

  it('is undefined when neither carries the parameter', () => {
    at('/text/#c=custom-mapping-payload');
    expect(initialParam('text')).toBeUndefined();
  });

  it('decodes percent-encoded values', () => {
    at(`/text/#text=${encodeURIComponent('two words')}`);
    expect(initialParam('text')).toBe('two words');
  });
});
