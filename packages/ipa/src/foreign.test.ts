import { describe, expect, it } from 'vitest';
import type { IpaDict } from './foreign';
import { translateForeign, NOT_FOUND_MARKER } from './foreign';

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

  it('looks up clitic+apostrophe entries from real French dictionaries', () => {
    // Real French ipa-dict has "s'" -> /s/, "l'" -> /l/, not bare "s" or "l"
    const frDict: IpaDict = { homme: '/ɔm/', il: '/il/', "l'": '/l/', "s'": '/s/' };
    const result1 = translateForeign("s'il", frDict);
    expect(result1).not.toContain(NOT_FOUND_MARKER);

    const result2 = translateForeign("l'homme", frDict);
    expect(result2).not.toContain(NOT_FOUND_MARKER);
  });

  it('splits hyphenated words', () => {
    const frDict: IpaDict = { allez: '/ale/', vous: '/vu/' };
    const result = translateForeign('allez-vous', frDict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
  });

  it('preserves capitalization', () => {
    const deDict: IpaDict = { guten: '/ɡuːtən/', tag: '/taːk/' };
    const result = translateForeign('Guten Tag', deDict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
    // Both words should start with uppercase
    const words = result.split(' ');
    expect(words[0]![0]).toBe(words[0]![0]!.toUpperCase());
    expect(words[1]![0]).toBe(words[1]![0]!.toUpperCase());
  });

  it('preserves all-caps', () => {
    const result = translateForeign('HELLO', dict);
    expect(result).not.toContain(NOT_FOUND_MARKER);
    expect(result).toBe(result.toUpperCase());
  });

  it('applies IPA override for French "est" (silent st)', () => {
    const frDict: IpaDict = { est: '/ɛst/' };
    // Without lang, uses dict's /ɛst/ which includes S and T sounds
    const withoutLang = translateForeign('est', frDict, 'ingglish');
    expect(withoutLang).toContain('s');
    // With lang='fr', override provides /ɛ/ — no consonants
    const withLang = translateForeign('est', frDict, 'ingglish', 'fr');
    expect(withLang).not.toContain('s');
    expect(withLang).not.toContain('t');
  });
});
