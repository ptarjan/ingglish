import { describe, expect, it } from 'vitest';
import type { IpaDict } from './dict-loader';
import { translateForeign, NOT_FOUND_MARKER } from './ipa-to-ingglish';

describe('translateForeign', () => {
  const dict: IpaDict = {
    hello: '/hɛloʊ/',
    مرحبا: '/marhaba/',
    こんにちは: '/konnitɕiwa/',
    你好: '/ni˨˩˦xaʊ˨˩˦/',
  };

  it('translates a Latin-script word', () => {
    const result = translateForeign('hello', dict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
  });

  it('translates Arabic words', () => {
    const result = translateForeign('مرحبا', dict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
    expect(result.length).toBeGreaterThan(0);
  });

  it('translates Japanese words', () => {
    const result = translateForeign('こんにちは', dict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
  });

  it('translates Chinese words', () => {
    const result = translateForeign('你好', dict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
  });

  it('strips punctuation around non-Latin words', () => {
    const result = translateForeign('(مرحبا)', dict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
    expect(result).toMatch(/^\(.+\)$/);
  });

  it('marks unknown words with NOT_FOUND_MARKER', () => {
    const result = translateForeign('unknown', dict);
    expect(result).toContain(NOT_FOUND_MARKER);
  });

  it('preserves whitespace between words', () => {
    const result = translateForeign('hello  مرحبا', dict);
    expect(result).toContain('  ');
    expect(result).not.toContain(NOT_FOUND_MARKER);
  });

  it('splits French contractions on apostrophes', () => {
    const frDict: IpaDict = { avec: '/avɛk/', essentiel: '/esɑ̃sjɛl/', l: '/ɛl/', qu: '/ky/' };
    const result1 = translateForeign("l'essentiel", frDict);
    expect(result1).not.toContain(NOT_FOUND_MARKER);

    const result2 = translateForeign("qu'avec", frDict);
    expect(result2).not.toContain(NOT_FOUND_MARKER);
  });

  it('splits hyphenated words', () => {
    const frDict: IpaDict = { allez: '/ale/', vous: '/vu/' };
    const result = translateForeign('allez-vous', frDict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
  });
});
