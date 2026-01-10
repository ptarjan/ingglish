import { describe, it, expect } from 'vitest';
import { detectCasePattern, applyCasePattern } from './utils/case';

describe('case-utils', () => {
  describe('detectCasePattern', () => {
    it('should detect lowercase', () => {
      expect(detectCasePattern('hello')).toBe('lower');
      expect(detectCasePattern('world')).toBe('lower');
    });

    it('should detect uppercase', () => {
      expect(detectCasePattern('HELLO')).toBe('upper');
      expect(detectCasePattern('NASA')).toBe('upper');
      expect(detectCasePattern('API')).toBe('upper');
    });

    it('should treat short all-caps words as capitalized', () => {
      // 2-letter all-caps words like "UI", "AI" should be capitalized, not all uppercase
      // This makes translations more natural (e.g., "Yuai" instead of "YUAI")
      expect(detectCasePattern('UI')).toBe('capitalized');
      expect(detectCasePattern('AI')).toBe('capitalized');
      expect(detectCasePattern('IT')).toBe('capitalized');
    });

    it('should detect capitalized (title case)', () => {
      expect(detectCasePattern('Hello')).toBe('capitalized');
      expect(detectCasePattern('World')).toBe('capitalized');
    });

    it('should handle single characters', () => {
      // Lowercase single chars
      expect(detectCasePattern('a')).toBe('lower');
      expect(detectCasePattern('i')).toBe('lower');
      // Uppercase single chars (preserves "A" at start of sentence)
      expect(detectCasePattern('A')).toBe('capitalized');
      expect(detectCasePattern('I')).toBe('capitalized');
      // Non-letter characters
      expect(detectCasePattern('5')).toBe('lower');
    });

    it('should detect mixed case', () => {
      // Words like "GitHub", "iPhone", "McDonald" have internal capitals
      expect(detectCasePattern('GitHub')).toBe('mixed');
      expect(detectCasePattern('iPhone')).toBe('mixed');
      expect(detectCasePattern('McDonald')).toBe('mixed');
      expect(detectCasePattern('hElLo')).toBe('mixed');
    });
  });

  describe('applyCasePattern', () => {
    it('should apply lowercase', () => {
      expect(applyCasePattern('HELLO', 'lower')).toBe('hello');
      expect(applyCasePattern('Hello', 'lower')).toBe('hello');
    });

    it('should apply uppercase', () => {
      expect(applyCasePattern('hello', 'upper')).toBe('HELLO');
      expect(applyCasePattern('Hello', 'upper')).toBe('HELLO');
    });

    it('should apply capitalized', () => {
      expect(applyCasePattern('hello', 'capitalized')).toBe('Hello');
      expect(applyCasePattern('HELLO', 'capitalized')).toBe('Hello');
    });

    it('should handle empty strings', () => {
      expect(applyCasePattern('', 'upper')).toBe('');
      expect(applyCasePattern('', 'lower')).toBe('');
      expect(applyCasePattern('', 'capitalized')).toBe('');
    });

    it('should apply mixed case with original word', () => {
      // "GitHub" -> "github" should preserve caps at positions 0 and 3
      expect(applyCasePattern('github', 'mixed', 'GitHub')).toBe('GitHub');
      // "iPhone" has 'P' uppercase at position 1, so position 1 becomes uppercase
      expect(applyCasePattern('aifon', 'mixed', 'iPhone')).toBe('aIfon');
    });

    it('should handle mixed case when translated is longer', () => {
      // If translated is longer than original, extra chars are lowercase
      expect(applyCasePattern('githubextra', 'mixed', 'GitHub')).toBe('GitHubextra');
    });

    it('should handle mixed case without original (defaults to lower)', () => {
      expect(applyCasePattern('github', 'mixed')).toBe('github');
    });
  });

  describe('round-trip', () => {
    it('should preserve case pattern through detect -> apply', () => {
      const testCases = [
        { word: 'hello', translated: 'world', expected: 'world' },
        { word: 'HELLO', translated: 'world', expected: 'WORLD' },
        { word: 'Hello', translated: 'world', expected: 'World' },
      ];

      for (const { word, translated, expected } of testCases) {
        const pattern = detectCasePattern(word);
        const result = applyCasePattern(translated, pattern, word);
        expect(result).toBe(expected);
      }
    });

    it('should preserve mixed case through detect -> apply', () => {
      const pattern = detectCasePattern('GitHub');
      expect(pattern).toBe('mixed');
      const result = applyCasePattern('github', pattern, 'GitHub');
      expect(result).toBe('GitHub');
    });
  });
});
