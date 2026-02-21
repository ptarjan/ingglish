import { describe, it, expect } from 'vitest';
import { lookupPronunciation, hasWord } from './lookup';

describe('lookupPronunciation', () => {
  it('returns phoneme array for known words', () => {
    const result = lookupPronunciation('hello');
    expect(result).toBeInstanceOf(Array);
    expect(result!.length).toBeGreaterThan(0);
  });

  it('is case-insensitive', () => {
    expect(lookupPronunciation('Hello')).toEqual(lookupPronunciation('hello'));
    expect(lookupPronunciation('THE')).toEqual(lookupPronunciation('the'));
  });

  it('returns null for unknown words', () => {
    expect(lookupPronunciation('xyzzyqwop')).toBeNull();
    expect(lookupPronunciation('asdfghjkl123')).toBeNull();
  });

  it('custom pronunciations override dictionary', () => {
    // "read" is in CUSTOM_PRONUNCIATIONS with /riːd/ (R IY1 D)
    const result = lookupPronunciation('read');
    expect(result).toEqual(['R', 'IY1', 'D']);
  });

  it('returns custom pronunciation for words not in CMU', () => {
    // "emoji" is added in custom-words, not in CMU
    const result = lookupPronunciation('emoji');
    expect(result).toEqual(['IH0', 'M', 'OW1', 'JH', 'IY0']);
  });

  it('is prototype-safe: "constructor" returns null', () => {
    expect(lookupPronunciation('constructor')).toBeNull();
  });

  it('is prototype-safe: "toString" returns null', () => {
    expect(lookupPronunciation('toString')).toBeNull();
  });

  it('normalizes velar nasal: N before K becomes NG', () => {
    // "think" should have NG K, not N K
    const result = lookupPronunciation('think');
    expect(result).not.toBeNull();
    const nkIndex = result!.findIndex(
      (p, i) => p === 'N' && (result![i + 1] === 'K' || result![i + 1] === 'G')
    );
    expect(nkIndex).toBe(-1); // No N before K/G

    const ngIndex = result!.indexOf('NG');
    expect(ngIndex).toBeGreaterThanOrEqual(0); // Has NG
  });

  it('normalizes velar nasal: N before G becomes NG', () => {
    // "finger" has N before G in CMU
    const result = lookupPronunciation('finger');
    expect(result).not.toBeNull();
    const nBeforeG = result!.findIndex((p, i) => p === 'N' && result![i + 1] === 'G');
    expect(nBeforeG).toBe(-1); // No bare N before G

    const ngIndex = result!.indexOf('NG');
    expect(ngIndex).toBeGreaterThanOrEqual(0); // Has NG
  });
});

describe('hasWord', () => {
  it('returns true for known words', () => {
    expect(hasWord('hello')).toBe(true);
    expect(hasWord('the')).toBe(true);
    expect(hasWord('world')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(hasWord('Hello')).toBe(true);
    expect(hasWord('THE')).toBe(true);
  });

  it('returns false for unknown words', () => {
    expect(hasWord('xyzzyqwop')).toBe(false);
    expect(hasWord('asdfghjkl123')).toBe(false);
  });

  it('is prototype-safe', () => {
    expect(hasWord('constructor')).toBe(false);
    expect(hasWord('toString')).toBe(false);
    expect(hasWord('__proto__')).toBe(false);
  });
});
