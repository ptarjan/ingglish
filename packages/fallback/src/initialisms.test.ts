import { translateSync } from 'ingglish';
import { describe, it, expect, vi } from 'vitest';
import { isInitialism, KNOWN_INITIALISMS } from './index';

describe('initialisms', () => {
  describe('isInitialism performance', () => {
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
    it.each(['UI', 'API', 'URL', 'HTML', 'TV', 'ID', 'US', 'USA', 'UK', 'AI', 'CPU', 'ML', 'LLM'])(
      'should pass through %s unchanged',
      (word) => {
        expect(translateSync(word)).toBe(word);
      }
    );

    it.each(['ui', 'api'])('should pass through lowercase %s unchanged', (word) => {
      expect(translateSync(word)).toBe(word);
    });
  });

  describe('unknown all-caps words pass through unchanged', () => {
    it.each(['MQTT', 'USSR', 'XYZZY'])('should pass through %s unchanged', (word) => {
      expect(translateSync(word)).toBe(word);
    });

    it.each(['NATO', 'NASA'])('should pass through %s via initialism list', (word) => {
      expect(translateSync(word)).toBe(word);
    });
  });

  describe('lowercase words still translate normally', () => {
    it.each(['us', 'it', 'am'])('should translate lowercase "%s" unchanged', (word) => {
      expect(translateSync(word)).toBe(word);
    });
  });

  describe('edge cases: initialisms that are also dictionary words', () => {
    it.each(['IT', 'AM', 'PM'])('should treat %s as initialism, not dictionary word', (word) => {
      expect(translateSync(word)).toBe(word);
    });
  });

  describe('plural and possessive initialisms', () => {
    it.each(['IDs', 'TVs', 'URLs', 'APIs'])('should pass through %s unchanged', (word) => {
      expect(translateSync(word)).toBe(word);
    });

    it.each(["API's", 'ids', 'Ids'])('should pass through %s unchanged', (word) => {
      expect(translateSync(word)).toBe(word);
    });
  });

  describe('IPA format with initialisms', () => {
    it.each(['UI', 'API'])('should pass through %s unchanged for IPA too', (word) => {
      expect(translateSync(word, { format: 'ipa' })).toBe(word);
    });
  });

  describe('mixed case initialisms', () => {
    it.each(['Ui', 'Api'])('should pass through title-case %s unchanged', (word) => {
      expect(translateSync(word)).toBe(word);
    });
  });

  describe('sentence context', () => {
    it('should handle "eve ID" context correctly', () => {
      const result = translateSync('eve ID');
      expect(result).toBe('Eev ID');
    });

    it('should handle mixed initialisms and words', () => {
      const result = translateSync('the US and UK');
      expect(result).toBe('Dha US and UK');
    });
  });
});
