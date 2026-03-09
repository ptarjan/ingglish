import { reverseTranslate, translate } from 'ingglish';
import { describe, expect, it } from 'vitest';
import './index'; // registers deseret format

describe('Deseret character recognition', () => {
  it('translates to Deseret and back for lowercase Deseret chars', async () => {
    const deseret = await translate('cat', { format: 'deseret' });
    // Output should contain Deseret characters (U+10400-U+1044F)
    expect(deseret).toMatch(/[\u{10400}-\u{1044F}]/u);
    const english = await reverseTranslate(deseret, { format: 'deseret' });
    expect(english).toBe('cat');
  });

  it('passes through non-Deseret text unchanged', async () => {
    const result = await reverseTranslate('hello', { format: 'deseret' });
    expect(result).toBe('hello');
  });

  it('handles empty input', async () => {
    expect(await reverseTranslate('', { format: 'deseret' })).toBe('');
  });
});

describe('Deseret tokenization', () => {
  it('translates multi-word text', async () => {
    const deseret = await translate('cat dog', { format: 'deseret' });
    expect(deseret).toContain(' ');
    const english = await reverseTranslate(deseret, { format: 'deseret' });
    expect(english).toBe('cat dog');
  });

  it('preserves punctuation', async () => {
    const deseret = await translate('hello!', { format: 'deseret' });
    expect(deseret).toContain('!');
  });

  it('round-trips several words', async () => {
    for (const word of ['the', 'hello', 'world', 'think']) {
      const deseret = await translate(word, { format: 'deseret' });
      const english = await reverseTranslate(deseret, { format: 'deseret' });
      expect(english, `Failed round-trip for "${word}"`).toBe(word);
    }
  });
});
