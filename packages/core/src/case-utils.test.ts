import { describe, it, expect } from 'vitest';
import { detectCasePattern, applyCasePattern, splitCamelCase } from './utils/case';
import { translateWord } from './translate/forward';
import { setupDictionary } from './test-setup';

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
      // 2-letter initialisms like "UI", "AI" should be capitalized, not all uppercase
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
      // "I" is special: always capitalized in English by convention, but just a pronoun
      // Treat as lowercase for translation purposes
      expect(detectCasePattern('I')).toBe('lower');
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

  describe('splitCamelCase', () => {
    it('should split camelCase words at boundaries', () => {
      expect(splitCamelCase('iCloud')).toEqual(['i', 'Cloud']);
      expect(splitCamelCase('iPhone')).toEqual(['i', 'Phone']);
      expect(splitCamelCase('MacBook')).toEqual(['Mac', 'Book']);
      expect(splitCamelCase('sunLight')).toEqual(['sun', 'Light']);
    });

    it('should handle multiple boundaries', () => {
      expect(splitCamelCase('myAwesomeApp')).toEqual(['my', 'Awesome', 'App']);
      // Note: consecutive uppercase letters stay together since only lowercase->uppercase is a boundary
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

    // Fast path optimization tests - ensure charCode-based check works correctly
    it('should use fast path: only check for A-Z (charCodes 65-90)', () => {
      // Words with only lowercase letters should hit fast path and return null
      expect(splitCamelCase('lowercase')).toBeNull();
      expect(splitCamelCase('alllowercase')).toBeNull();

      // Words with uppercase only at position 0 should return null (not camelCase)
      expect(splitCamelCase('Uppercase')).toBeNull();

      // Words with internal uppercase should be detected
      expect(splitCamelCase('hasInternalA')).toEqual(['has', 'Internal', 'A']);
      expect(splitCamelCase('endsWithZ')).toEqual(['ends', 'With', 'Z']);
    });

    it('should not be confused by numbers or special chars', () => {
      // Numbers (charCodes 48-57) should not trigger uppercase detection
      expect(splitCamelCase('test123')).toBeNull();
      expect(splitCamelCase('version2')).toBeNull();

      // Special chars should not trigger uppercase detection
      expect(splitCamelCase('hello_world')).toBeNull();
    });

    it('should correctly identify charCode boundaries for A-Z (65-90)', () => {
      // Test charCode boundary: 64 is '@', 65 is 'A', 90 is 'Z', 91 is '['
      // Characters just outside A-Z range should not be detected as uppercase
      expect(splitCamelCase('test@end')).toBeNull(); // @ = 64
      expect(splitCamelCase('test[end')).toBeNull(); // [ = 91

      // Characters at A-Z boundaries should be detected
      expect(splitCamelCase('testAend')).toEqual(['test', 'Aend']); // A = 65
      expect(splitCamelCase('testZend')).toEqual(['test', 'Zend']); // Z = 90
    });

    it('should use charCode-based fast path (verifies optimization assumption)', () => {
      // This test verifies that the charCode range 65-90 correctly identifies A-Z
      // If the implementation changes to use a different method, this test ensures
      // the boundary behavior is preserved

      // Test all uppercase letters at position 1+ trigger camelCase detection
      for (let charCode = 65; charCode <= 90; charCode++) {
        const char = String.fromCharCode(charCode);
        const word = 'a' + char; // e.g., "aA", "aB", ..., "aZ"
        expect(splitCamelCase(word)).toEqual(['a', char]);
      }

      // Test characters just outside A-Z don't trigger detection
      expect(splitCamelCase('a@')).toBeNull(); // 64
      expect(splitCamelCase('a[')).toBeNull(); // 91
      expect(splitCamelCase('a0')).toBeNull(); // 48 (number)
      expect(splitCamelCase('a ')).toBeNull(); // 32 (space)
    });
  });

  describe('camelCase translation', () => {
    setupDictionary();

    it('should translate iCloud with capital at component boundary', () => {
      // "iCloud" should become "ieKlowd" not "iEklowd"
      // The K should be capitalized because "Cloud" starts with capital C
      const result = translateWord('iCloud');
      expect(result).toBe('ieKlowd');
    });

    it('should translate iPhone with capital at component boundary', () => {
      const result = translateWord('iPhone');
      expect(result).toBe('ieFohn');
    });

    it('should translate MacBook preserving both capitals', () => {
      const result = translateWord('MacBook');
      expect(result).toBe('MakBook');
    });

    it('should handle unknown camelCase words', () => {
      // Unknown words should also preserve camelCase boundaries
      const result = translateWord('fooBar');
      expect(result).toBe('fuuBar');
    });
  });
});
