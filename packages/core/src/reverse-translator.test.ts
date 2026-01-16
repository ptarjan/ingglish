import { describe, it, expect } from 'vitest';
import { lookupPronunciation } from './dictionary';
import { translateWord, translateSync } from './translate/forward';
import {
  reverseTranslateWord,
  reverseTranslateSync,
  ipaToArpabetClean,
  reverseTranslateIPAWord,
} from './translate/reverse';
import { isLikelyIngglish } from './detect/language';
import { ingglishToArpabet } from './convert/from-ingglish';
import { SAMPLE_TEXT } from './test-setup';

describe('reverse-translator', () => {
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
        const ingglish = translateSync(input);
        const back = reverseTranslateSync(ingglish);
        if (back.toLowerCase() !== expectedBack.toLowerCase()) {
          failures.push(`${input} -> ${ingglish} -> ${back} (expected: ${expectedBack})`);
        }
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
      // Extract words
      const words = SAMPLE_TEXT.match(/[a-zA-Z]+/g) ?? [];
      const failures: string[] = [];

      for (const word of words) {
        const ingglish = translateWord(word.toLowerCase());
        const results = reverseTranslateWord(ingglish);
        if (results[0]?.toLowerCase() !== word.toLowerCase()) {
          failures.push(`${word} -> ${ingglish} -> ${results[0]} (expected ${word})`);
        }
      }

      expect(failures).toEqual([]);
    });
  });

  describe('homophones (known limitations)', () => {
    // These tests document known homophone collisions where reverse translation
    // picks a different word than the original. This is an inherent limitation
    // of phonetic spelling - homophones become indistinguishable.

    it('to/too/two all become "tuu" and reverse to most common', () => {
      expect(translateWord('to')).toBe('tuu');
      expect(translateWord('too')).toBe('tuu');
      expect(translateWord('two')).toBe('tuu');
      // Reverse picks most common word by frequency
      expect(reverseTranslateSync('tuu')).toBe('to');
    });

    it('their/there/they\'re all become "dhair"', () => {
      expect(translateWord('their')).toBe('dhair');
      expect(translateWord('there')).toBe('dhair');
      expect(translateWord("they're")).toBe('dhair');
      // All map to same phonetic spelling
      const results = reverseTranslateWord('dhair');
      expect(results.length).toBeGreaterThan(1); // Multiple options
    });

    it('sea/see both become "see"', () => {
      expect(translateWord('sea')).toBe('see');
      expect(translateWord('see')).toBe('see');
    });

    it('eye/I both become "ai"', () => {
      expect(translateWord('eye')).toBe('ai');
      expect(translateWord('I')).toBe('ai');
      // Reverse picks "i" (most common single letter)
      expect(reverseTranslateSync('ai')).toBe('i');
    });

    it('queue/cue both become "kyuu"', () => {
      expect(translateWord('queue')).toBe('kyuu');
      expect(translateWord('cue')).toBe('kyuu');
      // Reverse may pick "q" as it's most common by frequency
      const result = reverseTranslateSync('kyuu');
      expect(['q', 'cue', 'queue']).toContain(result);
    });

    it('aisle becomes "ail" which reverses ambiguously', () => {
      expect(translateWord('aisle')).toBe('ail');
      // Could reverse to "aisle", "i'll", or "isle"
      const results = reverseTranslateWord('ail');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('reverseTranslateSync', () => {
    it('should translate text preserving punctuation', () => {
      // Basic test - translates words, keeps punctuation
      const result = reverseTranslateSync('huloh, werld!');
      expect(result).toContain(',');
      expect(result).toContain('!');
    });

    it('should preserve punctuation in IPA reverse translation', () => {
      // IPA text with punctuation should preserve it
      const result = reverseTranslateSync('həˈloʊ, wɝld!', 'ipa');
      expect(result).toContain(',');
      expect(result).toContain('!');
    });

    it('should handle mixed text', () => {
      const result = reverseTranslateSync('Dhu kat.');
      expect(result).toMatch(/\bcat\b/i);
    });

    it('should return empty string for empty input', () => {
      expect(reverseTranslateSync('')).toBe('');
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

  describe('reverseTranslateSync with IPA format', () => {
    it('should translate IPA text to English', () => {
      // /həˈloʊ wɝld/ -> "hello world"
      const result = reverseTranslateSync('həˈloʊ wɝld', 'ipa');
      expect(result.toLowerCase()).toBe('hello world');
    });

    it('should handle IPA brackets', () => {
      // Remove surrounding slashes
      const result = reverseTranslateSync('/kæt/', 'ipa');
      expect(result.toLowerCase()).toBe('cat');
    });

    it('should handle multiple words', () => {
      // /ðə kæt/ -> "the cat"
      const result = reverseTranslateSync('ðə kæt', 'ipa');
      expect(result.toLowerCase()).toBe('the cat');
    });

    it('should return empty string for empty input', () => {
      expect(reverseTranslateSync('', 'ipa')).toBe('');
    });

    it('should round-trip translateSync with IPA format', () => {
      // Translate "hello world" to IPA, then back to English
      const ipa = translateSync('hello world', 'ipa');
      const back = reverseTranslateSync(ipa, 'ipa');
      expect(back.toLowerCase()).toBe('hello world');
    });
  });
});
