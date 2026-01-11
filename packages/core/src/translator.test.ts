import { describe, it, expect } from 'vitest';
import { loadDictionary, isDictionaryLoaded, lookupPronunciation } from './dictionary';
import { translateWord, translateSync } from './translate/forward';
import { setupDictionary } from './test-setup';

describe('translator', () => {
  setupDictionary();

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
      // hello = HH AH0 L OW1 -> huloh (American pronunciation)
      expect(translateWord('hello')).toBe('huloh');
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

  describe('translateSync', () => {
    it('should translate multiple words', () => {
      const result = translateSync('hello world');
      expect(result).toContain('huloh');
      expect(result).toContain('werld');
    });

    it('should preserve punctuation', () => {
      const result = translateSync('Hello, world!');
      expect(result).toContain(',');
      expect(result).toContain('!');
    });

    it('should preserve punctuation in IPA output', () => {
      const result = translateSync('Hello, world!', 'ipa');
      expect(result).toContain(',');
      expect(result).toContain('!');
    });

    it('should preserve whitespace', () => {
      const result = translateSync('hello   world');
      expect(result).toContain('   ');
    });

    it('should preserve numbers', () => {
      const result = translateSync('hello 123 world');
      expect(result).toContain('123');
    });

    it('should handle contractions', () => {
      const result = translateSync("don't");
      // Contractions are translated as a unit - no apostrophe needed
      // The important thing is they round-trip correctly
      expect(result).toBe('dohnt');
    });

    it('should normalize curly apostrophes', () => {
      // Curly apostrophe (U+2019) should be treated the same as straight
      const curly = 'don\u2019t'; // don't with curly apostrophe
      const straight = "don't";
      expect(translateSync(curly)).toBe(translateSync(straight));
    });

    it('should handle possessives with curly apostrophes', () => {
      // Common in text copied from websites like NY Times
      const result = translateSync('China\u2019s economy');
      expect(result).toBe('Chiinuz ikahnumee');
    });

    it('should treat I as lowercase (English capitalizes I by convention only)', () => {
      // "I" is always capitalized in English, but it's just a pronoun
      // In Ingglish, there's no special reason to capitalize it
      expect(translateSync('I')).toBe('ii');
      expect(translateSync("I'm")).toBe('iim');
      expect(translateSync("I'll")).toBe('iil');
      expect(translateSync("I've")).toBe('iiv');
      expect(translateSync("I'd")).toBe('iid');
      // Lowercase remains lowercase
      expect(translateSync('i')).toBe('ii');
    });

    it('should handle empty string', () => {
      expect(translateSync('')).toBe('');
    });

    it('should handle only punctuation', () => {
      expect(translateSync('!!!')).toBe('!!!');
    });

    it('should handle mixed content', () => {
      const result = translateSync('Hello, World! How are you?');
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
      const result = translateSync("y'all");
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle possessives correctly', () => {
      // John's is in the dictionary as a complete word
      const result = translateSync("John's");
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle multiple apostrophes', () => {
      const result = translateSync("'twas");
      expect(result).toBeDefined();
    });

    it('should preserve all caps on contractions', () => {
      // DON'T should stay uppercase
      const result = translateWord("DON'T");
      expect(result).toBe(result.toUpperCase());
    });

    it('should handle contractions not in dictionary via fallback', () => {
      // Made-up contraction that won't be in CMU dictionary
      const result = translateWord("foo't");
      expect(result).toBeDefined();
      expect(result).toContain("'");
    });
  });

  describe('case preservation for unknown words', () => {
    it('should preserve all caps on unknown words', () => {
      // KUBERNETES is not in CMU dictionary
      const result = translateWord('KUBERNETES');
      expect(result).toBe(result.toUpperCase());
    });

    it('should preserve title case on unknown words', () => {
      // Kubernetes is not in CMU dictionary
      const result = translateWord('Kubernetes');
      expect(result.charAt(0)).toBe(result.charAt(0).toUpperCase());
      expect(result.slice(1)).toBe(result.slice(1).toLowerCase());
    });

    it('should preserve mixed case on unknown words like GitHub', () => {
      // GitHub has internal capital - should preserve position-by-position
      const result = translateWord('GitHub');
      expect(result).toBe('GitHub');
    });

    it('should translate GitHub with correct phonetics (t+h not θ)', () => {
      // GitHub = git + hub, the "th" should NOT become theta sound
      const ipa = translateWord('GitHub', 'ipa');
      expect(ipa).toContain('t'); // separate t
      expect(ipa).toContain('h'); // separate h
      expect(ipa).not.toContain('θ'); // NOT theta digraph
    });
  });

  describe('edge cases for coverage', () => {
    it('should handle empty string in translateWord', () => {
      // Line 86: return empty string for empty input
      expect(translateWord('')).toBe('');
    });

    it('should handle contraction with leading apostrophe via fallback', () => {
      // Made-up word that's definitely not in dictionary
      // This tests line 178: empty first part in split("'")
      const result = translateWord("'xyz");
      expect(result).toBeDefined();
      expect(result).toContain("'");
      // First part is empty, second part 'xyz' gets translated by fallback
    });

    it('should handle words with only non-letter characters', () => {
      // Should return as-is when no letters present
      expect(translateWord('123')).toBe('123');
      expect(translateWord('!!!')).toBe('!!!');
    });
  });
});
