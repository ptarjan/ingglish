import { describe, it, expect } from 'vitest';
import { translateContraction } from './contractions';

// Simple fallback for words not in dictionary — returns word unchanged
const identity = (word: string) => word;

describe('translateContraction', () => {
  it('translates common contractions', () => {
    expect(translateContraction("don't", 'ingglish', identity)).toBe('dohnt');
    expect(translateContraction("can't", 'ingglish', identity)).toBe('kant');
    expect(translateContraction("won't", 'ingglish', identity)).toBe('wohnt');
  });

  it('translates I-contractions as lowercase', () => {
    // I is only capitalized in English by convention
    expect(translateContraction("I'm", 'ingglish', identity)).toBe('aim');
    expect(translateContraction("I'll", 'ingglish', identity)).toBe('ail');
    expect(translateContraction("I've", 'ingglish', identity)).toBe('aiv');
  });

  it('produces stable output for the same input', () => {
    const first = translateContraction("don't", 'ingglish', identity);
    const second = translateContraction("don't", 'ingglish', identity);
    const third = translateContraction("don't", 'ingglish', identity);
    expect(first).toBe(second);
    expect(second).toBe(third);
  });

  it('falls back to translating parts when contraction not in dictionary', () => {
    // A made-up contraction not in CMU dictionary
    const result = translateContraction("foo'bar", 'ingglish', identity);
    // The fallback translateWord just returns the word as-is
    expect(result).toBe("foo'bar");
  });

  it('keeps "t" as-is for n\'t contractions not in dictionary', () => {
    // A contraction ending in 't that's not in the dictionary
    const result = translateContraction("zyx'tn't", 'ingglish', identity);
    // The 't' part should be preserved
    expect(result).toContain("'t");
  });

  it('respects IPA format', () => {
    const ingglish = translateContraction("don't", 'ingglish', identity);
    const ipa = translateContraction("don't", 'ipa', identity);
    expect(ingglish).toBe('dohnt');
    expect(ipa).not.toBe(ingglish);
  });
});
