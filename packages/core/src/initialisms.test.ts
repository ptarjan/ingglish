import { describe, it, expect, beforeAll, vi } from 'vitest';
import {
  isInitialism,
  translateInitialism,
  setInitialismTranslateWordFn,
  INITIALISM_EXPANSIONS,
} from './translate/initialisms';
import { translateWord } from './translate/forward';
import { setupDictionary } from './test-setup';

describe('initialisms', () => {
  setupDictionary();

  beforeAll(() => {
    // Ensure translateWordFn is set
    setInitialismTranslateWordFn(translateWord);
  });

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
  });

  describe('isInitialism', () => {
    it('should recognize known initialisms', () => {
      expect(isInitialism('UI')).toBe(true);
      expect(isInitialism('ui')).toBe(true);
      expect(isInitialism('API')).toBe(true);
      expect(isInitialism('Url')).toBe(true);
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

  describe('translateInitialism', () => {
    it('should translate UI to YI (user interface → yoozer interfays)', () => {
      const result = translateInitialism('UI', 'ingglish');
      // UI = User Interface → first letters of translated words
      // user → yoozer (y), interface → interfays (i)
      // Initialisms stay all caps
      expect(result).toBe('YI');
    });

    it('should translate API with correct first letters', () => {
      const result = translateInitialism('API', 'ingglish');
      // API = Application Programming Interface
      // 3 letters all caps → stays uppercase
      expect(result).toBe('API');
    });

    it('should translate URL with first letters of translations', () => {
      const result = translateInitialism('URL', 'ingglish');
      // URL = Uniform Resource Locator
      // uniform → yooniform (y), resource → reesors (r), locator → lohkayter (l)
      // 3 letters all caps → stays uppercase
      expect(result).toBe('YRL');
    });

    it('should handle lowercase input', () => {
      const result = translateInitialism('ui', 'ingglish');
      expect(result).toBe('yi');
    });

    it('should skip connector words in expansions', () => {
      // ETA = Estimated Time of Arrival → "of" is skipped
      const result = translateInitialism('ETA', 'ingglish');
      // estimated → estimaytid (e), time → taim (t), arrival translation starts with 'e'
      // Initialisms stay all caps
      expect(result).toBe('ETE');
    });

    it('should use full digraph for words starting with sh, ch, th, etc.', () => {
      // SSH = Secure Shell
      // secure → sikyoor (s), shell → shel (sh, not just s)
      const result = translateInitialism('SSH', 'ingglish');
      expect(result).toBe('SSH');
    });

    it('should return null for unknown words', () => {
      const result = translateInitialism('UNKNOWN', 'ingglish');
      expect(result).toBe(null);
    });

    it('should return null for single-word expansions (spell out letter-by-letter instead)', () => {
      // TV = television (single word) - should return null so fallback spells it out
      // Otherwise we'd just get 'T' from the first letter of 'television'
      const tvResult = translateInitialism('TV', 'ingglish');
      expect(tvResult).toBe(null);

      // ID = identification (single word) - same issue
      const idResult = translateInitialism('ID', 'ingglish');
      expect(idResult).toBe(null);

      // UV = ultraviolet (single word)
      const uvResult = translateInitialism('UV', 'ingglish');
      expect(uvResult).toBe(null);
    });

    it('should return null for IPA format (not yet supported)', () => {
      const result = translateInitialism('UI', 'ipa');
      expect(result).toBe(null);
    });
  });

  describe('integration with translateWord', () => {
    it('should translate initialisms in full text flow', () => {
      // When using translateWord directly, initialisms should be translated
      const result = translateWord('UI', 'ingglish');
      // Initialisms stay all caps
      expect(result).toBe('YI');
    });

    it('should translate AI correctly', () => {
      const result = translateWord('AI', 'ingglish');
      // AI = Artificial Intelligence → artufishul intelijuns → AI
      expect(result).toBe('AI');
    });

    it('should spell out TV letter-by-letter (not just first letter of "television")', () => {
      // TV has single-word expansion, should be spelled out as "Tee-Vee"
      const result = translateWord('TV', 'ingglish');
      // T = "tee" → Tee, V = "vee" → Vee → combined: Teevee
      expect(result).toBe('Teevee');
    });

    it('should spell out ID letter-by-letter', () => {
      // ID has single-word expansion, should be spelled out as "Eye-Dee"
      const result = translateWord('ID', 'ingglish');
      // I = "eye" → Ai, D = "dee" → Dee → combined: Aidee
      expect(result).toBe('Aidee');
    });
  });

  describe('edge cases: initialisms that are also dictionary words', () => {
    it('should treat IT as initialism, not pronoun', () => {
      // IT = Information Technology (initialism), also "it" (pronoun)
      // When uppercase, should be treated as initialism
      const result = translateWord('IT', 'ingglish');
      expect(result).toBe('IT'); // Information Technology → IT
    });

    it('should treat lowercase "it" as regular word', () => {
      // lowercase "it" should be the pronoun, not initialism
      const result = translateWord('it', 'ingglish');
      expect(result).toBe('it'); // pronoun translates to "it"
    });

    it('should treat AM as initialism when uppercase', () => {
      // AM = Ante Meridiem
      const result = translateWord('AM', 'ingglish');
      // ante → antee (a), meridiem → muridieum (m)
      expect(result).toBe('AM');
    });

    it('should treat lowercase "am" as verb', () => {
      // "am" is the verb (I am)
      const result = translateWord('am', 'ingglish');
      expect(result).toBe('am'); // verb "am" → "am"
    });

    it('should treat PM as initialism', () => {
      const result = translateWord('PM', 'ingglish');
      // post → pohst (p), meridiem → muridieum (m)
      expect(result).toBe('PM');
    });
  });

  describe('IPA format with initialisms', () => {
    it('should fall back to dictionary/rules for IPA since expansion not supported', () => {
      // translateInitialism returns null for IPA, so it falls through
      const result = translateWord('UI', 'ipa');
      // Should get some IPA output (either from dictionary or fallback)
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle API in IPA format', () => {
      const result = translateWord('API', 'ipa');
      expect(result).toBeDefined();
    });
  });

  describe('mixed case initialisms', () => {
    it('should handle title case Ui', () => {
      const result = translateWord('Ui', 'ingglish');
      // Title case should become uppercase (initialism)
      expect(result).toBe('YI');
    });

    it('should handle title case Api', () => {
      const result = translateWord('Api', 'ingglish');
      expect(result).toBe('API');
    });
  });
});
