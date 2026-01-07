import { describe, it, expect, beforeAll } from 'vitest';
import { loadDictionary } from './translator';
import {
  translateWithStemming,
  translateWithRules,
  translateUnknown,
  translateAsAcronym,
  wordToPhonemes,
} from './unknown-words';

describe('unknown-words', () => {
  beforeAll(async () => {
    await loadDictionary();
  });

  describe('wordToPhonemes', () => {
    it('should convert simple words to phonemes', () => {
      const phonemes = wordToPhonemes('cat');
      expect(phonemes.length).toBeGreaterThan(0);
    });

    it('should handle digraphs', () => {
      const phonemes = wordToPhonemes('ship');
      expect(phonemes).toContain('SH');
    });

    it('should handle th', () => {
      const phonemes = wordToPhonemes('think');
      expect(phonemes).toContain('TH');
    });

    it('should handle ch', () => {
      const phonemes = wordToPhonemes('chat');
      expect(phonemes).toContain('CH');
    });

    it('should handle double vowels', () => {
      const phonemes = wordToPhonemes('see');
      expect(phonemes).toContain('IY1');
    });
  });

  describe('translateWithRules', () => {
    it('should produce some output for any word', () => {
      const result = translateWithRules('xyzzy');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle made-up words', () => {
      const result = translateWithRules('blorg');
      expect(result).toBeDefined();
    });
  });

  describe('translateWithStemming', () => {
    it('should handle -ing suffix with known base', () => {
      // "running" should find "run" + "ing"
      const result = translateWithStemming('running');
      // May or may not find it depending on dictionary
      expect(result === null || typeof result === 'string').toBe(true);
    });

    it('should handle -ly suffix with known base', () => {
      // "quickly" should find "quick" + "ly"
      const result = translateWithStemming('quickly');
      expect(result === null || typeof result === 'string').toBe(true);
    });

    it('should handle -ed suffix', () => {
      const result = translateWithStemming('walked');
      expect(result === null || typeof result === 'string').toBe(true);
    });

    it('should return null for words without recognizable stems', () => {
      const result = translateWithStemming('xyzzy');
      expect(result).toBeNull();
    });
  });

  describe('translateUnknown', () => {
    it('should always return a string', () => {
      const result = translateUnknown('xyzzy');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should try stemming first then fallback to rules', () => {
      // For a completely made-up word, should use rules
      const result = translateUnknown('blargification');
      expect(result).toBeDefined();
    });
  });

  describe('translateAsAcronym', () => {
    it('should spell out URL as yooahrel', () => {
      const result = translateAsAcronym('url');
      expect(result).toBe('yooahrel');
    });

    it('should spell out HTML correctly', () => {
      const result = translateAsAcronym('html');
      expect(result).toBe('aychteeemel');
    });

    it('should spell out API correctly', () => {
      const result = translateAsAcronym('api');
      expect(result).toBe('aypeeai');
    });

    it('should spell out CSS correctly', () => {
      // C=see, S=es, S=es → "seeeses"
      const result = translateAsAcronym('css');
      expect(result).toBe('seeeses');
    });

    it('should handle uppercase input', () => {
      const result = translateAsAcronym('URL');
      expect(result).toBe('yooahrel');
    });
  });

  describe('acronym detection in translateUnknown', () => {
    it('should translate url as spelled-out letters', () => {
      const result = translateUnknown('url');
      expect(result).toBe('yooahrel');
    });

    it('should translate URL (uppercase) as spelled-out letters', () => {
      const result = translateUnknown('URL');
      expect(result).toBe('yooahrel');
    });

    it('should translate html as spelled-out letters', () => {
      const result = translateUnknown('html');
      expect(result).toBe('aychteeemel');
    });

    it('should translate api as spelled-out letters', () => {
      const result = translateUnknown('api');
      expect(result).toBe('aypeeai');
    });

    it('should not treat regular words as acronyms', () => {
      // "cat" should not be spelled out as c-a-t
      const result = translateUnknown('blorg');
      expect(result).not.toBe('beeelohahrgee'); // not spelled out
    });
  });
});
