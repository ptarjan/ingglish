import { describe, expect, it } from 'vitest';
import { applyDefaultStress, convertToArpabet, MANUAL_ENTRIES, parseTsv } from './build-ipa-dicts';

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
