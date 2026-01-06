import { describe, it, expect } from 'vitest';
import { detectCasePattern, applyCasePattern } from './case-utils';

describe('case-utils', () => {
  describe('detectCasePattern', () => {
    it('should detect lowercase', () => {
      expect(detectCasePattern('hello')).toBe('lower');
      expect(detectCasePattern('world')).toBe('lower');
    });

    it('should detect uppercase', () => {
      expect(detectCasePattern('HELLO')).toBe('upper');
      expect(detectCasePattern('NASA')).toBe('upper');
    });

    it('should detect capitalized (title case)', () => {
      expect(detectCasePattern('Hello')).toBe('capitalized');
      expect(detectCasePattern('World')).toBe('capitalized');
    });

    it('should handle single characters as lowercase', () => {
      // Single chars always return 'lower' since only "I" is grammatically
      // capitalized in English, and Ingglish doesn't preserve that convention
      expect(detectCasePattern('a')).toBe('lower');
      expect(detectCasePattern('A')).toBe('lower');
      expect(detectCasePattern('I')).toBe('lower');
    });

    it('should treat mixed case as lowercase', () => {
      // Words like "McDonald" don't fit our patterns, default to lower
      expect(detectCasePattern('hElLo')).toBe('lower');
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
  });

  describe('round-trip', () => {
    it('should preserve case pattern through detect -> apply', () => {
      const testCases = [
        { word: 'hello', expected: 'world' },
        { word: 'HELLO', expected: 'WORLD' },
        { word: 'Hello', expected: 'World' },
      ];

      for (const { word, expected } of testCases) {
        const pattern = detectCasePattern(word);
        const result = applyCasePattern('world', pattern);
        expect(result).toBe(expected);
      }
    });
  });
});
