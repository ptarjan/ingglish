import { describe, it, expect } from 'vitest';
import { getWordFrequency, scoreWord, sortByFrequency } from './frequency';

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

  describe('scoreWord', () => {
    it('should give lower scores to more common words', () => {
      const theScore = scoreWord('the');
      const xylophoneScore = scoreWord('xylophone');
      expect(theScore).toBeLessThan(xylophoneScore);
    });

    it('should penalize words with numbers', () => {
      const normalScore = scoreWord('hello');
      const numberedScore = scoreWord('hello2');
      expect(numberedScore).toBeGreaterThan(normalScore);
    });

    it('should penalize unknown words by length', () => {
      const shortScore = scoreWord('xyz');
      const longScore = scoreWord('xyzabcdef');
      expect(longScore).toBeGreaterThan(shortScore);
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
