import { describe, it, expect, vi } from 'vitest';
import { isInitialism, INITIALISM_EXPANSIONS } from '@ingglish/fallback';
import { translateSync, translateWord } from './translate/forward';

describe('initialisms', () => {
  describe('INITIALISM_EXPANSIONS', () => {
    it('should have expansions for common tech initialisms', () => {
      expect(INITIALISM_EXPANSIONS.ui).toEqual(['user', 'interface']);
      expect(INITIALISM_EXPANSIONS.api).toEqual(['application', 'programming', 'interface']);
      expect(INITIALISM_EXPANSIONS.url).toEqual(['uniform', 'resource', 'locator']);
      expect(INITIALISM_EXPANSIONS.cpu).toEqual(['central', 'processing', 'unit']);
    });

    it('should have expansions for AI-related terms', () => {
      expect(INITIALISM_EXPANSIONS.ai).toEqual(['artificial', 'intelligence']);
      expect(INITIALISM_EXPANSIONS.ml).toEqual(['machine', 'learning']);
      expect(INITIALISM_EXPANSIONS.llm).toEqual(['large', 'language', 'model']);
    });

    it('should have US as an initialism', () => {
      expect(INITIALISM_EXPANSIONS.us).toEqual(['united', 'states']);
    });
  });

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
      const maxLen = Math.max(...Object.keys(INITIALISM_EXPANSIONS).map((k) => k.length));
      expect(maxLen).toBe(5); // "https" and "nosql" are the longest
    });
  });

  describe('known initialisms pass through unchanged', () => {
    it('should pass through multi-letter initialisms unchanged', () => {
      expect(translateWord('UI', 'ingglish')).toBe('UI');
      expect(translateWord('API', 'ingglish')).toBe('API');
      expect(translateWord('URL', 'ingglish')).toBe('URL');
      expect(translateWord('HTML', 'ingglish')).toBe('HTML');
      expect(translateWord('TV', 'ingglish')).toBe('TV');
      expect(translateWord('ID', 'ingglish')).toBe('ID');
      expect(translateWord('US', 'ingglish')).toBe('US');
      expect(translateWord('USA', 'ingglish')).toBe('USA');
      expect(translateWord('UK', 'ingglish')).toBe('UK');
      expect(translateWord('AI', 'ingglish')).toBe('AI');
    });

    it('should pass through lowercase initialisms unchanged', () => {
      // lowercase "us", "it", "am" happen to translate to themselves anyway
      expect(translateWord('ui', 'ingglish')).toBe('ui');
      expect(translateWord('api', 'ingglish')).toBe('api');
    });
  });

  describe('unknown all-caps words pass through unchanged', () => {
    it('should pass through unknown all-caps words', () => {
      expect(translateWord('MQTT', 'ingglish')).toBe('MQTT');
      expect(translateWord('USSR', 'ingglish')).toBe('USSR');
      expect(translateWord('XYZZY', 'ingglish')).toBe('XYZZY');
    });

    it('should pass through all-caps acronyms-as-words via initialism list', () => {
      // NATO and NASA are in CMU dict but are in our initialism list
      expect(translateWord('NATO', 'ingglish')).toBe('NATO');
      expect(translateWord('NASA', 'ingglish')).toBe('NASA');
    });
  });

  describe('lowercase words still translate normally', () => {
    it('should translate lowercase "us" as pronoun', () => {
      const result = translateWord('us', 'ingglish');
      expect(result).toBe('us');
    });

    it('should translate lowercase "it" as pronoun', () => {
      const result = translateWord('it', 'ingglish');
      expect(result).toBe('it');
    });

    it('should translate lowercase "am" as verb', () => {
      const result = translateWord('am', 'ingglish');
      expect(result).toBe('am');
    });
  });

  describe('edge cases: initialisms that are also dictionary words', () => {
    it('should treat IT as initialism, not pronoun', () => {
      const result = translateWord('IT', 'ingglish');
      expect(result).toBe('IT');
    });

    it('should treat AM as initialism when uppercase', () => {
      const result = translateWord('AM', 'ingglish');
      expect(result).toBe('AM');
    });

    it('should treat PM as initialism', () => {
      const result = translateWord('PM', 'ingglish');
      expect(result).toBe('PM');
    });
  });

  describe('plural and possessive initialisms', () => {
    it('should handle IDs as ID + s', () => {
      const result = translateWord('IDs', 'ingglish');
      expect(result).toBe('IDs');
    });

    it('should handle TVs as TV + s', () => {
      const result = translateWord('TVs', 'ingglish');
      expect(result).toBe('TVs');
    });

    it('should handle URLs as URL + s', () => {
      const result = translateWord('URLs', 'ingglish');
      expect(result).toBe('URLs');
    });

    it('should handle APIs as API + s', () => {
      const result = translateWord('APIs', 'ingglish');
      expect(result).toBe('APIs');
    });

    it("should handle API's (possessive) correctly", () => {
      const result = translateWord("API's", 'ingglish');
      expect(result).toBe("API's");
    });

    it('should handle lowercase ids', () => {
      const result = translateWord('ids', 'ingglish');
      expect(result).toBe('ids');
    });

    it('should handle mixed case like Ids', () => {
      const result = translateWord('Ids', 'ingglish');
      expect(result).toBe('Ids');
    });
  });

  describe('IPA format with initialisms', () => {
    it('should pass through initialisms unchanged for IPA too', () => {
      expect(translateWord('UI', 'ipa')).toBe('UI');
      expect(translateWord('API', 'ipa')).toBe('API');
    });
  });

  describe('mixed case initialisms', () => {
    it('should handle title case Ui', () => {
      const result = translateWord('Ui', 'ingglish');
      // isInitialism matches case-insensitively, returns original
      expect(result).toBe('Ui');
    });

    it('should handle title case Api', () => {
      const result = translateWord('Api', 'ingglish');
      expect(result).toBe('Api');
    });
  });

  describe('sentence context', () => {
    it('should handle "eve ID" context correctly', () => {
      const result = translateSync('eve ID', 'ingglish');
      expect(result).toBe('Eev ID');
    });

    it('should handle mixed initialisms and words', () => {
      const result = translateSync('the US and UK', 'ingglish');
      expect(result).toBe('Dha US and UK');
    });
  });
});
