import { describe, expect, it, vi } from 'vitest';
import { applyCasePattern, detectCasePattern, splitCamelCase } from './index';

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

    it('should treat two-letter initialisms as capitalized', () => {
      expect(detectCasePattern('UI')).toBe('capitalized');
      expect(detectCasePattern('AI')).toBe('capitalized');
      expect(detectCasePattern('IT')).toBe('capitalized');
    });

    it('should detect capitalized (title case)', () => {
      expect(detectCasePattern('Hello')).toBe('capitalized');
      expect(detectCasePattern('World')).toBe('capitalized');
    });

    it('should handle single characters (I is treated as lowercase)', () => {
      expect(detectCasePattern('a')).toBe('lower');
      expect(detectCasePattern('i')).toBe('lower');
      expect(detectCasePattern('A')).toBe('capitalized');
      expect(detectCasePattern('I')).toBe('lower');
      expect(detectCasePattern('5')).toBe('lower');
    });

    it('should detect mixed case', () => {
      expect(detectCasePattern('GitHub')).toBe('mixed');
      expect(detectCasePattern('iPhone')).toBe('mixed');
      expect(detectCasePattern('McDonald')).toBe('mixed');
      expect(detectCasePattern('hElLo')).toBe('mixed');
    });

    it('returns lower for empty string', () => {
      expect(detectCasePattern('')).toBe('lower');
    });

    it('detects mixed case with Unicode uppercase after lowercase', () => {
      // \u00E9\u00C9 - lowercase first, uppercase unicode second
      expect(detectCasePattern('\u00E9\u00C9')).toBe('mixed');
    });

    it('should handle accented uppercase letters (Unicode)', () => {
      expect(detectCasePattern('Ég')).toBe('capitalized');
      expect(detectCasePattern('Über')).toBe('capitalized');
      expect(detectCasePattern('Ölaf')).toBe('capitalized');
      expect(detectCasePattern('ég')).toBe('lower');
      expect(detectCasePattern('über')).toBe('lower');
      expect(detectCasePattern('ÉG')).toBe('capitalized'); // 2-letter initialism
      expect(detectCasePattern('ÜBER')).toBe('upper');
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
      expect(applyCasePattern('github', 'mixed', 'GitHub')).toBe('GitHub');
      expect(applyCasePattern('aifon', 'mixed', 'iPhone')).toBe('aIfon');
    });

    it('should handle mixed case when translated is longer', () => {
      expect(applyCasePattern('githubextra', 'mixed', 'GitHub')).toBe('GitHubextra');
    });

    it('should handle mixed case without original (defaults to lower)', () => {
      expect(applyCasePattern('github', 'mixed')).toBe('github');
    });
  });

  describe('round-trip', () => {
    it('should preserve case pattern through detect -> apply', () => {
      const testCases = [
        { expected: 'world', translated: 'world', word: 'hello' },
        { expected: 'WORLD', translated: 'world', word: 'HELLO' },
        { expected: 'World', translated: 'world', word: 'Hello' },
      ];

      for (const { expected, translated, word } of testCases) {
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

  describe('splitCamelCase', () => {
    it('should split camelCase words at boundaries', () => {
      expect(splitCamelCase('iCloud')).toEqual(['i', 'Cloud']);
      expect(splitCamelCase('iPhone')).toEqual(['i', 'Phone']);
      expect(splitCamelCase('MacBook')).toEqual(['Mac', 'Book']);
      expect(splitCamelCase('sunLight')).toEqual(['sun', 'Light']);
    });

    it('should handle multiple boundaries', () => {
      expect(splitCamelCase('myAwesomeApp')).toEqual(['my', 'Awesome', 'App']);
      expect(splitCamelCase('getHTTPResponse')).toEqual(['get', 'HTTPResponse']);
    });

    it('should return null for non-camelCase words', () => {
      expect(splitCamelCase('hello')).toBeNull();
      expect(splitCamelCase('HELLO')).toBeNull();
      expect(splitCamelCase('Hello')).toBeNull();
    });

    it('should return null for empty or single char', () => {
      expect(splitCamelCase('')).toBeNull();
      expect(splitCamelCase('a')).toBeNull();
    });

    it('should use fast path: only check for A-Z (charCodes 65-90)', () => {
      expect(splitCamelCase('lowercase')).toBeNull();
      expect(splitCamelCase('alllowercase')).toBeNull();
      expect(splitCamelCase('Uppercase')).toBeNull();
      expect(splitCamelCase('hasInternalA')).toEqual(['has', 'Internal', 'A']);
      expect(splitCamelCase('endsWithZ')).toEqual(['ends', 'With', 'Z']);
    });

    it('should not be confused by numbers or special chars', () => {
      expect(splitCamelCase('test123')).toBeNull();
      expect(splitCamelCase('version2')).toBeNull();
      expect(splitCamelCase('hello_world')).toBeNull();
    });

    it('should correctly identify charCode boundaries for A-Z (65-90)', () => {
      expect(splitCamelCase('test@end')).toBeNull();
      expect(splitCamelCase('test[end')).toBeNull();
      expect(splitCamelCase('testAend')).toEqual(['test', 'Aend']);
      expect(splitCamelCase('testZend')).toEqual(['test', 'Zend']);
    });

    it('should use charCode-based fast path (verifies optimization assumption)', () => {
      for (let charCode = 65; charCode <= 90; charCode++) {
        const char = String.fromCodePoint(charCode);
        const word = 'a' + char;
        expect(splitCamelCase(word)).toEqual(['a', char]);
      }

      expect(splitCamelCase('a@')).toBeNull();
      expect(splitCamelCase('a[')).toBeNull();
      expect(splitCamelCase('a0')).toBeNull();
      expect(splitCamelCase('a ')).toBeNull();
    });

    it('should skip slow path for lowercase words (no array allocation)', () => {
      let pushCallCount = 0;
      const originalPush = Array.prototype.push;

      Array.prototype.push = function (...args: unknown[]) {
        pushCallCount++;
        return originalPush.apply(this, args);
      };

      try {
        const result = splitCamelCase('lowercase');
        expect(result).toBeNull();
        expect(pushCallCount).toBe(0);
      } finally {
        Array.prototype.push = originalPush;
      }
    });

    it('should use slow path for camelCase words (array allocation)', () => {
      let pushCallCount = 0;
      const originalPush = Array.prototype.push;

      Array.prototype.push = function (...args: unknown[]) {
        pushCallCount++;
        return originalPush.apply(this, args);
      };

      try {
        const result = splitCamelCase('camelCase');
        expect(result).toEqual(['camel', 'Case']);
        expect(pushCallCount).toBeGreaterThan(0);
      } finally {
        Array.prototype.push = originalPush;
      }
    });
  });

  /**
   * Performance regression tests
   */
  describe('performance optimizations', () => {
    it('detectCasePattern should avoid toLowerCase for ASCII lowercase words', () => {
      const toLowerCaseSpy = vi.spyOn(String.prototype, 'toLowerCase');

      // ASCII lowercase words use codepoint loop — zero toLowerCase calls
      toLowerCaseSpy.mockClear();
      detectCasePattern('hello');
      expect(toLowerCaseSpy).toHaveBeenCalledTimes(0);

      // Capitalized words also use charCode loop instead of slice+toLowerCase
      toLowerCaseSpy.mockClear();
      detectCasePattern('Hello');
      expect(toLowerCaseSpy).toHaveBeenCalledTimes(0);

      toLowerCaseSpy.mockRestore();
    });

    it('applyCasePattern should return same string reference for already-lowercase input', () => {
      const lowercaseWord = 'hello';
      const result = applyCasePattern(lowercaseWord, 'lower');
      expect(result).toBe(lowercaseWord);
      expect(Object.is(result, lowercaseWord)).toBe(true);
    });

    it('applyCasePattern should create new string only when case change is needed', () => {
      const mixedCaseWord = 'Hello';
      const result = applyCasePattern(mixedCaseWord, 'lower');
      expect(result).toBe('hello');
      expect(Object.is(result, mixedCaseWord)).toBe(false);
    });

    it('detectCasePattern should handle many lowercase words without toLowerCase', () => {
      const toLowerCaseSpy = vi.spyOn(String.prototype, 'toLowerCase');

      const lowercaseWords = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog'];

      toLowerCaseSpy.mockClear();
      for (const word of lowercaseWords) {
        expect(detectCasePattern(word)).toBe('lower');
      }

      // All ASCII lowercase — zero toLowerCase calls via codepoint loop
      expect(toLowerCaseSpy).toHaveBeenCalledTimes(0);

      toLowerCaseSpy.mockRestore();
    });
  });
});
