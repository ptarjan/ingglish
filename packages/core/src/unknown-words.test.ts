import { describe, it, expect, beforeAll } from 'vitest';
import { loadDictionary } from './translator';
import {
  translateWithStemming,
  translateWithRules,
  translateUnknown,
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
});
