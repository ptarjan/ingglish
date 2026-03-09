import { reverseTranslate, translate } from 'ingglish';
import { describe, expect, it } from 'vitest';
import './index'; // registers shavian format

describe('Shavian character recognition', () => {
  it('translates to Shavian and back', async () => {
    const shavian = await translate('cat', { format: 'shavian' });
    // Output should contain Shavian characters (U+10450-U+1047F)
    expect(shavian).toMatch(/[\u{10450}-\u{1047F}]/u);
    const english = await reverseTranslate(shavian, { format: 'shavian' });
    expect(english).toBe('cat');
  });

  it('passes through non-Shavian text unchanged', async () => {
    expect(await reverseTranslate('hello', { format: 'shavian' })).toBe('hello');
    expect(await reverseTranslate('', { format: 'shavian' })).toBe('');
  });
});

describe('Shavian tokenization', () => {
  it('translates multi-word text', async () => {
    const shavian = await translate('cat dog', { format: 'shavian' });
    expect(shavian).toContain(' ');
    const english = await reverseTranslate(shavian, { format: 'shavian' });
    expect(english).toBe('cat dog');
  });

  it('preserves punctuation', async () => {
    const shavian = await translate('hello!', { format: 'shavian' });
    expect(shavian).toContain('!');
  });

  it('round-trips several words', async () => {
    for (const word of ['the', 'hello', 'world', 'think']) {
      const shavian = await translate(word, { format: 'shavian' });
      const english = await reverseTranslate(shavian, { format: 'shavian' });
      expect(english, `Failed round-trip for "${word}"`).toBe(word);
    }
  });
});
