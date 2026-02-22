import { describe, expect, it } from 'vitest';
import { getDictionary, isDictionaryLoaded, loadDictionary } from './loader';

describe('getDictionary', () => {
  it('returns a dictionary object (loaded via vitest.setup.ts)', () => {
    const dict = getDictionary();
    expect(dict).toBeDefined();
    expect(typeof dict).toBe('object');
  });

  it('has expected entries for common words', () => {
    const dict = getDictionary();
    expect(dict.hello).toBeDefined();
    expect(dict.the).toBeDefined();
    expect(dict.world).toBeDefined();
    expect(Array.isArray(dict.hello)).toBe(true);
  });
});

describe('isDictionaryLoaded', () => {
  it('returns true (loaded in setup)', () => {
    expect(isDictionaryLoaded()).toBe(true);
  });
});

describe('loadDictionary', () => {
  it('returns same object on repeated calls (caching)', async () => {
    const dict1 = await loadDictionary();
    const dict2 = await loadDictionary();
    expect(dict1).toBe(dict2); // Same reference
  });

  it('concurrent calls return same promise (deduplication)', async () => {
    // Both calls should resolve to the same cached object
    const [dict1, dict2] = await Promise.all([loadDictionary(), loadDictionary()]);
    expect(dict1).toBe(dict2);
  });
});
