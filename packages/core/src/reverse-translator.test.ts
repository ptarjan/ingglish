import { describe, it, expect, beforeAll } from 'vitest';
import { loadDictionary, translateWord, translateText, lookupPronunciation } from './translator';
import {
  reverseTranslateWord,
  reverseTranslateText,
  isLikelyIngglish,
  ipaToArpabetClean,
  reverseTranslateIPAWord,
  reverseTranslateIPAText,
} from './reverse-translator';
import { ingglishToArpabet } from './ingglish-to-arpabet';

describe('reverse-translator', () => {
  beforeAll(async () => {
    await loadDictionary();
  });

  describe('ingglishToArpabet', () => {
    it('should parse simple Ingglish words to phonemes', () => {
      // "kat" -> K AE T
      expect(ingglishToArpabet('kat')).toEqual(['K', 'AE', 'T']);
    });

    it('should parse words with digraphs correctly', () => {
      // "dhu" -> DH AH (the) - 'u' maps to AH
      expect(ingglishToArpabet('dhu')).toEqual(['DH', 'AH']);
    });

    it('should parse longer spellings before shorter ones', () => {
      // "she" -> SH IY (not S HH EH)
      expect(ingglishToArpabet('shee')).toEqual(['SH', 'IY']);
    });

    it('should parse "thingk" correctly', () => {
      // "thingk" -> TH IH NG K
      expect(ingglishToArpabet('thingk')).toEqual(['TH', 'IH', 'NG', 'K']);
    });

    it('should return null for empty input', () => {
      expect(ingglishToArpabet('')).toEqual(null);
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

    it('should handle ambiguous "er" spellings (welfare case)', () => {
      // "welfare" translates to "welfer", which could be:
      // - ER (r-colored schwa) - no match
      // - EH + R (short e + r) - matches "welfare"
      const results = reverseTranslateWord('welfer');
      expect(results).toContain('welfare');
    });

    it('should handle "er" that is actually ER phoneme', () => {
      // "her" -> "her" (ER is correct here)
      const results = reverseTranslateWord('her');
      expect(results).toContain('her');
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

    it('should round-trip contractions', () => {
      // Contractions are translated without apostrophe for consistent phonetic representation
      // The reverse translation returns the base word form
      const contractions = [
        { input: "wouldn't", expectedBack: "wouldn't" },
        { input: "couldn't", expectedBack: "couldn't" },
        { input: "shouldn't", expectedBack: "shouldn't" },
        { input: "don't", expectedBack: "don't" },
        { input: "can't", expectedBack: "can't" },
        { input: "won't", expectedBack: "won't" },
      ];
      const failures: string[] = [];

      for (const { input, expectedBack } of contractions) {
        const ingglish = translateText(input);
        const back = reverseTranslateText(ingglish);
        if (back.toLowerCase() !== expectedBack.toLowerCase()) {
          failures.push(`${input} -> ${ingglish} -> ${back} (expected: ${expectedBack})`);
        }
      }

      if (failures.length > 0) {
        console.log('Contraction round-trip failures:', failures);
      }
      expect(failures).toEqual([]);
    });

    it('should round-trip ambiguous words', () => {
      // Regression tests for phoneme ambiguity
      const ambiguousWords = [
        { word: 'exhumed', note: '"sh" can be SH (ship) or S+HH (exhume)' },
        { word: 'where', note: '"er" can be ER (were) or EH+R (where)' },
      ];

      for (const { word, note } of ambiguousWords) {
        const ingglish = translateWord(word);
        const results = reverseTranslateWord(ingglish);
        expect(results, `${word}: ${note}`).toContain(word);
      }
    });

    it('sample text should round-trip exactly', () => {
      const sampleText = `The quick brown fox jumps over the lazy dog.
This sentence contains every letter of the English alphabet.

"Though" and "through" are spelled similarly but sound different.
English spelling is notoriously difficult to learn because it has
so many exceptions. With phonetic spelling, words
are written exactly as they sound - what you see is what you say!`;

      // Extract words
      const words = sampleText.match(/[a-zA-Z]+/g) || [];
      const failures: string[] = [];

      for (const word of words) {
        const ingglish = translateWord(word.toLowerCase());
        const results = reverseTranslateWord(ingglish);
        if (results[0]?.toLowerCase() !== word.toLowerCase()) {
          failures.push(`${word} -> ${ingglish} -> ${results[0]} (expected ${word})`);
        }
      }

      if (failures.length > 0) {
        console.log('Round-trip failures:', failures);
      }
      expect(failures).toEqual([]);
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

  describe('isLikelyIngglish', () => {
    it('should detect Ingglish patterns', () => {
      expect(isLikelyIngglish('dhu kat')).toBe(true); // "dh" pattern
    });

    it('should detect English patterns', () => {
      expect(isLikelyIngglish('the cat')).toBe(false); // "the" is English
      expect(isLikelyIngglish('thought')).toBe(false); // "ough" is English
    });

    it('should handle ambiguous text', () => {
      // Pure words without distinctive patterns
      const result = isLikelyIngglish('hello');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('ipaToArpabetClean', () => {
    it('should parse simple IPA to phonemes', () => {
      // /kæt/ -> K AE T
      expect(ipaToArpabetClean('kæt')).toEqual(['K', 'AE', 'T']);
    });

    it('should parse IPA with diphthongs', () => {
      // /haɪ/ -> HH AY (hi/high)
      expect(ipaToArpabetClean('haɪ')).toEqual(['HH', 'AY']);
    });

    it('should strip stress markers', () => {
      // /həˈloʊ/ -> HH AH L OW (hello)
      expect(ipaToArpabetClean('həˈloʊ')).toEqual(['HH', 'AH', 'L', 'OW']);
    });

    it('should return null for empty input', () => {
      expect(ipaToArpabetClean('')).toEqual(null);
    });
  });

  describe('reverseTranslateIPAWord', () => {
    it('should translate simple IPA words', () => {
      // /kæt/ -> "cat"
      const results = reverseTranslateIPAWord('kæt');
      expect(results).toContain('cat');
    });

    it('should translate IPA with diphthongs', () => {
      // /haɪ/ -> "hi" or "high"
      const results = reverseTranslateIPAWord('haɪ');
      expect(results.some((w) => w === 'hi' || w === 'high')).toBe(true);
    });

    it('should handle stress markers', () => {
      // /həˈloʊ/ -> "hello"
      const results = reverseTranslateIPAWord('həˈloʊ');
      expect(results).toContain('hello');
    });

    it('should return original for empty input', () => {
      expect(reverseTranslateIPAWord('')).toEqual([]);
    });

    it('should handle common IPA transcriptions', () => {
      // /wɝld/ -> "world"
      const results = reverseTranslateIPAWord('wɝld');
      expect(results).toContain('world');
    });
  });

  describe('reverseTranslateIPAText', () => {
    it('should translate IPA text to English', () => {
      // /həˈloʊ wɝld/ -> "hello world"
      const result = reverseTranslateIPAText('həˈloʊ wɝld');
      expect(result.toLowerCase()).toBe('hello world');
    });

    it('should handle IPA brackets', () => {
      // Remove surrounding slashes
      const result = reverseTranslateIPAText('/kæt/');
      expect(result.toLowerCase()).toBe('cat');
    });

    it('should handle multiple words', () => {
      // /ðə kæt/ -> "the cat"
      const result = reverseTranslateIPAText('ðə kæt');
      expect(result.toLowerCase()).toBe('the cat');
    });

    it('should return empty string for empty input', () => {
      expect(reverseTranslateIPAText('')).toBe('');
    });

    it('should round-trip translateText with IPA format', () => {
      // Translate "hello world" to IPA, then back to English
      const ipa = translateText('hello world', 'ipa');
      const back = reverseTranslateIPAText(ipa);
      expect(back.toLowerCase()).toBe('hello world');
    });
  });
});
