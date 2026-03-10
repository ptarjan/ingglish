import { describe, expect, it, vi } from 'vitest';
import { applyCasePattern, detectCasePattern, splitCamelCase } from './index';

describe('case-utils', () => {
  describe('detectCasePattern', () => {
    it.each([
      ['hello', 'lower'],
      ['world', 'lower'],
      ['ég', 'lower'],
      ['über', 'lower'],
      ['', 'lower'],
    ] as const)('should detect lowercase: %s → %s', (input, expected) => {
      expect(detectCasePattern(input)).toBe(expected);
    });

    it.each([
      ['HELLO', 'upper'],
      ['NASA', 'upper'],
      ['API', 'upper'],
      ['ÜBER', 'upper'],
    ] as const)('should detect uppercase: %s → %s', (input, expected) => {
      expect(detectCasePattern(input)).toBe(expected);
    });

    it.each([
      ['UI', 'capitalized'],
      ['AI', 'capitalized'],
      ['IT', 'capitalized'],
      ['ÉG', 'capitalized'],
      ['Hello', 'capitalized'],
      ['World', 'capitalized'],
      ['A', 'capitalized'],
      ['Ég', 'capitalized'],
      ['Über', 'capitalized'],
      ['Ölaf', 'capitalized'],
    ] as const)('should detect capitalized: %s → %s', (input, expected) => {
      expect(detectCasePattern(input)).toBe(expected);
    });

    it.each([
      ['a', 'lower'],
      ['i', 'lower'],
      ['I', 'lower'],
      ['5', 'lower'],
    ] as const)('should handle single character: %s → %s', (input, expected) => {
      expect(detectCasePattern(input)).toBe(expected);
    });

    it.each([
      ['GitHub', 'mixed'],
      ['iPhone', 'mixed'],
      ['McDonald', 'mixed'],
      ['hElLo', 'mixed'],
      ['\u00E9\u00C9', 'mixed'],
    ] as const)('should detect mixed case: %s → %s', (input, expected) => {
      expect(detectCasePattern(input)).toBe(expected);
    });
  });

  describe('applyCasePattern', () => {
    it.each([
      ['HELLO', 'lower', undefined, 'hello'],
      ['Hello', 'lower', undefined, 'hello'],
      ['hello', 'upper', undefined, 'HELLO'],
      ['Hello', 'upper', undefined, 'HELLO'],
      ['hello', 'capitalized', undefined, 'Hello'],
      ['HELLO', 'capitalized', undefined, 'Hello'],
      ['', 'upper', undefined, ''],
      ['', 'lower', undefined, ''],
      ['', 'capitalized', undefined, ''],
    ] as const)('should apply %s with pattern %s → %s', (input, pattern, _original, expected) => {
      expect(applyCasePattern(input, pattern)).toBe(expected);
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

    it('should return lowercase for invalid pattern (default case)', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      expect(applyCasePattern('Test', 'invalid' as any)).toBe('test');
    });
  });

  describe('round-trip', () => {
    it.each([
      ['hello', 'world', 'world'],
      ['HELLO', 'world', 'WORLD'],
      ['Hello', 'world', 'World'],
    ] as const)(
      'should preserve case pattern through detect -> apply: %s',
      (word, translated, expected) => {
        const pattern = detectCasePattern(word);
        const result = applyCasePattern(translated, pattern, word);
        expect(result).toBe(expected);
      }
    );

    it('should preserve mixed case through detect -> apply', () => {
      const pattern = detectCasePattern('GitHub');
      expect(pattern).toBe('mixed');
      const result = applyCasePattern('github', pattern, 'GitHub');
      expect(result).toBe('GitHub');
    });
  });

  describe('splitCamelCase', () => {
    it.each([
      ['iCloud', ['i', 'Cloud']],
      ['iPhone', ['i', 'Phone']],
      ['MacBook', ['Mac', 'Book']],
      ['sunLight', ['sun', 'Light']],
      ['myAwesomeApp', ['my', 'Awesome', 'App']],
      ['getHTTPResponse', ['get', 'HTTPResponse']],
      ['hasInternalA', ['has', 'Internal', 'A']],
      ['endsWithZ', ['ends', 'With', 'Z']],
      ['testAend', ['test', 'Aend']],
      ['testZend', ['test', 'Zend']],
    ] as const)('should split camelCase: %s', (input, expected) => {
      expect(splitCamelCase(input)).toEqual(expected);
    });

    it.each([
      'hello',
      'HELLO',
      'Hello',
      '',
      'a',
      'lowercase',
      'alllowercase',
      'Uppercase',
      'test123',
      'version2',
      'hello_world',
      'test@end',
      'test[end',
    ])('should return null for non-camelCase: %s', (input) => {
      expect(splitCamelCase(input)).toBeNull();
    });

    it.each(
      Array.from({ length: 26 }, (_, i) => {
        const charCode = 65 + i;
        const char = String.fromCodePoint(charCode);
        return [`a${char}`, ['a', char]] as const;
      })
    )('should detect camelCase boundary for A-Z: %s', (word, expected) => {
      expect(splitCamelCase(word)).toEqual(expected);
    });

    it.each(['a@', 'a[', 'a0', 'a '])(
      'should not detect boundary for non-A-Z char: %s',
      (input) => {
        expect(splitCamelCase(input)).toBeNull();
      }
    );

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
