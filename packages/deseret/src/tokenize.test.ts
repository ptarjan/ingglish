import { reverseTranslateSync, translateSync } from 'ingglish';
import { describe, expect, it } from 'vitest';

describe('Deseret character recognition', () => {
  it('translates to Deseret and back for lowercase Deseret chars', () => {
    const deseret = translateSync('cat', { format: 'deseret' });
    // Output should contain Deseret characters (U+10400-U+1044F)
    expect(deseret).toMatch(/[\u{10400}-\u{1044F}]/u);
    const english = reverseTranslateSync(deseret, { format: 'deseret' });
    expect(english).toBe('cat');
  });

  it.each([
    ['hello', 'non-Deseret text'],
    ['', 'empty input'],
  ])('passes through "%s" unchanged (%s)', (input) => {
    expect(reverseTranslateSync(input, { format: 'deseret' })).toBe(input);
  });
});

describe('Deseret tokenization', () => {
  it('translates multi-word text', () => {
    const deseret = translateSync('cat dog', { format: 'deseret' });
    expect(deseret).toContain(' ');
    const english = reverseTranslateSync(deseret, { format: 'deseret' });
    expect(english).toBe('cat dog');
  });

  it('preserves punctuation', () => {
    const deseret = translateSync('hello!', { format: 'deseret' });
    expect(deseret).toContain('!');
  });

  it.each(['the', 'hello', 'world', 'think'])('round-trips "%s"', (word) => {
    const deseret = translateSync(word, { format: 'deseret' });
    const english = reverseTranslateSync(deseret, { format: 'deseret' });
    expect(english, `Failed round-trip for "${word}"`).toBe(word);
  });
});
