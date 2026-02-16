import { describe, it, expect } from 'vitest';
import { translateContraction, setTranslateWordFn } from './contractions';

// Register a simple fallback for words not in dictionary
setTranslateWordFn((word) => word);

describe('translateContraction', () => {
  it('translates "don\'t" as a unit', () => {
    const result = translateContraction("don't");
    expect(result.length).toBeGreaterThan(0);
    // Should not contain apostrophe (removed for round-tripping)
    expect(result).not.toContain("'");
  });

  it('translates "can\'t" as a unit', () => {
    const result = translateContraction("can't");
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toContain("'");
  });

  it('translates "won\'t" as a unit', () => {
    const result = translateContraction("won't");
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toContain("'");
  });

  it('translates "I\'m" with lowercase output', () => {
    const result = translateContraction("I'm");
    expect(result.length).toBeGreaterThan(0);
    // I-contractions should be lowercase (I is only capitalized in English by convention)
    expect(result).toBe(result.toLowerCase());
  });

  it('translates "I\'ll" with lowercase output', () => {
    const result = translateContraction("I'll");
    expect(result.length).toBeGreaterThan(0);
    expect(result).toBe(result.toLowerCase());
  });

  it('translates "I\'ve" with lowercase output', () => {
    const result = translateContraction("I've");
    expect(result.length).toBeGreaterThan(0);
    expect(result).toBe(result.toLowerCase());
  });

  it('produces stable output for the same input', () => {
    const first = translateContraction("don't");
    const second = translateContraction("don't");
    expect(first).toBe(second);
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
    expect(ingglish).not.toBe(ipa);
  });
});
