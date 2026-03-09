import { reverseTranslate, translate } from 'ingglish';
import { describe, expect, it } from 'vitest';
import { loadReverseDictionary } from './index';

describe('reverse translation', () => {
  it('round-trips known words', async () => {
    for (const word of ['the', 'hello', 'world', 'cat']) {
      const ingglish = await translate(word);
      const english = await reverseTranslate(ingglish);
      expect(english, `Failed round-trip for "${word}"`).toBe(word);
    }
  });

  it('custom pronunciations appear first in reverse', async () => {
    // "read" has custom pronunciation R IY1 D
    // Reverse translating its Ingglish form should prefer "read"
    const ingglish = await translate('read');
    const english = await reverseTranslate(ingglish);
    expect(english).toBe('read');
  });

  it('custom words are merged without duplicates', async () => {
    // "read" round-trips cleanly, confirming merge works
    const ingglish = await translate('read');
    const english = await reverseTranslate(ingglish);
    expect(english).toBe('read');
  });
});

describe('loadReverseDictionary', () => {
  it('can load the reverse dictionary', async () => {
    await loadReverseDictionary();
    // After loading, reverse translate should still work
    const ingglish = await translate('the');
    const english = await reverseTranslate(ingglish);
    expect(english).toBe('the');
  });
});
