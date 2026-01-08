import { describe, it, expect, beforeAll } from 'vitest';
import {
  loadDictionary,
  isDictionaryLoaded,
  lookupPronunciation,
  translateWord,
  translateText,
} from './translator';

describe('translator', () => {
  beforeAll(async () => {
    await loadDictionary();
  });

  describe('loadDictionary', () => {
    it('should load the dictionary', async () => {
      const dict = await loadDictionary();
      expect(dict).toBeDefined();
      expect(typeof dict).toBe('object');
    });

    it('should report dictionary as loaded', () => {
      expect(isDictionaryLoaded()).toBe(true);
    });
  });

  describe('lookupPronunciation', () => {
    it('should find common words', () => {
      expect(lookupPronunciation('hello')).toBeDefined();
      expect(lookupPronunciation('world')).toBeDefined();
      expect(lookupPronunciation('the')).toBeDefined();
    });

    it('should be case insensitive', () => {
      expect(lookupPronunciation('Hello')).toEqual(lookupPronunciation('hello'));
      expect(lookupPronunciation('WORLD')).toEqual(lookupPronunciation('world'));
    });

    it('should return null for unknown words', () => {
      expect(lookupPronunciation('asdfghjkl')).toBeNull();
      expect(lookupPronunciation('xyz123')).toBeNull();
    });

    it('should return phoneme arrays', () => {
      const phonemes = lookupPronunciation('hello');
      expect(Array.isArray(phonemes)).toBe(true);
      expect(phonemes).not.toBeNull();
      if (phonemes !== null) {
        expect(phonemes.length).toBeGreaterThan(0);
      }
    });
  });

  describe('translateWord', () => {
    it('should translate common words', () => {
      // hello = HH AH0 L OW1 -> hulo (American pronunciation)
      expect(translateWord('hello')).toBe('hulo');
      expect(translateWord('world')).toBe('werld');
    });

    it('should preserve capitalization', () => {
      const hello = translateWord('hello');
      expect(translateWord('Hello')).toBe(hello.charAt(0).toUpperCase() + hello.slice(1));
    });

    it('should preserve all caps', () => {
      const hello = translateWord('hello');
      expect(translateWord('HELLO')).toBe(hello.toUpperCase());
    });

    it('should handle unknown words with fallback', () => {
      // Unknown words should still return something (using fallback rules)
      const result = translateWord('asdfgh');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should translate url (not in CMU dictionary)', () => {
      // "url" is not in CMU dictionary, should use rule-based G2P
      // u->AH1 (u), r->R (r), l->L (l) = "url"
      const result = translateWord('url');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      // The rule-based translation should produce something
    });
  });

  describe('translateText', () => {
    it('should translate multiple words', () => {
      const result = translateText('hello world');
      expect(result).toContain('hulo');
      expect(result).toContain('werld');
    });

    it('should preserve punctuation', () => {
      const result = translateText('Hello, world!');
      expect(result).toContain(',');
      expect(result).toContain('!');
    });

    it('should preserve whitespace', () => {
      const result = translateText('hello   world');
      expect(result).toContain('   ');
    });

    it('should preserve numbers', () => {
      const result = translateText('hello 123 world');
      expect(result).toContain('123');
    });

    it('should handle contractions', () => {
      const result = translateText("don't");
      // Contractions are translated as a unit - no apostrophe needed
      // The important thing is they round-trip correctly
      expect(result).toBe('dont');
    });

    it('should normalize curly apostrophes', () => {
      // Curly apostrophe (U+2019) should be treated the same as straight
      const curly = 'don\u2019t'; // don't with curly apostrophe
      const straight = "don't";
      expect(translateText(curly)).toBe(translateText(straight));
    });

    it('should handle possessives with curly apostrophes', () => {
      // Common in text copied from websites like NY Times
      const result = translateText('China\u2019s economy');
      expect(result).toBe('Chainuz ikahnumee');
    });

    it('should translate I and I-contractions to lowercase', () => {
      // "I" is only capitalized in English due to grammar rules
      // In Ingglish, it should be lowercase "ai"
      expect(translateText('I')).toBe('ai');
      expect(translateText("I'm")).toBe('aim');
      expect(translateText("I'll")).toBe('ail');
      expect(translateText("I've")).toBe('aiv');
      expect(translateText("I'd")).toBe('aid');
    });

    it('should handle empty string', () => {
      expect(translateText('')).toBe('');
    });

    it('should handle only punctuation', () => {
      expect(translateText('!!!')).toBe('!!!');
    });

    it('should handle mixed content', () => {
      const result = translateText('Hello, World! How are you?');
      expect(result).toBeDefined();
      expect(result).toContain(',');
      expect(result).toContain('!');
      expect(result).toContain('?');
    });
  });

  describe('contraction edge cases', () => {
    it('should handle contractions with apostrophe parts', () => {
      // Test contractions that go through the fallback path
      // where parts are translated separately
      const result = translateText("y'all");
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle possessives correctly', () => {
      // John's is in the dictionary as a complete word
      const result = translateText("John's");
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle multiple apostrophes', () => {
      const result = translateText("'twas");
      expect(result).toBeDefined();
    });
  });
});
