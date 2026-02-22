import { describe, expect, it } from 'vitest';
import { isShavianChar, tokenizeShavian } from './tokenize';

describe('isShavianChar', () => {
  it('should detect Shavian characters', () => {
    expect(isShavianChar('𐑐')).toBe(true); // P
    expect(isShavianChar('𐑖')).toBe(true); // SH
    expect(isShavianChar('𐑻')).toBe(true); // ER ligature
  });

  it('should reject non-Shavian characters', () => {
    expect(isShavianChar('a')).toBe(false);
    expect(isShavianChar('Z')).toBe(false);
    expect(isShavianChar(' ')).toBe(false);
    expect(isShavianChar('.')).toBe(false);
    expect(isShavianChar('')).toBe(false);
  });
});

describe('tokenizeShavian', () => {
  it('should tokenize pure Shavian text', () => {
    const tokens = tokenizeShavian('𐑣𐑩𐑤𐑴');
    expect(tokens).toEqual([{ isWord: true, text: '𐑣𐑩𐑤𐑴' }]);
  });

  it('should tokenize mixed text', () => {
    const tokens = tokenizeShavian('𐑣𐑩𐑤𐑴 𐑢𐑻𐑤𐑛');
    expect(tokens).toEqual([
      { isWord: true, text: '𐑣𐑩𐑤𐑴' },
      { isWord: false, text: ' ' },
      { isWord: true, text: '𐑢𐑻𐑤𐑛' },
    ]);
  });

  it('should handle punctuation', () => {
    const tokens = tokenizeShavian('𐑣𐑩𐑤𐑴, 𐑢𐑻𐑤𐑛!');
    expect(tokens).toEqual([
      { isWord: true, text: '𐑣𐑩𐑤𐑴' },
      { isWord: false, text: ', ' },
      { isWord: true, text: '𐑢𐑻𐑤𐑛' },
      { isWord: false, text: '!' },
    ]);
  });

  it('should handle empty input', () => {
    expect(tokenizeShavian('')).toEqual([]);
  });

  it('should handle text with no Shavian', () => {
    const tokens = tokenizeShavian('hello world');
    expect(tokens).toEqual([{ isWord: false, text: 'hello world' }]);
  });
});
