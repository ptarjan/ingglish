import { describe, expect, it } from 'vitest';
import { shavianToArpabet } from './from-shavian';
import { arpabetToShavian } from './to-shavian';

describe('shavianToArpabet', () => {
  it('should parse consonants', () => {
    expect(shavianToArpabet('𐑐')).toEqual(['P']);
    expect(shavianToArpabet('𐑚')).toEqual(['B']);
    expect(shavianToArpabet('𐑑')).toEqual(['T']);
    expect(shavianToArpabet('𐑛')).toEqual(['D']);
    expect(shavianToArpabet('𐑒')).toEqual(['K']);
    expect(shavianToArpabet('𐑜')).toEqual(['G']);
  });

  it('should parse vowels', () => {
    expect(shavianToArpabet('𐑭')).toEqual(['AA']);
    expect(shavianToArpabet('𐑨')).toEqual(['AE']);
    expect(shavianToArpabet('𐑳')).toEqual(['AH']);
    expect(shavianToArpabet('𐑩')).toEqual(['AH']); // schwa
    expect(shavianToArpabet('𐑧')).toEqual(['EH']);
    expect(shavianToArpabet('𐑦')).toEqual(['IH']);
    expect(shavianToArpabet('𐑰')).toEqual(['IY']);
  });

  it('should parse diphthongs', () => {
    expect(shavianToArpabet('𐑬')).toEqual(['AW']);
    expect(shavianToArpabet('𐑲')).toEqual(['AY']);
    expect(shavianToArpabet('𐑱')).toEqual(['EY']);
    expect(shavianToArpabet('𐑴')).toEqual(['OW']);
    expect(shavianToArpabet('𐑶')).toEqual(['OY']);
  });

  it('should expand R-colored ligatures', () => {
    expect(shavianToArpabet('𐑸')).toEqual(['AA', 'R']); // start
    expect(shavianToArpabet('𐑹')).toEqual(['AO', 'R']); // north
    expect(shavianToArpabet('𐑺')).toEqual(['EH', 'R']); // square
    expect(shavianToArpabet('𐑼')).toEqual(['AH', 'R']); // letter
    expect(shavianToArpabet('𐑽')).toEqual(['IH', 'R']); // near
  });

  it('should parse "hello" in Shavian', () => {
    // 𐑣𐑩𐑤𐑴 → HH AH L OW
    expect(shavianToArpabet('𐑣𐑩𐑤𐑴')).toEqual(['HH', 'AH', 'L', 'OW']);
  });

  it('should parse "cat" in Shavian', () => {
    // 𐑒𐑨𐑑 → K AE T
    expect(shavianToArpabet('𐑒𐑨𐑑')).toEqual(['K', 'AE', 'T']);
  });

  it('should skip non-Shavian characters', () => {
    expect(shavianToArpabet('𐑒 𐑨')).toEqual(['K', 'AE']);
    expect(shavianToArpabet('hello')).toBeNull();
  });

  it('should return null for empty input', () => {
    expect(shavianToArpabet('')).toBeNull();
  });

  it('should round-trip simple phonemes', () => {
    // Forward: K AE T → 𐑒𐑨𐑑, Reverse: 𐑒𐑨𐑑 → K AE T
    const forward = arpabetToShavian(['K', 'AE1', 'T']);
    const back = shavianToArpabet(forward);
    expect(back).toEqual(['K', 'AE', 'T']);
  });
});
