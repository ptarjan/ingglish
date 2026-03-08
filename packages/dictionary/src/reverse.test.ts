import { describe, expect, it } from 'vitest';
import { loadReverseDictionary, lookupPhonemeKey } from './index';

describe('lookupPhonemeKey', () => {
  it('returns words for known phoneme sequences', () => {
    // "the" = DH AH -> should map back to words including "the"
    const result = lookupPhonemeKey('DH AH');
    expect(result).toBeDefined();
    expect(result!.length).toBeGreaterThan(0);
  });

  it('returns undefined for unknown phoneme sequences', () => {
    const result = lookupPhonemeKey('ZH ZH ZH ZH');
    expect(result).toBeUndefined();
  });

  it('custom pronunciations appear first in results', () => {
    // "read" has custom pronunciation R IY D
    // If there are dictionary words with the same phoneme key, "read" should come first
    const result = lookupPhonemeKey('R IY D');
    expect(result).toBeDefined();
    expect(result![0]).toBe('read');
  });

  it('custom words are merged with dictionary results without duplicates', () => {
    // "read" has custom pronunciation R IY D, and "reed"/"reid" may also map there
    const result = lookupPhonemeKey('R IY D');
    expect(result).toBeDefined();
    // Check no duplicates
    const unique = new Set(result);
    expect(unique.size).toBe(result!.length);
  });
});

describe('loadReverseDictionary', () => {
  it('can load the reverse dictionary', async () => {
    await loadReverseDictionary();
    // After loading, lookupPhonemeKey should still work
    const result = lookupPhonemeKey('DH AH');
    expect(result).toBeDefined();
  });
});
