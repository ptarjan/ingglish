import { describe, it, expect } from 'vitest';
import {
  lookupPhonemeKey,
  getReverseDictionary,
  clearReverseDictionaryCache,
  loadReverseDictionary,
} from './reverse';

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

describe('getReverseDictionary', () => {
  it('returns a dictionary object (loaded via vitest.setup.ts)', () => {
    const dict = getReverseDictionary();
    expect(dict).toBeDefined();
    expect(typeof dict).toBe('object');
  });

  it('has expected structure: string keys, string[] values', () => {
    const dict = getReverseDictionary();
    const keys = Object.keys(dict);
    expect(keys.length).toBeGreaterThan(0);

    // Check a few entries
    const firstKey = keys[0]!;
    const value = dict[firstKey];
    expect(Array.isArray(value)).toBe(true);
    expect(typeof value![0]).toBe('string');
  });
});

describe('clearReverseDictionaryCache', () => {
  it('after clearing, getReverseDictionary throws', () => {
    clearReverseDictionaryCache();
    expect(() => getReverseDictionary()).toThrow('Reverse dictionary not loaded');
  });

  it('can reload after clearing', async () => {
    // Cache was cleared in the previous test
    await loadReverseDictionary();
    const dict = getReverseDictionary();
    expect(dict).toBeDefined();
    expect(Object.keys(dict).length).toBeGreaterThan(0);
  });
});
