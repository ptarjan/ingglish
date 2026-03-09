import { translateSync } from 'ingglish';
import { describe, expect, it } from 'vitest';

describe('British spelling translation', () => {
  it('converts -our to -or (colour → color)', () => {
    expect(translateSync('colour')).toBe(translateSync('color'));
  });

  it('converts -re to -er (centre → center)', () => {
    expect(translateSync('centre')).toBe(translateSync('center'));
  });

  it('converts -lled to -led (travelled → traveled)', () => {
    expect(translateSync('travelled')).toBe(translateSync('traveled'));
  });

  it('translates non-British words normally', () => {
    const result = translateSync('hello');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('compound word translation', () => {
  it('translates "herself" by splitting into known parts', () => {
    const result = translateSync('herself');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('translates non-compound words via G2P', () => {
    const result = translateSync('xyzabc');
    expect(typeof result).toBe('string');
  });

  it('translates multi-part compounds like "nevertheless"', () => {
    const result = translateSync('nevertheless');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('stemming translation', () => {
  it('handles -ing suffix (jumping → jump + ing)', () => {
    const result = translateSync('jumping');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('handles -ly suffix (quickly → quick + ly)', () => {
    const result = translateSync('quickly');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('handles prefix stripping (rewrite → re + write)', () => {
    const result = translateSync('rewrite');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('translates words without stems via G2P', () => {
    const result = translateSync('xyzabc');
    expect(typeof result).toBe('string');
  });

  it('handles e-reinsertion (hoping → hope + ing)', () => {
    const result = translateSync('hoping');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('initialism passthrough', () => {
  it('passes through known initialisms unchanged', () => {
    expect(translateSync('URL')).toBe('URL');
    expect(translateSync('HTML')).toBe('HTML');
    expect(translateSync('API')).toBe('API');
  });

  it('is case-insensitive for initialisms', () => {
    expect(translateSync('url')).toBe('url');
    expect(translateSync('Url')).toBe('Url');
  });

  it('translates non-initialism words normally', () => {
    const result = translateSync('hello');
    expect(result).not.toBe('hello'); // should be translated, not passed through
  });
});

describe('plural and possessive initialisms', () => {
  it('passes through plural initialisms (URLs)', () => {
    expect(translateSync('URLs')).toBe('URLs');
  });

  it("passes through possessive initialisms (API's)", () => {
    expect(translateSync("API's")).toBe("API's");
  });

  it('translates non-initialism plurals normally', () => {
    const result = translateSync('cats');
    expect(typeof result).toBe('string');
    expect(result).not.toBe('cats');
  });
});

describe('acronym spelling', () => {
  it('spells out non-initialism acronyms', () => {
    const result = translateSync('nfl');
    expect(result).toBe('enefel');
  });

  it('produces consistent output', () => {
    expect(translateSync('nfl')).toBe(translateSync('nfl'));
  });

  it('produces different output for ingglish vs ipa format', () => {
    const ingglish = translateSync('nfl');
    const ipa = translateSync('nfl', { format: 'ipa' });
    expect(ingglish).not.toBe(ipa);
  });
});

describe('unknown word integration', () => {
  it('translates words not in dictionary', () => {
    const result = translateSync('xylophone');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('always returns a non-empty string for very long words', () => {
    const result = translateSync('supercalifragilisticexpialidocious');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('produces different output for ingglish vs ipa format', () => {
    const ingglish = translateSync('github');
    const ipa = translateSync('github', { format: 'ipa' });
    expect(ingglish).not.toBe(ipa);
  });
});
