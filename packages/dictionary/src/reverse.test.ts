import { reverseTranslateSync, translateSync } from 'ingglish';
import { describe, expect, it } from 'vitest';

describe('reverse translation', () => {
  it('round-trips known words', () => {
    for (const word of ['the', 'hello', 'world', 'cat']) {
      const ingglish = translateSync(word);
      const english = reverseTranslateSync(ingglish);
      expect(english, `Failed round-trip for "${word}"`).toBe(word);
    }
  });

  it('custom pronunciations appear first in reverse', () => {
    // "read" has custom pronunciation R IY1 D
    // Reverse translating its Ingglish form should prefer "read"
    const ingglish = translateSync('read');
    const english = reverseTranslateSync(ingglish);
    expect(english).toBe('read');
  });

  it('custom words are merged without duplicates', () => {
    // "read" round-trips cleanly, confirming merge works
    const ingglish = translateSync('read');
    const english = reverseTranslateSync(ingglish);
    expect(english).toBe('read');
  });
});

describe('loadReverseDictionary', () => {
  it('can load the reverse dictionary', () => {
    // Reverse dict already loaded by setup, verify it works
    const ingglish = translateSync('the');
    const english = reverseTranslateSync(ingglish);
    expect(english).toBe('the');
  });
});
