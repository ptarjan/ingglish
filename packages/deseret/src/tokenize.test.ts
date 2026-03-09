import { describe, expect, it } from 'vitest';
import { deseretToArpabet } from './index';

describe('Deseret character recognition', () => {
  it('converts lowercase Deseret characters', () => {
    expect(deseretToArpabet('𐐨')).not.toBeNull(); // U+10428
    expect(deseretToArpabet('𐑍')).not.toBeNull(); // U+1044D
    expect(deseretToArpabet('𐑏')).not.toBeNull(); // U+1044F
  });

  it('converts uppercase Deseret characters', () => {
    expect(deseretToArpabet('𐐀')).not.toBeNull(); // U+10400
    expect(deseretToArpabet('𐐧')).not.toBeNull(); // U+10427
  });

  it('rejects non-Deseret characters', () => {
    expect(deseretToArpabet('a')).toBeNull();
    expect(deseretToArpabet('𐑐')).toBeNull(); // Shavian
  });

  it('returns null for empty string', () => {
    expect(deseretToArpabet('')).toBeNull();
  });
});

describe('Deseret tokenization', () => {
  it('tokenizes pure Deseret text', () => {
    const result = deseretToArpabet('𐐿𐐰𐐻');
    expect(result).not.toBeNull();
    expect(result!.length).toBeGreaterThan(0);
  });

  it('tokenizes multi-word Deseret text', () => {
    const result = deseretToArpabet('𐐿𐐰𐐻 𐐼𐐫𐑀');
    expect(result).not.toBeNull();
    expect(result!.length).toBeGreaterThan(3);
  });

  it('skips punctuation between Deseret words', () => {
    const withPunct = deseretToArpabet('𐐸𐐱𐑊𐐬!');
    const without = deseretToArpabet('𐐸𐐱𐑊𐐬');
    expect(withPunct).toEqual(without);
  });

  it('returns null for pure ASCII text', () => {
    expect(deseretToArpabet('hello')).toBeNull();
  });
});
