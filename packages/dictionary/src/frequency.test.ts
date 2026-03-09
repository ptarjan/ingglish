import { describe, expect, it } from 'vitest';
import { scoreWord } from './frequency';
import { getCorpusTotal, getWordFrequency, sortByFrequency } from './index';

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

  describe('getCorpusTotal', () => {
    it('returns a positive number when loaded', () => {
      const total = getCorpusTotal();
      expect(total).toBeGreaterThan(0);
    });
  });

  describe('scoreWord', () => {
    it('boosts common contractions with frequency data', () => {
      // "won't" is a common contraction and should score lower (better) than a regular word
      const contractionScore = scoreWord("won't");
      const regularScore = scoreWord('the');
      expect(contractionScore).toBeLessThan(regularScore);
    });

    it('gives unknown contractions a boost score', () => {
      // A contraction not in the frequency data but in COMMON_CONTRACTIONS
      // should still get a negative score
      const score = scoreWord("shan't");
      expect(score).toBeLessThan(0);
    });

    it('penalizes words with numbers', () => {
      const score = scoreWord('hello2');
      expect(score).toBeGreaterThan(0);
      // Score should include word length
      const score2 = scoreWord('hi3');
      expect(score2).toBeLessThan(score); // shorter word = smaller penalty
    });

    it('penalizes unknown words by length', () => {
      const shortScore = scoreWord('zzz');
      const longScore = scoreWord('zzzzzz');
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
