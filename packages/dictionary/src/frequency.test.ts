import { describe, expect, it } from 'vitest';
import { getWordFrequency, sortByFrequency } from './index';

describe('word-frequency', () => {
  describe('getWordFrequency', () => {
    it('should return frequency for common words', () => {
      const freq = getWordFrequency('the');
      expect(freq).toBeDefined();
      expect(freq).toBeGreaterThan(0);
    });

    it('should be case-insensitive', () => {
      expect(getWordFrequency('the')).toBe(getWordFrequency('THE'));
      expect(getWordFrequency('Hello')).toBe(getWordFrequency('hello'));
    });

    it('should return undefined for non-words', () => {
      expect(getWordFrequency('xyzzy123')).toBeUndefined();
      expect(getWordFrequency('asdfghjkl')).toBeUndefined();
    });
  });

  describe('sortByFrequency', () => {
    it('should sort words by frequency (most common first)', () => {
      const words = ['xylophone', 'the', 'cat'];
      const sorted = sortByFrequency(words);
      expect(sorted[0]).toBe('the');
    });

    it('should not mutate original array', () => {
      const words = ['b', 'a', 'c'];
      const original = [...words];
      sortByFrequency(words);
      expect(words).toEqual(original);
    });

    it('should handle empty array', () => {
      expect(sortByFrequency([])).toEqual([]);
    });

    it('should prefer real words over numbered variants', () => {
      const words = ['hello2', 'hello'];
      const sorted = sortByFrequency(words);
      expect(sorted[0]).toBe('hello');
    });
  });
});
