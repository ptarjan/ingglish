import { translateSync } from 'ingglish';
import { describe, it, expect, vi } from 'vitest';
import { isInitialism, KNOWN_INITIALISMS } from './index';

describe('initialisms', () => {
  describe('isInitialism', () => {
    it('should recognize known initialisms', () => {
      expect(isInitialism('UI')).toBe(true);
      expect(isInitialism('ui')).toBe(true);
      expect(isInitialism('API')).toBe(true);
      expect(isInitialism('Url')).toBe(true);
      expect(isInitialism('US')).toBe(true);
    });

    it('should not recognize non-initialisms', () => {
      expect(isInitialism('hello')).toBe(false);
      expect(isInitialism('UNKNOWN')).toBe(false);
      expect(isInitialism('xyz')).toBe(false);
    });

    // Fast path optimization tests - words > MAX_INITIALISM_LENGTH (5) skip lookup
    it('should skip toLowerCase for words longer than max length (fast path)', () => {
      const toLowerCaseSpy = vi.spyOn(String.prototype, 'toLowerCase');
      toLowerCaseSpy.mockClear();

      // Long word (7 chars) should return false WITHOUT calling toLowerCase
      const result = isInitialism('toolong');
      expect(result).toBe(false);
      expect(toLowerCaseSpy).not.toHaveBeenCalled();

      toLowerCaseSpy.mockRestore();
    });

    it('should call toLowerCase for words within max length (slow path)', () => {
      const toLowerCaseSpy = vi.spyOn(String.prototype, 'toLowerCase');
      toLowerCaseSpy.mockClear();

      // Short word (3 chars) should call toLowerCase for lookup
      isInitialism('api');
      expect(toLowerCaseSpy).toHaveBeenCalled();

      toLowerCaseSpy.mockRestore();
    });

    it('should verify max initialism length matches longest entry', () => {
      // Ensure our MAX_INITIALISM_LENGTH constant is correct
      // If someone adds a longer initialism, this test fails as a reminder to update the constant
      const maxLen = Math.max(...[...KNOWN_INITIALISMS].map((k) => k.length));
      expect(maxLen).toBe(5); // "https" and "nosql" are the longest
    });
  });

  describe('known initialisms pass through unchanged', () => {
    it('should pass through multi-letter initialisms unchanged', () => {
      expect(translateSync('UI', { format: 'ingglish' })).toBe('UI');
      expect(translateSync('API', { format: 'ingglish' })).toBe('API');
      expect(translateSync('URL', { format: 'ingglish' })).toBe('URL');
      expect(translateSync('HTML', { format: 'ingglish' })).toBe('HTML');
      expect(translateSync('TV', { format: 'ingglish' })).toBe('TV');
      expect(translateSync('ID', { format: 'ingglish' })).toBe('ID');
      expect(translateSync('US', { format: 'ingglish' })).toBe('US');
      expect(translateSync('USA', { format: 'ingglish' })).toBe('USA');
      expect(translateSync('UK', { format: 'ingglish' })).toBe('UK');
      expect(translateSync('AI', { format: 'ingglish' })).toBe('AI');
    });

    it('should pass through lowercase initialisms unchanged', () => {
      // lowercase "us", "it", "am" happen to translate to themselves anyway
      expect(translateSync('ui', { format: 'ingglish' })).toBe('ui');
      expect(translateSync('api', { format: 'ingglish' })).toBe('api');
    });
  });

  describe('unknown all-caps words pass through unchanged', () => {
    it('should pass through unknown all-caps words', () => {
      expect(translateSync('MQTT', { format: 'ingglish' })).toBe('MQTT');
      expect(translateSync('USSR', { format: 'ingglish' })).toBe('USSR');
      expect(translateSync('XYZZY', { format: 'ingglish' })).toBe('XYZZY');
    });

    it('should pass through all-caps acronyms-as-words via initialism list', () => {
      // NATO and NASA are in CMU dict but are in our initialism list
      expect(translateSync('NATO', { format: 'ingglish' })).toBe('NATO');
      expect(translateSync('NASA', { format: 'ingglish' })).toBe('NASA');
    });
  });

  describe('lowercase words still translate normally', () => {
    it('should translate lowercase "us" as pronoun', () => {
      const result = translateSync('us', { format: 'ingglish' });
      expect(result).toBe('us');
    });

    it('should translate lowercase "it" as pronoun', () => {
      const result = translateSync('it', { format: 'ingglish' });
      expect(result).toBe('it');
    });

    it('should translate lowercase "am" as verb', () => {
      const result = translateSync('am', { format: 'ingglish' });
      expect(result).toBe('am');
    });
  });

  describe('edge cases: initialisms that are also dictionary words', () => {
    it('should treat IT as initialism, not pronoun', () => {
      const result = translateSync('IT', { format: 'ingglish' });
      expect(result).toBe('IT');
    });

    it('should treat AM as initialism when uppercase', () => {
      const result = translateSync('AM', { format: 'ingglish' });
      expect(result).toBe('AM');
    });

    it('should treat PM as initialism', () => {
      const result = translateSync('PM', { format: 'ingglish' });
      expect(result).toBe('PM');
    });
  });

  describe('plural and possessive initialisms', () => {
    it('should handle IDs as ID + s', () => {
      const result = translateSync('IDs', { format: 'ingglish' });
      expect(result).toBe('IDs');
    });

    it('should handle TVs as TV + s', () => {
      const result = translateSync('TVs', { format: 'ingglish' });
      expect(result).toBe('TVs');
    });

    it('should handle URLs as URL + s', () => {
      const result = translateSync('URLs', { format: 'ingglish' });
      expect(result).toBe('URLs');
    });

    it('should handle APIs as API + s', () => {
      const result = translateSync('APIs', { format: 'ingglish' });
      expect(result).toBe('APIs');
    });

    it("should handle API's (possessive) correctly", () => {
      const result = translateSync("API's", { format: 'ingglish' });
      expect(result).toBe("API's");
    });

    it('should handle lowercase ids', () => {
      const result = translateSync('ids', { format: 'ingglish' });
      expect(result).toBe('ids');
    });

    it('should handle mixed case like Ids', () => {
      const result = translateSync('Ids', { format: 'ingglish' });
      expect(result).toBe('Ids');
    });
  });

  describe('IPA format with initialisms', () => {
    it('should pass through initialisms unchanged for IPA too', () => {
      expect(translateSync('UI', { format: 'ipa' })).toBe('UI');
      expect(translateSync('API', { format: 'ipa' })).toBe('API');
    });
  });

  describe('mixed case initialisms', () => {
    it('should handle title case Ui', () => {
      const result = translateSync('Ui', { format: 'ingglish' });
      // isInitialism matches case-insensitively, returns original
      expect(result).toBe('Ui');
    });

    it('should handle title case Api', () => {
      const result = translateSync('Api', { format: 'ingglish' });
      expect(result).toBe('Api');
    });
  });

  describe('sentence context', () => {
    it('should handle "eve ID" context correctly', () => {
      const result = translateSync('eve ID', { format: 'ingglish' });
      expect(result).toBe('Eev ID');
    });

    it('should handle mixed initialisms and words', () => {
      const result = translateSync('the US and UK', { format: 'ingglish' });
      expect(result).toBe('Dha US and UK');
    });
  });
});
