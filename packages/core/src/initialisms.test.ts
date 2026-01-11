import { describe, it, expect, beforeAll } from 'vitest';
import {
  isInitialism,
  translateInitialism,
  setInitialismTranslateWordFn,
  INITIALISM_EXPANSIONS,
} from './translate/initialisms';
import { translateWord } from './translate/forward';

describe('initialisms', () => {
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

    it('should return null for unknown words', () => {
      const result = translateInitialism('UNKNOWN', 'ingglish');
      expect(result).toBe(null);
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
