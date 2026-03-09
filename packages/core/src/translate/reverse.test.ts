import { describe, it, expect } from 'vitest';
import { reverseTranslateSync, reverseTranslateSyncWithMapping, translateSync } from '../index';

const SAMPLE_TEXT = `The quick brown fox jumps over the lazy dog.
This sentence contains every letter of the English alphabet.

"Though" and "through" are spelled similarly but sound different.
English spelling is notoriously difficult to learn because it has
so many exceptions. With phonetic spelling, words
are written exactly as they sound - what you see is what you say!`;

describe('reverse-translator', () => {
  describe('reverseTranslateSync (single words)', () => {
    it('should translate simple words', () => {
      // "kat" should map to "cat"
      const result = reverseTranslateSync('kat');
      expect(result).toBe('cat');
    });

    it('should preserve capitalization', () => {
      const result = reverseTranslateSync('Kat');
      expect(result).toBe('Cat');
    });

    it('should preserve ALL CAPS', () => {
      const result = reverseTranslateSync('KAT');
      expect(result).toBe('CAT');
    });

    it('should handle homophones by picking most common word', () => {
      // "too" is the Ingglish spelling for "too"/"to"/"two" (all T+UW)
      const result = reverseTranslateSync('too');
      expect(result).toBe('to'); // most common by frequency
    });

    it('should handle ambiguous "er" spellings (welfare case)', () => {
      // "welfare" translates to "welfer", which could be:
      // - ER (r-colored schwa) - no match
      // - EH + R (short e + r) - matches "welfare"
      const result = reverseTranslateSync('welfer');
      expect(result).toBe('welfare');
    });

    it('should handle "er" that is actually ER phoneme', () => {
      // "her" -> "her" (ER is correct here)
      const result = reverseTranslateSync('her');
      expect(result).toBe('her');
    });

    it('should round-trip contractions', () => {
      // Contractions are translated without apostrophe for consistent phonetic representation
      // The reverse translation returns the base word form
      const contractions = [
        { expectedBack: "wouldn't", input: "wouldn't" },
        { expectedBack: "couldn't", input: "couldn't" },
        { expectedBack: "shouldn't", input: "shouldn't" },
        { expectedBack: "don't", input: "don't" },
        { expectedBack: "can't", input: "can't" },
        { expectedBack: "won't", input: "won't" },
      ];
      const failures: string[] = [];

      for (const { expectedBack, input } of contractions) {
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
        { note: '"sh" can be SH (ship) or S+HH (exhume)', word: 'exhumed' },
        { note: '"er" can be ER (were) or EH+R (where)', word: 'where' },
      ];

      for (const { note, word } of ambiguousWords) {
        const ingglish = translateSync(word);
        const result = reverseTranslateSync(ingglish);
        expect(result.toLowerCase(), `${word}: ${note}`).toBe(word);
      }
    });

    it('sample text should round-trip exactly', () => {
      // Extract words
      const words = SAMPLE_TEXT.match(/[a-z]+/gi) ?? [];
      const failures: string[] = [];

      for (const word of words) {
        const ingglish = translateSync(word.toLowerCase());
        const result = reverseTranslateSync(ingglish);
        if (result.toLowerCase() !== word.toLowerCase()) {
          failures.push(`${word} -> ${ingglish} -> ${result} (expected ${word})`);
        }
      }

      expect(failures).toEqual([]);
    });
  });

  describe('homophones (known limitations)', () => {
    // These tests document known homophone collisions where reverse translation
    // picks a different word than the original. This is an inherent limitation
    // of phonetic spelling - homophones become indistinguishable.

    it('to/too/two all become "too" and reverse to most common', () => {
      expect(translateSync('to')).toBe('too');
      expect(translateSync('too')).toBe('too');
      expect(translateSync('two')).toBe('too');
      // Reverse picks most common word by frequency
      expect(reverseTranslateSync('too')).toBe('to');
    });

    it('their/there/they\'re all become "dhair"', () => {
      expect(translateSync('their')).toBe('dhair');
      expect(translateSync('there')).toBe('dhair');
      expect(translateSync("they're")).toBe('dhair');
      // All homophones produce the same Ingglish output
      // Verify they all translate to the same thing
      const result1 = translateSync('their');
      const result2 = translateSync('there');
      expect(result1).toBe(result2);
    });

    it('sea/see both become "see"', () => {
      expect(translateSync('sea')).toBe('see');
      expect(translateSync('see')).toBe('see');
    });

    it('eye/I both become "ai"', () => {
      expect(translateSync('eye')).toBe('ai');
      expect(translateSync('I')).toBe('ai');
      // Reverse picks "i" (most common single letter)
      expect(reverseTranslateSync('ai')).toBe('i');
    });

    it('queue/cue both become "kyoo"', () => {
      expect(translateSync('queue')).toBe('kyoo');
      expect(translateSync('cue')).toBe('kyoo');
      // Reverse may pick "q" as it's most common by frequency
      const result = reverseTranslateSync('kyoo');
      expect(['q', 'cue', 'queue']).toContain(result);
    });

    it('aisle becomes "ail" which reverses ambiguously', () => {
      expect(translateSync('aisle')).toBe('ail');
      // Could reverse to "aisle", "i'll", or "isle"
      const result = reverseTranslateSync('ail');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('reverseTranslateSync', () => {
    it('should translate text preserving punctuation', () => {
      // Basic test - translates words, keeps punctuation
      const result = reverseTranslateSync('haloh, werld!');
      expect(result).toContain(',');
      expect(result).toContain('!');
    });

    it('should preserve punctuation in IPA reverse translation', () => {
      // IPA text with punctuation should preserve it
      const result = reverseTranslateSync('həˈloʊ, wɝld!', { format: 'ipa' });
      expect(result).toContain(',');
      expect(result).toContain('!');
    });

    it('should handle mixed text', () => {
      const result = reverseTranslateSync('Dha kat.');
      expect(result).toMatch(/\bcat\b/i);
    });

    it('should return empty string for empty input', () => {
      expect(reverseTranslateSync('')).toBe('');
    });
  });

  describe('reverseTranslateSync with IPA format', () => {
    it('should translate simple IPA words', () => {
      // /kæt/ -> "cat"
      const result = reverseTranslateSync('kæt', { format: 'ipa' });
      expect(result.toLowerCase()).toBe('cat');
    });

    it('should translate IPA with diphthongs', () => {
      // /haɪ/ -> "hi" or "high"
      const result = reverseTranslateSync('haɪ', { format: 'ipa' });
      expect(['hi', 'high']).toContain(result.toLowerCase());
    });

    it('should handle stress markers', () => {
      // /həˈloʊ/ -> "hello"
      const result = reverseTranslateSync('həˈloʊ', { format: 'ipa' });
      expect(result.toLowerCase()).toBe('hello');
    });

    it('should return empty string for empty input', () => {
      expect(reverseTranslateSync('', { format: 'ipa' })).toBe('');
    });

    it('should translate IPA text to English', () => {
      // /həˈloʊ wɝld/ -> "hello world"
      const result = reverseTranslateSync('həˈloʊ wɝld', { format: 'ipa' });
      expect(result.toLowerCase()).toBe('hello world');
    });

    it('should handle IPA brackets', () => {
      // Remove surrounding slashes
      const result = reverseTranslateSync('/kæt/', { format: 'ipa' });
      expect(result.toLowerCase()).toBe('cat');
    });

    it('should handle multiple words', () => {
      // /ðə kæt/ -> "the cat"
      const result = reverseTranslateSync('ðə kæt', { format: 'ipa' });
      expect(result.toLowerCase()).toBe('the cat');
    });

    it('should round-trip translateSync with IPA format', () => {
      // Translate "hello world" to IPA, then back to English
      const ipa = translateSync('hello world', { format: 'ipa' });
      const back = reverseTranslateSync(ipa, { format: 'ipa' });
      expect(back.toLowerCase()).toBe('hello world');
    });
  });

  describe('reverseTranslateSync failure behavior', () => {
    it('should return unrecognized ingglish words as-is', () => {
      // "zzxq" is not valid ingglish - can't be parsed to phonemes
      const result = reverseTranslateSync('zzxq');
      expect(result).toBe('zzxq');
    });

    it('should still return non-letter tokens as-is', () => {
      expect(reverseTranslateSync('123')).toBe('123');
      expect(reverseTranslateSync('...')).toBe('...');
    });
  });

  describe('reverseTranslateSyncWithMapping', () => {
    it('should return matched: true for valid ingglish words', () => {
      const tokens = reverseTranslateSyncWithMapping('kat');
      const wordToken = tokens.find((t) => t.isWord);
      expect(wordToken).toBeDefined();
      expect(wordToken?.matched).toBe(true);
      expect(wordToken?.translated).toBe('cat');
      expect(wordToken?.original).toBe('kat');
    });

    it('should return matched: false for invalid ingglish words', () => {
      const tokens = reverseTranslateSyncWithMapping('zzxq');
      const wordToken = tokens.find((t) => t.isWord);
      expect(wordToken).toBeDefined();
      expect(wordToken?.matched).toBe(false);
      expect(wordToken?.translated).toBe('zzxq');
    });

    it('should preserve punctuation as non-word tokens', () => {
      const tokens = reverseTranslateSyncWithMapping('kat, dog!');
      const nonWords = tokens.filter((t) => !t.isWord);
      const texts = nonWords.map((t) => t.translated);
      expect(texts.join('')).toContain(',');
      expect(texts.join('')).toContain('!');
    });

    it('should handle mixed matched and unmatched words', () => {
      const tokens = reverseTranslateSyncWithMapping('dha zzxq kat');
      const words = tokens.filter((t) => t.isWord);
      expect(words.length).toBe(3);
      // "dha" should match (-> "the")
      expect(words[0]!.matched).toBe(true);
      // "zzxq" should not match
      expect(words[1]!.matched).toBe(false);
      // "kat" should match (-> "cat")
      expect(words[2]!.matched).toBe(true);
    });

    it('should preserve URLs unchanged', () => {
      const tokens = reverseTranslateSyncWithMapping('Vizit https://example.com tuday');
      const urlToken = tokens.find((t) => t.translated.includes('https://'));
      expect(urlToken).toBeDefined();
      expect(urlToken?.isWord).toBe(false);
    });

    it('should work for IPA format', () => {
      const tokens = reverseTranslateSyncWithMapping('həˈloʊ wɝld', { format: 'ipa' });
      const words = tokens.filter((t) => t.isWord);
      expect(words.length).toBe(2);
      expect(words[0]!.matched).toBe(true);
      expect(words[0]!.translated).toBe('hello');
      expect(words[1]!.matched).toBe(true);
    });

    it('should work for Shavian format', () => {
      // Forward translate to get correct Shavian text, then reverse it
      const shavian = translateSync('hello world', { format: 'shavian' });
      const tokens = reverseTranslateSyncWithMapping(shavian, { format: 'shavian' });
      const words = tokens.filter((t) => t.isWord);
      expect(words.length).toBe(2);
      expect(words[0]!.matched).toBe(true);
      expect(words[0]!.translated.toLowerCase()).toBe('hello');
      expect(words[1]!.matched).toBe(true);
    });

    it('should work for Deseret format', () => {
      const deseret = translateSync('hello world', { format: 'deseret' });
      const tokens = reverseTranslateSyncWithMapping(deseret, { format: 'deseret' });
      const words = tokens.filter((t) => t.isWord);
      expect(words.length).toBe(2);
      expect(words[0]!.matched).toBe(true);
      expect(words[0]!.translated.toLowerCase()).toBe('hello');
      expect(words[1]!.matched).toBe(true);
    });
  });

  describe('URL and email preservation', () => {
    it('should preserve HTTP URLs unchanged', () => {
      const result = reverseTranslateSync('Vizit http://example.com tuday');
      expect(result).toContain('http://example.com');
    });

    it('should preserve HTTPS URLs unchanged', () => {
      const result = reverseTranslateSync('Vizit https://example.com/path?q=1 tuday');
      expect(result).toContain('https://example.com/path?q=1');
    });

    it('should preserve email addresses unchanged', () => {
      const result = reverseTranslateSync('Kontakt foo@bar.com for help');
      expect(result).toContain('foo@bar.com');
    });

    it('should translate surrounding text while preserving URLs', () => {
      const result = reverseTranslateSync('Vizit https://example.com taday');
      expect(result).toBe('Visit https://example.com today');
    });

    it('should preserve multiple URLs and emails', () => {
      const result = reverseTranslateSync('See http://a.com and https://b.com or eemayl x@y.com');
      expect(result).toContain('http://a.com');
      expect(result).toContain('https://b.com');
      expect(result).toContain('x@y.com');
    });

    it('should preserve bare domains like google.com', () => {
      const result = reverseTranslateSync('Vizit google.com tuday');
      expect(result).toContain('google.com');
    });
  });
});
