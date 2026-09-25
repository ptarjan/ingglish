import { describe, expect, it } from 'vitest';
import {
  applyDefaultStress,
  convertToArpabet,
  deriveInflection,
  ENDING_IPA,
  expandParadigms,
  MANUAL_ENTRIES,
  parseParadigms,
  parseTsv,
} from './build-ipa-dicts';
import { LANGUAGES, paradigmsFile } from './extract-kaikki-ipa';

describe('MANUAL_ENTRIES', () => {
  // Kaikki regenerates from Wiktionary and can drop words between dumps —
  // this guards that the sample-critical supplement stays present and converts.
  it('supplements nb with "ø" (Terje Vigen sample) and converts to ARPAbet', () => {
    expect(MANUAL_ENTRIES['nb']!['ø']).toBe('/øː/');
    const arpa = convertToArpabet(MANUAL_ENTRIES['nb']!, 'nb');
    expect(arpa['ø']!.length).toBeGreaterThan(0);
  });
});

describe('parseTsv', () => {
  it('parses tab-separated word/IPA pairs', () => {
    const text = 'hello\t/hɛˈloʊ/\nworld\t/wɜːld/\n';
    const dict = parseTsv(text);
    expect(dict['hello']).toBe('/hɛˈloʊ/');
    expect(dict['world']).toBe('/wɜːld/');
  });

  it('skips empty lines', () => {
    const text = 'hello\t/hɛˈloʊ/\n\n\nworld\t/wɜːld/\n';
    const dict = parseTsv(text);
    expect(Object.keys(dict)).toHaveLength(2);
  });

  it('skips lines without tabs', () => {
    const text = 'no tabs here\nhello\t/hɛˈloʊ/\n';
    const dict = parseTsv(text);
    expect(Object.keys(dict)).toEqual(['hello']);
  });

  it('keeps only first pronunciation when multiple separated by comma', () => {
    const text = 'live\t/lɪv/, /laɪv/\n';
    const dict = parseTsv(text);
    expect(dict['live']).toBe('/lɪv/');
  });

  it('keeps first occurrence for duplicate words', () => {
    const text = 'read\t/ɹiːd/\nread\t/ɹɛd/\n';
    const dict = parseTsv(text);
    expect(dict['read']).toBe('/ɹiːd/');
  });
});

describe('applyDefaultStress', () => {
  it('leaves already-stressed vowels unchanged', () => {
    const input = ['HH', 'AH0', 'L', 'OW1'];
    expect(applyDefaultStress(input)).toEqual(['HH', 'AH0', 'L', 'OW1']);
  });

  it('adds stress 1 to last vowel if none have stress', () => {
    const input = ['HH', 'AH', 'L', 'OW'];
    const result = applyDefaultStress(input);
    // Last vowel OW gets stress 1
    expect(result).toEqual(['HH', 'AH', 'L', 'OW1']);
  });

  it('handles single vowel', () => {
    const input = ['K', 'AA'];
    const result = applyDefaultStress(input);
    expect(result).toEqual(['K', 'AA1']);
  });

  it('handles all consonants (no vowels)', () => {
    const input = ['S', 'T', 'R'];
    const result = applyDefaultStress(input);
    // No vowels, nothing to stress
    expect(result).toEqual(['S', 'T', 'R']);
  });

  it('does not mutate the original array', () => {
    const input = ['HH', 'AH', 'L', 'OW'];
    const original = [...input];
    applyDefaultStress(input);
    expect(input).toEqual(original);
  });
});

describe('convertToArpabet (full pipeline)', () => {
  it('converts IPA dict entries to ARPAbet arrays', () => {
    const ipaDict = { hello: '/hɛloʊ/' };
    const result = convertToArpabet(ipaDict, 'en');
    expect(result['hello']).toBeDefined();
    expect(Array.isArray(result['hello'])).toBe(true);
    expect(result['hello']!.length).toBeGreaterThan(0);
  });

  it('strips slashes and dots from IPA', () => {
    // Syllable dots like /hɛ.loʊ/ should be removed before conversion
    const ipaDict = { test: '/tɛ.st/' };
    const result = convertToArpabet(ipaDict, 'en');
    expect(result['test']).toBeDefined();
  });

  it('handles parseTsv → convertToArpabet pipeline', () => {
    const tsv = 'bonjour\t/bɔ̃ʒuʁ/\nmerci\t/mɛʁsi/\n';
    const ipaDict = parseTsv(tsv);
    const arpabetDict = convertToArpabet(ipaDict, 'fr');
    // Both words should produce some ARPAbet output
    expect(Object.keys(arpabetDict).length).toBeGreaterThan(0);
  });

  it('skips entries that produce empty ARPAbet', () => {
    // An empty IPA should produce no entry
    const ipaDict = { empty: '/' };
    const result = convertToArpabet(ipaDict, 'en');
    expect(result['empty']).toBeUndefined();
  });
});

describe('deriveInflection', () => {
  it.each([
    ['öga', '/²øːɡa/', 'ögon', '/²øːɡɔn/', 'replaces the lemma ending'],
    ['häst', '/hɛsːt/', 'hästarna', '/hɛsːtaɳa/', 'appends an ending, rn as retroflex'],
    ['rum', '/rɵm/', 'rummet', '/rɵmɛt/', 'pronounces a consonant doubled across the split once'],
    ['glömma', '/²ɡlœmːa/', 'glöm', '/²ɡlœmː/', 'strips past length marks and a doubled consonant'],
    ['vacker', '/ˈvakːɛr/', 'vackra', '/ˈvakːra/', 'strips a two-letter ending'],
    ['god', '/ɡuːd/', 'gott', '/ɡuːt/', 'pronounces a doubled consonant in the ending once'],
    ['flicka', '/ˈflɪkːˌa/', 'flick', '/ˈflɪkː/', 'drops stress marks left dangling at the end'],
    ['stjärna', '/ˈɧɛːɳa/', 'stjärnor', '/ˈɧɛːɳɔr/', 'strips a retroflex digraph'],
  ])('%s %s → %s %s (%s)', (base, baseIpa, form, expected) => {
    expect(deriveInflection(base, baseIpa, form, 'sv')).toBe(expected);
  });

  it.each([
    ['fot', '/fuːt/', 'fötter', 'sv', 'the stem changes'],
    ['gå', '/ɡoː/', 'gå', 'xx', 'the language has no ending table'],
    ['stad', '/stɑːd/', 'städer', 'sv', 'the shared prefix has no vowel'],
    ['ögonen', '/²øːɡɔnɛn/', 'ögat', 'sv', 'the base ending is too long'],
    ['öga', '/²øːɡa/', 'ögonenskapen', 'sv', 'the form ending is too long'],
    ['öga', '/øːɡe/', 'ögon', 'sv', "the base IPA doesn't end in its ending"],
    ['öga', '/øːɡa/', 'ögx', 'sv', 'the form ending has a letter outside the table'],
  ])('%s → %s is undefined when %s', (base, baseIpa, form, lang) => {
    expect(deriveInflection(base, baseIpa, form, lang)).toBeUndefined();
  });
});

describe('expandParadigms', () => {
  it('adds forms from the transcribed member sharing the longest prefix, never from derived forms', () => {
    const ipaDict: Record<string, string> = { fot: '/fuːt/', fötter: '/fœtːɛr/' };
    const paradigms = parseParadigms('fot\tfoten\tfötter\tfötterna\n\nxyz\txyzs\n');
    expect(expandParadigms(ipaDict, paradigms, 'sv')).toBe(2);
    expect(ipaDict).toEqual({
      fot: '/fuːt/',
      foten: '/fuːtɛn/',
      fötter: '/fœtːɛr/',
      fötterna: '/fœtːɛrna/',
    });
  });

  it('skips forms no base can derive', () => {
    const ipaDict: Record<string, string> = { gå: '/ɡoː/' };
    expect(expandParadigms(ipaDict, [['gå', 'gick']], 'sv')).toBe(0);
  });
});

describe('paradigm languages', () => {
  it('extracts paradigms for exactly the languages with an ending table', () => {
    const extracted = LANGUAGES.filter((l) => l.paradigms).map((l) => l.code);
    expect(extracted.sort()).toEqual(Object.keys(ENDING_IPA).sort());
  });

  it('names the paradigm file after the language', () => {
    expect(paradigmsFile('sv')).toBe('sv.forms.tsv');
  });
});
