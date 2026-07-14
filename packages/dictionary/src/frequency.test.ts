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

    it.each([
      ['the', 'THE'],
      ['Hello', 'hello'],
    ])('should be case-insensitive: %s vs %s', (a, b) => {
      expect(getWordFrequency(a)).toBe(getWordFrequency(b));
    });

    it.each(['xyzzy123', 'asdfghjkl'])('should return undefined for non-word: %s', (word) => {
      expect(getWordFrequency(word)).toBeUndefined();
    });
  });

  describe('getCorpusTotal', () => {
    it('returns a positive number when loaded', () => {
      const total = getCorpusTotal();
      expect(total).toBeGreaterThan(0);
    });
  });

  describe('scoreWord', () => {
    it('ranks a frequency-less contraction above its rare homophone', () => {
      // "won't" lacks SUBTLEX frequency data but should still outrank (score
      // lower than) its rare true-homophone "wont" (freq ~81).
      expect(scoreWord("won't")).toBeLessThan(scoreWord('wont'));
    });

    it('ranks a frequency-less contraction below a much more common homophone', () => {
      // "they're" must NOT beat "there" (freq ~221k), a far more common word.
      expect(scoreWord("they're")).toBeGreaterThan(scoreWord('there'));
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

    // Single-letter dictionary entries ("q", "t", "b") carry inflated corpus
    // frequencies from tokenization artifacts (SUBTLEX "t" ≈ 733k) and are
    // almost never the intended reverse translation — "kyoo" should give
    // "cue"/"queue", not "q". Only "a" and "i" are genuine words.
    it.each([
      ['q', 'queue'],
      ['q', 'cue'],
      ['t', 'tea'],
      ['b', 'bee'],
    ])('ranks the letter "%s" below the real word "%s"', (letter, word) => {
      expect(scoreWord(letter)).toBeGreaterThan(scoreWord(word));
    });

    it.each(['a', 'i'])('still ranks "%s" as a real word', (letter) => {
      expect(scoreWord(letter)).toBeLessThan(0);
    });

    it('ranks a single letter above unknown junk words', () => {
      expect(scoreWord('q')).toBeLessThan(scoreWord('zzzq'));
    });
  });

  describe('sortByFrequency', () => {
    it.each([
      [['xylophone', 'the', 'cat'], 'the', 'most common first'],
      [['hello2', 'hello'], 'hello', 'real words over numbered variants'],
    ])('should sort: %s → first is "%s" (%s)', (words, expectedFirst) => {
      const sorted = sortByFrequency(words);
      expect(sorted[0]).toBe(expectedFirst);
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
  });
});
