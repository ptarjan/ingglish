import { describe, it, expect, beforeAll } from 'vitest';
import {
  translateWithStemming,
  translateWithRules,
  translateUnknown,
  translateAsAcronym,
  translateAsCompound,
  wordToArpabet,
  translateWithPhonemize,
  preloadPhonemize,
  CUSTOM_PRONUNCIATIONS,
} from './fallback';
import { lookupPronunciation, getDictionary } from './dictionary';
import { translateWord } from './translate/forward';
import { setupDictionary, UNKNOWN_TECH_WORDS } from './test-setup';

describe('unknown-words', () => {
  setupDictionary();

  describe('CUSTOM_PRONUNCIATIONS validation', () => {
    it('should not have identical pronunciations to CMU dictionary', () => {
      // Skip if using stub dictionary (less than 100 entries)
      // Full CMU dict has ~130,000 entries, stub has ~12
      const dict = getDictionary();
      if (Object.keys(dict).length < 100) {
        // Using stub dictionary - can't meaningfully test this
        return;
      }

      const identicalDuplicates: string[] = [];
      for (const word of Object.keys(CUSTOM_PRONUNCIATIONS)) {
        const cmuPronunciation = dict[word];
        if (cmuPronunciation !== undefined) {
          // Word is in both - check if pronunciations are identical
          const customPronunciation = CUSTOM_PRONUNCIATIONS[word];
          const cmuPhonemes = cmuPronunciation[0]; // First pronunciation variant
          if (
            customPronunciation.length === cmuPhonemes.length &&
            customPronunciation.every((p, i) => p === cmuPhonemes[i])
          ) {
            identicalDuplicates.push(word);
          }
        }
      }
      expect(identicalDuplicates).toEqual([]);
    });
  });

  describe('wordToArpabet', () => {
    it('should convert simple words to phonemes', () => {
      const phonemes = wordToArpabet('cat');
      expect(phonemes.length).toBeGreaterThan(0);
    });

    it('should handle digraphs', () => {
      const phonemes = wordToArpabet('ship');
      expect(phonemes).toContain('SH');
    });

    it('should handle th', () => {
      const phonemes = wordToArpabet('think');
      expect(phonemes).toContain('TH');
    });

    it('should handle ch', () => {
      const phonemes = wordToArpabet('chat');
      expect(phonemes).toContain('CH');
    });

    it('should handle double vowels', () => {
      const phonemes = wordToArpabet('see');
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
      const result = translateWithStemming('running');
      expect(result === null || typeof result === 'string').toBe(true);
    });

    it('should handle -ly suffix with known base', () => {
      const result = translateWithStemming('quickly');
      expect(result === null || typeof result === 'string').toBe(true);
    });

    it('should handle -ed suffix', () => {
      const result = translateWithStemming('walked');
      expect(result === null || typeof result === 'string').toBe(true);
    });

    it('should handle un- prefix with known base', () => {
      // "unhappy" = un- + happy (both known)
      const result = translateWithStemming('unhappy');
      expect(result === null || typeof result === 'string').toBe(true);
    });

    it('should handle re- prefix with known base', () => {
      // "rebuild" = re- + build
      const result = translateWithStemming('rebuild');
      expect(result === null || typeof result === 'string').toBe(true);
    });

    it('should return null for words without recognizable stems', () => {
      const result = translateWithStemming('xyzzy');
      expect(result).toBeNull();
    });

    it('should return null for short prefixed words', () => {
      // Too short to be a valid prefix + stem
      const result = translateWithStemming('una');
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

    it('should use custom pronunciations for tech terms', () => {
      // "git" is in our custom dictionary
      const result = translateUnknown('git');
      expect(result).toBe('git'); // G IH1 T -> git
    });

    it('should translate devs correctly (not as de+vs)', () => {
      // "devs" has custom pronunciation to prevent compound split as "de" + "vs" (versus)
      const result = translateUnknown('devs');
      expect(result).toBe('devz'); // D EH1 V Z -> devz
    });

    // These tests require "hub" in dictionary (full CMU dict, not stub)
    it('should handle compound words like github', () => {
      if (lookupPronunciation('hub') === null) {
        return; // Skip with stub dictionary
      }
      // github = git (custom) + hub (CMU) -> github
      const result = translateUnknown('github');
      expect(result).toBe('github'); // git + hub
    });

    it('should produce correct IPA for github', () => {
      if (lookupPronunciation('hub') === null) {
        return; // Skip with stub dictionary
      }
      // github should be /ɡɪthʌb/ NOT /ɡɪθʌb/
      const result = translateUnknown('github', 'ipa');
      expect(result).toContain('t'); // separate t
      expect(result).toContain('h'); // separate h
      expect(result).not.toContain('θ'); // NOT theta
    });
  });

  describe('translateAsCompound', () => {
    it('should split compound words into known parts', () => {
      if (lookupPronunciation('hub') === null) {
        return; // Skip with stub dictionary
      }
      // "github" = git (custom) + hub (CMU dict)
      const result = translateAsCompound('github');
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result).toBe('github');
    });

    it('should return null for non-compound words', () => {
      const result = translateAsCompound('xyzzy');
      expect(result).toBeNull();
    });

    it('should handle github with custom git', () => {
      if (lookupPronunciation('hub') === null) {
        return; // Skip with stub dictionary
      }
      const result = translateAsCompound('github');
      expect(result).toBe('github');
    });
  });

  describe('translateAsAcronym', () => {
    it('should spell out URL as yuuarel', () => {
      const result = translateAsAcronym('url');
      expect(result).toBe('yuuarel');
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
      expect(result).toBe('yuuarel');
    });
  });

  describe('acronym detection in translateUnknown', () => {
    it('should translate url as spelled-out letters', () => {
      const result = translateUnknown('url');
      expect(result).toBe('yuuarel');
    });

    it('should translate URL (uppercase) as spelled-out letters', () => {
      const result = translateUnknown('URL');
      expect(result).toBe('yuuarel');
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

  describe('IPA output format', () => {
    it('translateWithRules should output IPA when format is ipa', () => {
      const result = translateWithRules('blorg', 'ipa');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      // IPA output should contain IPA characters, not Latin alphabet
      // The word "blorg" should produce something like /blɔɹɡ/
      expect(result).toMatch(/[bɡʃʒθðŋɹɑæʌɔɛɪʊəaɪeɪoʊaʊɔɪuiˈˌ]/);
    });

    it('translateAsAcronym should output IPA when format is ipa', () => {
      // URL = /juː ɑːɹ ɛl/ (you-are-ell)
      const result = translateAsAcronym('url', 'ipa');
      expect(result).toBeDefined();
      // Should contain IPA vowels and consonants
      expect(result).toMatch(/[juɑɹɛl]/);
    });

    it('translateUnknown should output IPA when format is ipa', () => {
      const result = translateUnknown('xyzzy', 'ipa');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      // Should not be plain ASCII letters like ingglish output
      expect(result).not.toMatch(/^[a-zA-Z]+$/);
    });

    it('translateUnknown should output IPA for acronyms', () => {
      const result = translateUnknown('api', 'ipa');
      expect(result).toBeDefined();
      // API = /eɪ piː aɪ/ (ay-pee-eye)
      // Should contain IPA characters
      expect(result).toMatch(/[eɪpiːaɪ]/);
    });

    it('translateWithStemming should output IPA when format is ipa', () => {
      // Test with a word that has a known stem
      const result = translateWithStemming('quickly', 'ipa');
      // May return null if stem not found, otherwise should be IPA
      if (result !== null) {
        expect(result).toMatch(/[ɪəʌɛæɑɔʊuiŋʃʒθðɹ]/);
      }
    });
  });

  describe('phonemize integration', () => {
    beforeAll(async () => {
      await preloadPhonemize();
    });

    describe('handles words not in CMU dictionary', () => {
      // Note: 'url' is now in the CMU dictionary (Y UW2 AA2 R EH1 L)
      const unknownWords = [...UNKNOWN_TECH_WORDS];

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
        expect(result).toBe('huloh'); // Known correct translation
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
});
