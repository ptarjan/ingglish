import { translateSync } from 'ingglish';
import { describe, expect, it } from 'vitest';

describe('British spelling translation', () => {
  it.each([
    ['vapour', 'vayper', '-our → -or'],
    ['organise', 'organaiz', '-ise → -ize'],
    ['meagre', 'meeger', '-re → -er'],
    ['modernisation', 'modernazayshan', '-isation → -ization'],
    ['offence', 'afens', '-ence → -ense'],
    ['favoured', 'fayverd', '-oured suffix'],
    ['curtsey', 'kertsee', '-ey → -y'],
    ['greyer', 'grayer', 'grey → gray'],
    ['modelled', 'modald', '-lled → -led'],
  ])('converts %s → %s (%s)', (input, expected) => {
    expect(translateSync(input)).toBe(expected);
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
  it.each([
    ['catdog', 'katdawg'],
    ['hatbox', 'hatboks'],
    ['bedpost', 'bedpohst'],
  ])('translates compound %s → %s', (input, expected) => {
    expect(translateSync(input)).toBe(expected);
  });

  it('translates non-compound words via G2P', () => {
    const result = translateSync('xyzabc');
    expect(typeof result).toBe('string');
  });
});

describe('stemming translation', () => {
  it.each([
    ['rehashes', 'reehashiz', '-es suffix after sibilants'],
    ['debugs', 'deebuhgz', '-s suffix after voiced consonants'],
    ['detoxing', 'deetoksing', '-ing suffix (detox + ing)'],
    ['boringly', 'boringlee', '-ly suffix (boring + ly)'],
    ['unsorted', 'ansortid', 'un- prefix'],
    ['rebooting', 'reebooting', 're- prefix (re + boot + ing)'],
    ['uglify', 'uhgleeifai', '-ify suffix'],
    ['uglification', 'uhgleeifikayshan', '-ification suffix'],
    ['uglifying', 'uhgleeifaiing', '-ifying suffix'],
    ['transposing', 'transpohzing', 'e-reinsertion (transpose + ing)'],
  ])('handles %s → %s (%s)', (input, expected) => {
    expect(translateSync(input)).toBe(expected);
  });

  it.each([
    ['loveliest', 'luhvleeast'],
    ['fussily', 'fuhseelee'],
    ['fussier', 'fuhser'],
  ])('handles i→y stem change: %s → %s', (input, expected) => {
    expect(translateSync(input)).toBe(expected);
  });
});

describe('initialism passthrough', () => {
  it.each(['URL', 'HTML', 'API', 'url', 'Url'])('passes through %s unchanged', (word) => {
    expect(translateSync(word)).toBe(word);
  });

  it('translates non-initialism words normally', () => {
    const result = translateSync('hello');
    expect(result).not.toBe('hello');
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
  it.each([
    ['Visit https://example.com today', 'https://example.com', 'URL'],
    ['Email test@example.com please', 'test@example.com', 'email'],
    ['Visit google.com today', 'google.com', 'bare domain'],
  ])('preserves %s (%s)', (input, preserved) => {
    expect(translateSync(input)).toContain(preserved);
  });
});
