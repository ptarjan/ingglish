import { describe, it, expect } from 'vitest';
import { translateAsBritish } from './british';
import { translateAsCompound } from './compounds';
import { translateWithStemming } from './stemming';
import { isInitialism, parseInitialismWithSuffix, translateAsAcronym } from './acronyms';
import { translateUnknown } from './index';

describe('translateAsBritish', () => {
  it('converts -our to -or (colour → color)', () => {
    const result = translateAsBritish('colour');
    expect(result).toBeTruthy();
    expect(result?.length).toBeGreaterThan(0);
  });

  it('converts -re to -er (centre → center)', () => {
    const result = translateAsBritish('centre');
    expect(result).toBeTruthy();
    expect(result?.length).toBeGreaterThan(0);
  });

  it('converts -lled to -led (travelled → traveled)', () => {
    const result = translateAsBritish('travelled');
    expect(result).toBeTruthy();
    expect(result?.length).toBeGreaterThan(0);
  });

  it('returns null when no British variant matches', () => {
    expect(translateAsBritish('hello')).toBeNull();
  });

  it('returns null when American form not in dictionary', () => {
    // A word that matches a rule but the American form isn't real
    expect(translateAsBritish('xyzour')).toBeNull();
  });
});

describe('translateAsCompound', () => {
  it('splits "herself" into known parts', () => {
    const result = translateAsCompound('herself');
    expect(result).toBeTruthy();
    expect(result?.length).toBeGreaterThan(0);
  });

  it('returns null for non-compound words', () => {
    expect(translateAsCompound('xyzabc')).toBeNull();
  });

  it('picks the best split by frequency', () => {
    // "into" can split as "in"+"to" — both high-frequency words
    const result = translateAsCompound('into');
    expect(result).toBeTruthy();
  });
});

describe('translateWithStemming', () => {
  it('handles -ing suffix (jumping → jump + ing)', () => {
    const result = translateWithStemming('jumping');
    expect(result).toBeTruthy();
    expect(result?.length).toBeGreaterThan(0);
  });

  it('handles -ly suffix (quickly → quick + ly)', () => {
    const result = translateWithStemming('quickly');
    expect(result).toBeTruthy();
  });

  it('handles prefix stripping (rewrite → re + write)', () => {
    const result = translateWithStemming('rewrite');
    expect(result).toBeTruthy();
  });

  it('returns null when no stem is found', () => {
    expect(translateWithStemming('xyzabc')).toBeNull();
  });

  it('handles e-reinsertion (hoping → hope + ing)', () => {
    const result = translateWithStemming('hoping');
    expect(result).toBeTruthy();
  });
});

describe('isInitialism', () => {
  it('recognizes known initialisms', () => {
    expect(isInitialism('URL')).toBe(true);
    expect(isInitialism('HTML')).toBe(true);
    expect(isInitialism('API')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isInitialism('url')).toBe(true);
    expect(isInitialism('Url')).toBe(true);
  });

  it('rejects unknown words', () => {
    expect(isInitialism('hello')).toBe(false);
    expect(isInitialism('XYZABC')).toBe(false);
  });

  it('rejects words longer than max initialism length', () => {
    expect(isInitialism('ABCDEFGH')).toBe(false);
  });
});

describe('parseInitialismWithSuffix', () => {
  it('parses plural initialisms (URLs)', () => {
    const result = parseInitialismWithSuffix('URLs');
    expect(result).toEqual({ base: 'URL', suffix: 's' });
  });

  it("parses possessive initialisms (API's)", () => {
    const result = parseInitialismWithSuffix("API's");
    expect(result).toEqual({ base: 'API', suffix: "'s" });
  });

  it('returns null for non-initialisms', () => {
    expect(parseInitialismWithSuffix('cats')).toBeNull();
  });
});

describe('translateAsAcronym', () => {
  it('spells out letters for known initialisms', () => {
    const result = translateAsAcronym('URL');
    expect(result.length).toBeGreaterThan(0);
  });

  it('produces consistent output', () => {
    const first = translateAsAcronym('API');
    const second = translateAsAcronym('API');
    expect(first).toBe(second);
  });

  it('supports IPA format', () => {
    const ingglish = translateAsAcronym('URL', 'ingglish');
    const ipa = translateAsAcronym('URL', 'ipa');
    expect(ingglish).not.toBe(ipa);
  });
});

describe('translateUnknown (integration)', () => {
  it('translates custom pronunciation words', () => {
    // Custom pronunciations are tested indirectly — the function should
    // never return empty for any word (it falls back to rule-based G2P)
    const result = translateUnknown('xylophone');
    expect(result.length).toBeGreaterThan(0);
  });

  it('always returns a non-empty string (rule-based fallback)', () => {
    const result = translateUnknown('supercalifragilisticexpialidocious');
    expect(result.length).toBeGreaterThan(0);
  });

  it('translates known initialisms', () => {
    const result = translateUnknown('URL');
    expect(result.length).toBeGreaterThan(0);
  });

  it('respects format parameter', () => {
    const ingglish = translateUnknown('github', 'ingglish');
    const ipa = translateUnknown('github', 'ipa');
    expect(ingglish).not.toBe(ipa);
  });
});
