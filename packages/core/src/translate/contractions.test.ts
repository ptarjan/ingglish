import { describe, it, expect } from 'vitest';
import { translateContraction, setTranslateWordFn } from './contractions';

// Register a simple fallback for words not in dictionary
setTranslateWordFn((word) => word);

describe('translateContraction', () => {
  it('translates common contractions', () => {
    expect(translateContraction("don't")).toBe('dohnt');
    expect(translateContraction("can't")).toBe('kant');
    expect(translateContraction("won't")).toBe('wohnt');
  });

  it('translates I-contractions as lowercase', () => {
    // I is only capitalized in English by convention
    expect(translateContraction("I'm")).toBe('aim');
    expect(translateContraction("I'll")).toBe('ail');
    expect(translateContraction("I've")).toBe('aiv');
  });

  it('produces stable output for the same input', () => {
    const first = translateContraction("don't");
    const second = translateContraction("don't");
    const third = translateContraction("don't");
    expect(first).toBe(second);
    expect(second).toBe(third);
  });

  it('falls back to translating parts when contraction not in dictionary', () => {
    // A made-up contraction not in CMU dictionary
    const result = translateContraction("foo'bar");
    // The fallback translateWordFn just returns the word as-is
    expect(result).toBe("foo'bar");
  });

  it('keeps "t" as-is for n\'t contractions not in dictionary', () => {
    // A contraction ending in 't that's not in the dictionary
    const result = translateContraction("zyx'tn't");
    // The 't' part should be preserved
    expect(result).toContain("'t");
  });

  it('respects IPA format', () => {
    const ingglish = translateContraction("don't", 'ingglish');
    const ipa = translateContraction("don't", 'ipa');
    expect(ingglish).toBe('dohnt');
    expect(ipa).not.toBe(ingglish);
  });
});
