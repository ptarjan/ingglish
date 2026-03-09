import { translateSync } from 'ingglish';
import { describe, expect, it } from 'vitest';

describe('British spelling translation', () => {
  it('converts -our → -or (vapour)', () => {
    expect(translateSync('vapour')).toBe('vayper');
  });

  it('converts -ise → -ize (organise)', () => {
    expect(translateSync('organise')).toBe('organaiz');
  });

  it('converts -re → -er (meagre)', () => {
    expect(translateSync('meagre')).toBe('meeger');
  });

  it('converts -isation → -ization (modernisation)', () => {
    expect(translateSync('modernisation')).toBe('modernazayshan');
  });

  it('converts -ence → -ense (offence)', () => {
    expect(translateSync('offence')).toBe('afens');
  });

  it('handles -oured suffix (favoured)', () => {
    expect(translateSync('favoured')).toBe('fayverd');
  });

  it('converts -ey → -y (curtsey)', () => {
    expect(translateSync('curtsey')).toBe('kertsee');
  });

  it('handles grey → gray (greyer)', () => {
    expect(translateSync('greyer')).toBe('grayer');
  });

  it('converts -lled → -led (modelled)', () => {
    expect(translateSync('modelled')).toBe('modald');
  });
});

describe('custom pronunciation translation', () => {
  it('translates custom pronunciation words (nginx)', () => {
    // nginx has custom pronunciation, not in CMU dict
    const result = translateSync('nginx');
    expect(result).toBeTruthy();
    expect(result).not.toBe('nginx');
  });
});

describe('compound word translation', () => {
  it('translates "catdog" by splitting into known parts', () => {
    expect(translateSync('catdog')).toBe('katdawg');
  });

  it('translates non-compound words via G2P', () => {
    const result = translateSync('xyzabc');
    expect(typeof result).toBe('string');
  });

  it('translates compounds like "hatbox"', () => {
    expect(translateSync('hatbox')).toBe('hatboks');
  });

  it('splits and translates "bedpost"', () => {
    expect(translateSync('bedpost')).toBe('bedpohst');
  });
});

describe('stemming translation', () => {
  it('handles -es suffix after sibilants (stemming)', () => {
    // "quizzes" -> stem "quiz" (ends in Z sibilant) + -es
    const result = translateSync('quizzes');
    expect(result).toBeTruthy();
  });

  it('handles -s suffix after voiced consonants (stemming)', () => {
    const result = translateSync('blogs');
    expect(result).toBeTruthy();
  });

  it('handles -ing suffix (detoxing → detox + ing)', () => {
    expect(translateSync('detoxing')).toBe('deetoksing');
  });

  it('handles -ly suffix (boringly → boring + ly)', () => {
    expect(translateSync('boringly')).toBe('boringlee');
  });

  it('handles un- prefix (unsorted)', () => {
    expect(translateSync('unsorted')).toBe('ansortid');
  });

  it('handles re- prefix (rebooting → re + boot + ing)', () => {
    expect(translateSync('rebooting')).toBe('reebooting');
  });

  it('handles i→y stem change', () => {
    expect(translateSync('loveliest')).toBe('luhvleeast');
    expect(translateSync('fussily')).toBe('fuhseelee');
    expect(translateSync('fussier')).toBe('fuhser');
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

  it('handles e-reinsertion (transposing → transpose + ing)', () => {
    expect(translateSync('transposing')).toBe('transpohzing');
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
    expect(translateSync('blorgify')).toBe('blorjafai');
  });

  it('always returns a non-empty string for very long words', () => {
    const result = translateSync('supercalifragilisticexpialidocious');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('produces different output for ingglish vs ipa format', () => {
    const ingglish = translateSync('blorgify');
    const ipa = translateSync('blorgify', { format: 'ipa' });
    expect(ingglish).not.toBe(ipa);
  });

  it('preserves case in camelCase compounds with IPA format', () => {
    const result = translateSync('catDog', { format: 'ipa' });
    expect(result).toBeTruthy();
  });
});

describe('URL/email preservation via translateSync', () => {
  it('preserves URLs in translated text', () => {
    const result = translateSync('Visit https://example.com today');
    expect(result).toContain('https://example.com');
  });

  it('preserves emails in translated text', () => {
    const result = translateSync('Email test@example.com please');
    expect(result).toContain('test@example.com');
  });

  it('preserves bare domains', () => {
    const result = translateSync('Visit google.com today');
    expect(result).toContain('google.com');
  });
});
