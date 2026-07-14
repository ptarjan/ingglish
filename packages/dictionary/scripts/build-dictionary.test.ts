import { describe, expect, it } from 'vitest';
import { getWordScore, parseDictionary, stripStress } from './build-dictionary';

describe('parseDictionary', () => {
  it('parses simple entries', () => {
    const text = 'hello HH AH0 L OW1\nworld W ER1 L D\n';
    const dict = parseDictionary(text);
    expect(dict['hello']).toEqual(['HH', 'AH0', 'L', 'OW1']);
    expect(dict['world']).toEqual(['W', 'ER1', 'L', 'D']);
  });

  it('lowercases words', () => {
    const text = 'HELLO HH AH0 L OW1\n';
    const dict = parseDictionary(text);
    expect(dict['hello']).toEqual(['HH', 'AH0', 'L', 'OW1']);
    expect(dict['HELLO']).toBeUndefined();
  });

  it('strips variant suffixes like (2)', () => {
    const text = 'READ R IY1 D\nREAD(2) R EH1 D\n';
    const dict = parseDictionary(text);
    // Only keeps first pronunciation
    expect(dict['read']).toEqual(['R', 'IY1', 'D']);
  });

  it('skips comments and empty lines', () => {
    const text = ';;; this is a comment\n\nhello HH AH0 L OW1\n';
    const dict = parseDictionary(text);
    expect(Object.keys(dict)).toEqual(['hello']);
  });

  it('strips inline # comments from phonemes', () => {
    // cmudict.dict annotates some entries: "AALBORG AO1 L B AO0 R G # place, danish"
    const text = 'aalborg AO1 L B AO0 R G # place, danish\ngdp G IY1 D IY1 P IY1 # abbrev\n';
    const dict = parseDictionary(text);
    expect(dict['aalborg']).toEqual(['AO1', 'L', 'B', 'AO0', 'R', 'G']);
    expect(dict['gdp']).toEqual(['G', 'IY1', 'D', 'IY1', 'P', 'IY1']);
    expect(dict['aalborg']).not.toContain('#');
  });

  it('normalizes velar nasals (N before K/G becomes NG)', () => {
    const text = 'think TH IH1 N K\nsing S IH1 N G\n';
    const dict = parseDictionary(text);
    expect(dict['think']).toEqual(['TH', 'IH1', 'NG', 'K']);
    expect(dict['sing']).toEqual(['S', 'IH1', 'NG', 'G']);
  });

  it('does not normalize N when not followed by K or G', () => {
    const text = 'ten T EH1 N\n';
    const dict = parseDictionary(text);
    expect(dict['ten']).toEqual(['T', 'EH1', 'N']);
  });
});

describe('stripStress', () => {
  it.each([
    ['AH0', 'AH', 'removes trailing 0'],
    ['IY1', 'IY', 'removes trailing 1'],
    ['AO2', 'AO', 'removes trailing 2'],
    ['TH', 'TH', 'leaves consonant TH unchanged'],
    ['K', 'K', 'leaves consonant K unchanged'],
    ['NG', 'NG', 'leaves consonant NG unchanged'],
  ])('stripStress(%s) → %s (%s)', (input, expected) => {
    expect(stripStress(input)).toBe(expected);
  });
});

describe('getWordScore', () => {
  const freqMap = new Map([
    ['the', 1_000_000],
    ['hello', 5000],
    ["don't", 50_000],
  ]);

  it.each([
    ['the', 1_000_000, 'returns frequency for known word'],
    ['hello', 5000, 'returns frequency for known word'],
    ['xyz', -100_003, 'penalizes unknown words by length'],
    ['abcdef', -100_006, 'penalizes unknown words by length'],
    ["don't", 50_000 + 10_000_000, 'boosts common contractions'],
    ["shan't", 50_000, 'gives unknown contractions a fixed score'],
    ['THE', 1_000_000, 'is case-insensitive'],
    ["DON'T", 50_000 + 10_000_000, 'is case-insensitive for contractions'],
    ['q', -50_000, 'ranks single letters below every real word'],
  ])('getWordScore(%s) → %d (%s)', (word, expected) => {
    expect(getWordScore(word, freqMap)).toBe(expected);
  });

  it('penalizes numeric words', () => {
    const score = getWordScore('abc123', freqMap);
    expect(score).toBeLessThan(-1_000_000);
  });
});
