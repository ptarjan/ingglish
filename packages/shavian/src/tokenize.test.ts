import { describe, it, expect } from 'vitest';
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
    expect(tokens).toEqual([{ text: '𐑣𐑩𐑤𐑴', isWord: true }]);
  });

  it('should tokenize mixed text', () => {
    const tokens = tokenizeShavian('𐑣𐑩𐑤𐑴 𐑢𐑻𐑤𐑛');
    expect(tokens).toEqual([
      { text: '𐑣𐑩𐑤𐑴', isWord: true },
      { text: ' ', isWord: false },
      { text: '𐑢𐑻𐑤𐑛', isWord: true },
    ]);
  });

  it('should handle punctuation', () => {
    const tokens = tokenizeShavian('𐑣𐑩𐑤𐑴, 𐑢𐑻𐑤𐑛!');
    expect(tokens).toEqual([
      { text: '𐑣𐑩𐑤𐑴', isWord: true },
      { text: ', ', isWord: false },
      { text: '𐑢𐑻𐑤𐑛', isWord: true },
      { text: '!', isWord: false },
    ]);
  });

  it('should handle empty input', () => {
    expect(tokenizeShavian('')).toEqual([]);
  });

  it('should handle text with no Shavian', () => {
    const tokens = tokenizeShavian('hello world');
    expect(tokens).toEqual([{ text: 'hello world', isWord: false }]);
  });
});
