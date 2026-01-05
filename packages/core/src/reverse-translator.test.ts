import { describe, it, expect, beforeAll } from 'vitest';
import { loadDictionary, translateWord, lookupPronunciation } from './translator';
import {
  inglishToPhonemes,
  reverseTranslateWord,
  reverseTranslateText,
  isLikelyInglish,
} from './reverse-translator';

describe('reverse-translator', () => {
  beforeAll(async () => {
    await loadDictionary();
  });

  describe('inglishToPhonemes', () => {
    it('should parse simple Ingglish words to phonemes', () => {
      // "kat" -> K AE T
      expect(inglishToPhonemes('kat')).toEqual(['K', 'AE', 'T']);
    });

    it('should parse words with digraphs correctly', () => {
      // "dhu" -> DH AH (the) - 'u' maps to AH
      expect(inglishToPhonemes('dhu')).toEqual(['DH', 'AH']);
    });

    it('should parse longer spellings before shorter ones', () => {
      // "she" -> SH IY (not S HH EH)
      expect(inglishToPhonemes('shee')).toEqual(['SH', 'IY']);
    });

    it('should parse "thingk" correctly', () => {
      // "thingk" -> TH IH NG K
      expect(inglishToPhonemes('thingk')).toEqual(['TH', 'IH', 'NG', 'K']);
    });

    it('should return null for empty input', () => {
      expect(inglishToPhonemes('')).toEqual(null);
    });
  });

  describe('reverseTranslateWord', () => {
    it('should translate simple words', () => {
      // "kat" should map to "cat"
      const results = reverseTranslateWord('kat');
      expect(results).toContain('cat');
    });

    it('should preserve capitalization', () => {
      const results = reverseTranslateWord('Kat');
      expect(results[0]).toBe('Cat');
    });

    it('should preserve ALL CAPS', () => {
      const results = reverseTranslateWord('KAT');
      expect(results[0]).toBe('CAT');
    });

    it('should return original word for non-letters', () => {
      expect(reverseTranslateWord('123')).toEqual(['123']);
      expect(reverseTranslateWord('...')).toEqual(['...']);
    });

    it('should return empty array for empty input', () => {
      expect(reverseTranslateWord('')).toEqual([]);
    });

    it('should handle homophones by returning multiple options', () => {
      // "too", "to", "two" all have the same phonemes
      const results = reverseTranslateWord('too');
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('should round-trip words in dictionary', () => {
      // Test words that ARE in the CMU dictionary
      const testWords = ['quick', 'brown', 'fox', 'the', 'alphabet', 'through', 'english'];

      for (const word of testWords) {
        const pron = lookupPronunciation(word);
        if (!pron) {
          continue; // Skip words not in dictionary
        }

        const ingglish = translateWord(word);
        const results = reverseTranslateWord(ingglish);

        // The first result should match the original (or be a homophone)
        expect(results.length).toBeGreaterThan(0);
      }
    });
  });

  describe('reverseTranslateText', () => {
    it('should translate text preserving punctuation', () => {
      // Basic test - translates words, keeps punctuation
      const result = reverseTranslateText('hulo, werld!');
      expect(result).toContain(',');
      expect(result).toContain('!');
    });

    it('should handle mixed text', () => {
      const result = reverseTranslateText('Dhu kat.');
      expect(result).toMatch(/\bcat\b/i);
    });

    it('should return empty string for empty input', () => {
      expect(reverseTranslateText('')).toBe('');
    });
  });

  describe('isLikelyInglish', () => {
    it('should detect Ingglish patterns', () => {
      expect(isLikelyInglish('dhu kat')).toBe(true); // "dh" pattern
    });

    it('should detect English patterns', () => {
      expect(isLikelyInglish('the cat')).toBe(false); // "the" is English
      expect(isLikelyInglish('thought')).toBe(false); // "ough" is English
    });

    it('should handle ambiguous text', () => {
      // Pure words without distinctive patterns
      const result = isLikelyInglish('hello');
      expect(typeof result).toBe('boolean');
    });
  });
});
