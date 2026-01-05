import { describe, it, expect, beforeAll } from 'vitest';
import {
  loadDictionary,
  isDictionaryLoaded,
  lookupPronunciation,
  translateWord,
  translateText,
  getDictionaryStats,
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

    it('should have many words', () => {
      const stats = getDictionaryStats();
      expect(stats.wordCount).toBeGreaterThan(100000);
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
      expect(phonemes!.length).toBeGreaterThan(0);
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
});
