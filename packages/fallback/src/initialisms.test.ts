import { translateSync } from 'ingglish';
import { describe, it, expect, vi } from 'vitest';
import { isInitialism, KNOWN_INITIALISMS, letterSpellingPhonemes } from './index';

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

  describe('initialisms pass through unchanged', () => {
    it.each([
      // known uppercase
      'UI',
      'API',
      'URL',
      'HTML',
      'TV',
      'ID',
      'US',
      'USA',
      'UK',
      'AI',
      'CPU',
      'ML',
      'LLM',
      // known lowercase whose dictionary entry is the spelled-letters reading
      'ui',
      'api',
      'pm',
      'sql',
      // unknown all-caps
      'MQTT',
      'USSR',
      'XYZZY',
      // all-caps via initialism list
      'NATO',
      'NASA',
      // uppercase initialisms that are also dictionary words
      'IT',
      'AM',
      'PM',
      // plurals and possessives
      'IDs',
      'TVs',
      'URLs',
      'APIs',
      "API's",
      'ids',
      'Ids',
      // mixed case
      'Ui',
      'Api',
    ])('passes through %s unchanged', (word) => {
      expect(translateSync(word)).toBe(word);
    });

    it.each(['UI', 'API'])('passes through %s unchanged for IPA too', (word) => {
      expect(translateSync(word, { format: 'ipa' })).toBe(word);
    });
  });

  // Lowercase (and title-case) words that collide with initialism keys but
  // have a real word reading in the dictionary ("us" → AH1 S, not "you-es")
  // are ordinary English words — the dictionary wins, matching what
  // non-Latin formats already did. Keys whose dictionary entry IS the
  // spelled-letters reading ("pm", "api", "ids") keep the passthrough above.
  describe('lowercase dictionary words win over initialism collisions', () => {
    it.each([
      ['us', 'uhs'],
      ['it', 'it'],
      ['am', 'am'],
      ['id', 'id'],
      ['ide', 'aid'],
      ['nato', 'naytoh'],
      ['ram', 'ram'],
      ['crud', 'kruhd'],
    ])('translates "%s" via the dictionary to "%s"', (word, expected) => {
      expect(translateSync(word)).toBe(expected);
    });

    it.each([
      ['Us', 'Uhs'],
      ['Nato', 'Naytoh'],
    ])('translates title-case "%s" via the dictionary to "%s"', (word, expected) => {
      expect(translateSync(word)).toBe(expected);
    });
  });

  describe('letterSpellingPhonemes', () => {
    it('spells out each letter as ARPAbet', () => {
      expect(letterSpellingPhonemes('pm')).toEqual(['P', 'IY1', 'EH1', 'M']);
    });

    it('returns null when a character has no letter pronunciation', () => {
      expect(letterSpellingPhonemes('a1')).toBeNull();
    });

    it('returns null for empty input', () => {
      expect(letterSpellingPhonemes('')).toBeNull();
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
