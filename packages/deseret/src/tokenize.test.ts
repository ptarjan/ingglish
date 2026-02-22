import { describe, expect, it } from 'vitest';
import { isDeseretChar, tokenizeDeseret } from './tokenize';

describe('isDeseretChar', () => {
  it('returns true for lowercase Deseret', () => {
    expect(isDeseretChar('𐐨')).toBe(true); // U+10428
    expect(isDeseretChar('𐑍')).toBe(true); // U+1044D
    expect(isDeseretChar('𐑏')).toBe(true); // U+1044F
  });

  it('returns true for uppercase Deseret', () => {
    expect(isDeseretChar('𐐀')).toBe(true); // U+10400
    expect(isDeseretChar('𐐧')).toBe(true); // U+10427
  });

  it('returns false for non-Deseret', () => {
    expect(isDeseretChar('a')).toBe(false);
    expect(isDeseretChar('𐑐')).toBe(false); // Shavian
  });

  it('returns false for empty string', () => {
    expect(isDeseretChar('')).toBe(false);
  });
});

describe('tokenizeDeseret', () => {
  it('tokenizes pure Deseret text', () => {
    const tokens = tokenizeDeseret('𐐿𐐰𐐻');
    expect(tokens).toEqual([{ isWord: true, text: '𐐿𐐰𐐻' }]);
  });

  it('tokenizes mixed text', () => {
    const tokens = tokenizeDeseret('𐐿𐐰𐐻 𐐼𐐫𐑀');
    expect(tokens).toEqual([
      { isWord: true, text: '𐐿𐐰𐐻' },
      { isWord: false, text: ' ' },
      { isWord: true, text: '𐐼𐐫𐑀' },
    ]);
  });

  it('tokenizes text with punctuation', () => {
    const tokens = tokenizeDeseret('𐐸𐐱𐑊𐐬!');
    expect(tokens).toEqual([
      { isWord: true, text: '𐐸𐐱𐑊𐐬' },
      { isWord: false, text: '!' },
    ]);
  });

  it('returns empty array for empty string', () => {
    expect(tokenizeDeseret('')).toEqual([]);
  });

  it('handles pure ASCII text', () => {
    const tokens = tokenizeDeseret('hello');
    expect(tokens).toEqual([{ isWord: false, text: 'hello' }]);
  });
});
