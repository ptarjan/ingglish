import { reverseTranslateSync, translateSync } from 'ingglish';
import { describe, expect, it } from 'vitest';
import { isShavianChar } from './tokenize';

describe('Shavian character recognition', () => {
  it('translates to Shavian and back', () => {
    const shavian = translateSync('cat', { format: 'shavian' });
    // Output should contain Shavian characters (U+10450-U+1047F)
    expect(shavian).toMatch(/[\u{10450}-\u{1047F}]/u);
    const english = reverseTranslateSync(shavian, { format: 'shavian' });
    expect(english).toBe('cat');
  });

  it('passes through non-Shavian text unchanged', () => {
    expect(reverseTranslateSync('hello', { format: 'shavian' })).toBe('hello');
    expect(reverseTranslateSync('', { format: 'shavian' })).toBe('');
  });
});

describe('Shavian tokenization', () => {
  it('translates multi-word text', () => {
    const shavian = translateSync('cat dog', { format: 'shavian' });
    expect(shavian).toContain(' ');
    const english = reverseTranslateSync(shavian, { format: 'shavian' });
    expect(english).toBe('cat dog');
  });

  it('preserves punctuation', () => {
    const shavian = translateSync('hello!', { format: 'shavian' });
    expect(shavian).toContain('!');
  });

  it.each(['the', 'hello', 'world', 'think'])('round-trips "%s" through Shavian', (word) => {
    const shavian = translateSync(word, { format: 'shavian' });
    const english = reverseTranslateSync(shavian, { format: 'shavian' });
    expect(english).toBe(word);
  });
});

describe('isShavianChar', () => {
  it('returns false for empty string', () => {
    expect(isShavianChar('')).toBe(false);
  });
});
