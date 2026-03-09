import { translateSync } from 'ingglish';
import { describe, expect, it } from 'vitest';

describe('British spelling translation', () => {
  it('converts -our → -or (colour)', () => {
    expect(translateSync('colour')).toBe('kuhler');
  });

  it('converts -ise → -ize (realise)', () => {
    expect(translateSync('realise')).toBe('reealaiz');
  });

  it('converts -re → -er (centre)', () => {
    expect(translateSync('centre')).toBe('senter');
  });

  it('converts -isation → -ization (organisation)', () => {
    expect(translateSync('organisation')).toBe('organizayshan');
  });

  it('converts -ence → -ense (defence)', () => {
    expect(translateSync('defence')).toBe('difens');
  });

  it('converts -ogue → -og (catalogue)', () => {
    expect(translateSync('catalogue')).toBe('katalawg');
  });

  it('handles -oured suffix (favoured)', () => {
    expect(translateSync('favoured')).toBe('fayverd');
  });

  it('converts -ey → -y (curtsey)', () => {
    expect(translateSync('curtsey')).toBe('kertsee');
  });

  it('handles grey → gray', () => {
    expect(translateSync('grey')).toBe('gray');
  });

  it('converts -lled → -led (travelled)', () => {
    expect(translateSync('travelled')).toBe('travald');
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

  it('splits and translates "bedpost"', () => {
    expect(translateSync('bedpost')).toBe('bedpohst');
  });
});

describe('stemming translation', () => {
  it('handles -ly suffix (quickly)', () => {
    expect(translateSync('quickly')).toBe('kwiklee');
  });

  it('handles un- prefix (unhappy)', () => {
    expect(translateSync('unhappy')).toBe('anhapee');
  });

  it('handles re- prefix (rebuild)', () => {
    expect(translateSync('rebuild')).toBe('reebild');
  });

  it('handles i→y stem change (loveliest, happily, easier)', () => {
    expect(translateSync('loveliest')).toBe('luhvleeast');
    expect(translateSync('happily')).toBe('hapalee');
    expect(translateSync('easier')).toBe('eezee-er');
  });

  it('handles -ify suffix (uglify)', () => {
    expect(translateSync('uglify')).toBe('uhgleeifai');
  });

  it('handles -ification suffix (uglification)', () => {
    expect(translateSync('uglification')).toBe('uhgleeifikayshan');
  });

  it('handles -ifying suffix (uglifying)', () => {
    expect(translateSync('uglifying')).toBe('uhgleeifaiing');
  });

  it('handles -ing suffix (jumping)', () => {
    expect(translateSync('jumping')).toBe('juhmping');
  });

  it('handles e-reinsertion (hoping)', () => {
    expect(translateSync('hoping')).toBe('hohping');
  });

  it('handles re- prefix (rewrite)', () => {
    expect(translateSync('rewrite')).toBe('reerait');
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
