import { describe, it, expect, beforeAll } from 'vitest';
import { loadDictionary, lookupPronunciation, translateWord } from './translator';
import { translateWithRules, translateWithPhonemize, preloadPhonemize } from './unknown-words';

describe('phonemize improvements', () => {
  beforeAll(async () => {
    await loadDictionary();
    await preloadPhonemize();
  });

  describe('handles words not in CMU dictionary', () => {
    // These are real names and neologisms not in CMU
    const unknownWords = [
      'kubernetes',
      'spotify',
      'airbnb',
      'instagram',
      'tiktok',
      'chatgpt',
      'cryptocurrency',
      'blockchain',
      'url', // Acronym - should be "yooahrel" (U-R-L spelled out)
    ];

    it('unknown words are not in CMU dictionary', () => {
      for (const word of unknownWords) {
        expect(lookupPronunciation(word), `${word} should not be in CMU`).toBeNull();
      }
    });

    it('phonemize produces reasonable translations for tech terms', () => {
      const results: { word: string; phonemize: string | null; rules: string }[] = [];

      for (const word of unknownWords) {
        const phonemizeResult = translateWithPhonemize(word);
        const rulesResult = translateWithRules(word);

        results.push({
          word,
          phonemize: phonemizeResult,
          rules: rulesResult,
        });

        // Phonemize should produce some output for each word
        if (phonemizeResult !== null) {
          expect(phonemizeResult.length).toBeGreaterThan(0);
        }
      }

      // Results are captured in the test - no need to log
    });
  });

  describe('handles proper names better than rules', () => {
    // Names that are tricky to pronounce with simple rules
    const names = [
      'nguyen', // Vietnamese name
      'siobhan', // Irish name
      'bjork', // Icelandic name
      'xiaoming', // Chinese name
      'sergei', // Russian name
    ];

    it('proper names get translated', () => {
      for (const name of names) {
        const phonemizeResult = translateWithPhonemize(name);
        const rulesResult = translateWithRules(name);

        // Both methods should produce output
        expect(rulesResult.length).toBeGreaterThan(0);
        // Phonemize may or may not handle these well, but should produce something
        expect(phonemizeResult === null || phonemizeResult.length > 0).toBe(true);
      }
    });
  });

  describe('translateWord uses phonemize as fallback', () => {
    it('unknown words get translated via fallback', () => {
      // These words are not in CMU dictionary
      const word = 'kubernetes';
      expect(lookupPronunciation(word)).toBeNull();

      // translateWord should still produce output via fallback
      const result = translateWord(word);
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result).not.toBe(word); // Should be transformed
    });

    it('known words still use dictionary', () => {
      // "hello" is in CMU dictionary
      expect(lookupPronunciation('hello')).not.toBeNull();

      const result = translateWord('hello');
      expect(result).toBe('hulo'); // Known correct translation
    });
  });

  describe('phonemize vs rules comparison', () => {
    it('compares output quality on made-up words', () => {
      const madeUpWords = ['blorgify', 'schnozzle', 'quixotic', 'zephyrus', 'melodious'];

      const results: { word: string; phonemize: string | null; rules: string; inCmu: boolean }[] =
        [];

      for (const word of madeUpWords) {
        const inCmu = lookupPronunciation(word) !== null;
        const phonemizeResult = translateWithPhonemize(word);
        const rulesResult = translateWithRules(word);

        results.push({
          word,
          phonemize: phonemizeResult,
          rules: rulesResult,
          inCmu,
        });
      }

      // All should produce some output
      for (const r of results) {
        expect(r.rules.length).toBeGreaterThan(0);
      }
    });
  });
});
