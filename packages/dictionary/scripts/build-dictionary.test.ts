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
  it('removes trailing 0', () => {
    expect(stripStress('AH0')).toBe('AH');
  });

  it('removes trailing 1', () => {
    expect(stripStress('IY1')).toBe('IY');
  });

  it('removes trailing 2', () => {
    expect(stripStress('AO2')).toBe('AO');
  });

  it('leaves consonants unchanged', () => {
    expect(stripStress('TH')).toBe('TH');
    expect(stripStress('K')).toBe('K');
    expect(stripStress('NG')).toBe('NG');
  });
});

describe('getWordScore', () => {
  const freqMap = new Map([
    ['the', 1_000_000],
    ['hello', 5000],
    ["don't", 50_000],
  ]);

  it('returns frequency for known words', () => {
    expect(getWordScore('the', freqMap)).toBe(1_000_000);
    expect(getWordScore('hello', freqMap)).toBe(5000);
  });

  it('returns negative length for unknown words', () => {
    expect(getWordScore('xyz', freqMap)).toBe(-3);
    expect(getWordScore('abcdef', freqMap)).toBe(-6);
  });

  it('boosts common contractions', () => {
    const score = getWordScore("don't", freqMap);
    // Should be freq + 10_000_000 boost
    expect(score).toBe(50_000 + 10_000_000);
  });

  it('gives unknown contractions a fixed score', () => {
    // "shan't" is in COMMON_CONTRACTIONS but not in freqMap
    const score = getWordScore("shan't", freqMap);
    expect(score).toBe(5_000_000);
  });

  it('penalizes numeric words', () => {
    const score = getWordScore('abc123', freqMap);
    expect(score).toBeLessThan(-1_000_000);
  });

  it('is case-insensitive', () => {
    expect(getWordScore('THE', freqMap)).toBe(1_000_000);
    expect(getWordScore("DON'T", freqMap)).toBe(50_000 + 10_000_000);
  });
});
