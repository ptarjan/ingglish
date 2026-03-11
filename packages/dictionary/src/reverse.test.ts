import { reverseTranslateSync, translateSync } from 'ingglish';
import { describe, expect, it } from 'vitest';
import { clearReverseDictionaryCache, loadReverseDictionary } from './reverse';

describe('reverse translation', () => {
  it.each(['the', 'hello', 'world', 'cat'])('round-trips "%s"', (word) => {
    const ingglish = translateSync(word);
    const english = reverseTranslateSync(ingglish);
    expect(english, `Failed round-trip for "${word}"`).toBe(word);
  });

  it('custom pronunciations appear first in reverse', () => {
    // "read" has custom pronunciation R IY1 D
    // Reverse translating its Ingglish form should prefer "read"
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

describe('clearReverseDictionaryCache', () => {
  it('clears cache and allows reload', async () => {
    clearReverseDictionaryCache();
    // Reload after clearing
    await loadReverseDictionary();
    // Verify it works after reload
    const ingglish = translateSync('hello');
    const english = reverseTranslateSync(ingglish);
    expect(english).toBe('hello');
  });
});
