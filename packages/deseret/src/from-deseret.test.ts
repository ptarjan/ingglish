import { describe, expect, it } from 'vitest';
import { deseretToArpabet } from './from-deseret';

describe('deseretToArpabet', () => {
  it('parses consonants', () => {
    expect(deseretToArpabet('𐐺𐐰𐐻')).toEqual(['B', 'AE', 'T']);
  });

  it('parses vowels', () => {
    expect(deseretToArpabet('𐑅𐐨')).toEqual(['S', 'IY']);
  });

  it('parses diphthongs', () => {
    expect(deseretToArpabet('𐑋𐐴')).toEqual(['M', 'AY']);
    expect(deseretToArpabet('𐐺𐑎')).toEqual(['B', 'OY']);
  });

  it('expands Ew ligature to Y + UW', () => {
    // 𐐿𐑏𐐻 = K + Ew + T = K Y UW T
    expect(deseretToArpabet('𐐿𐑏𐐻')).toEqual(['K', 'Y', 'UW', 'T']);
  });

  it('normalizes uppercase to lowercase', () => {
    // 𐐒 (uppercase B, U+10412) → same as 𐐺 (lowercase, U+1043A)
    expect(deseretToArpabet('𐐒𐐰𐐻')).toEqual(['B', 'AE', 'T']);
  });

  it('skips non-Deseret characters', () => {
    expect(deseretToArpabet('𐐺 𐐰 𐐻')).toEqual(['B', 'AE', 'T']);
  });

  it('returns null for empty or non-Deseret input', () => {
    expect(deseretToArpabet('')).toBeNull();
    expect(deseretToArpabet('hello')).toBeNull();
  });

  it('parses all consonants', () => {
    const text = '𐐹𐐺𐐻𐐼𐐿𐑀𐑁𐑂𐑃𐑄𐑅𐑆𐑇𐑈𐐽𐐾𐑋𐑌𐑍𐑊𐑉𐐶𐐷𐐸';
    const expected = [
      'P',
      'B',
      'T',
      'D',
      'K',
      'G',
      'F',
      'V',
      'TH',
      'DH',
      'S',
      'Z',
      'SH',
      'ZH',
      'CH',
      'JH',
      'M',
      'N',
      'NG',
      'L',
      'R',
      'W',
      'Y',
      'HH',
    ];
    expect(deseretToArpabet(text)).toEqual(expected);
  });
});
