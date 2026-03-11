import { describe, it, expect } from 'vitest';
import { setDictReverseMap } from '../dict-loader';
import {
  reverseTranslate,
  reverseTranslateSync,
  reverseTranslateSyncWithMapping,
  translateSync,
} from '../index';
import { reverseTranslateIPAWord, reverseTranslateWord } from './reverse';

const SAMPLE_TEXT = `The quick brown fox jumps over the lazy dog.
This sentence contains every letter of the English alphabet.

"Though" and "through" are spelled similarly but sound different.
English spelling is notoriously difficult to learn because it has
so many exceptions. With phonetic spelling, words
are written exactly as they sound - what you see is what you say!`;

describe('reverse-translator', () => {
  describe('reverseTranslateSync (single words)', () => {
    it.each([
      ['kat', 'cat', 'simple word'],
      ['Kat', 'Cat', 'title case'],
      ['KAT', 'CAT', 'ALL CAPS'],
      ['too', 'to', 'homophone picks most common'],
      ['welfer', 'welfare', 'ambiguous "er" resolves to EH+R'],
      ['her', 'her', 'ER phoneme stays as-is'],
    ])('reverses %s → %s (%s)', (input, expected) => {
      expect(reverseTranslateSync(input)).toBe(expected);
    });

    it.each([["wouldn't"], ["couldn't"], ["shouldn't"], ["don't"], ["can't"], ["won't"]])(
      'round-trips contraction "%s"',
      (input) => {
        const ingglish = translateSync(input);
        const back = reverseTranslateSync(ingglish);
        expect(back.toLowerCase()).toBe(input.toLowerCase());
      }
    );

    it.each([
      ['exhumed', '"sh" can be SH (ship) or S+HH (exhume)'],
      ['where', '"er" can be ER (were) or EH+R (where)'],
    ])('round-trips ambiguous word "%s" (%s)', (word) => {
      const ingglish = translateSync(word);
      const result = reverseTranslateSync(ingglish);
      expect(result.toLowerCase()).toBe(word);
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
      expect(['aisle', "i'll", 'isle']).toContain(reverseTranslateSync('ail'));
    });
  });

  describe('reverseTranslateSync', () => {
    it('should preserve punctuation in IPA reverse translation', () => {
      // IPA text with punctuation should preserve it
      const result = reverseTranslateSync('həˈloʊ, wɝld!', { format: 'ipa' });
      expect(result).toContain(',');
      expect(result).toContain('!');
    });

    it.each([
      ['Dha kat.', 'The cat.', 'mixed text'],
      ['', '', 'empty input'],
    ])('reverses "%s" → "%s" (%s)', (input, expected) => {
      expect(reverseTranslateSync(input)).toBe(expected);
    });
  });

  describe('reverseTranslateSync with IPA format', () => {
    it.each([
      ['kæt', 'cat', 'simple word'],
      ['/kæt/', 'cat', 'IPA brackets'],
      ['ðə kæt', 'the cat', 'multiple words'],
      ['həˈloʊ wɝld', 'hello world', 'IPA text'],
    ])('reverse-translates IPA "%s" → "%s" (%s)', (ipa, expected) => {
      expect(reverseTranslateSync(ipa, { format: 'ipa' }).toLowerCase()).toBe(expected);
    });

    it('should translate IPA with diphthongs', () => {
      const result = reverseTranslateSync('haɪ', { format: 'ipa' });
      expect(['hi', 'high']).toContain(result.toLowerCase());
    });

    it('should round-trip translateSync with IPA format', () => {
      const ipa = translateSync('hello world', { format: 'ipa' });
      const back = reverseTranslateSync(ipa, { format: 'ipa' });
      expect(back.toLowerCase()).toBe('hello world');
    });
  });

  describe('reverseTranslateSync failure behavior', () => {
    it.each([
      ['zzxq', 'zzxq', 'unrecognized ingglish'],
      ['123', '123', 'numbers'],
      ['...', '...', 'punctuation'],
    ])('returns "%s" as-is → "%s" (%s)', (input, expected) => {
      expect(reverseTranslateSync(input)).toBe(expected);
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
    it.each([
      ['Vizit http://example.com tuday', 'http://example.com', 'HTTP URL'],
      ['Vizit https://example.com/path?q=1 tuday', 'https://example.com/path?q=1', 'HTTPS URL'],
      ['Kontakt foo@bar.com for help', 'foo@bar.com', 'email address'],
      ['Vizit google.com tuday', 'google.com', 'bare domain'],
    ])('preserves %s in reverse (%s)', (input, preserved) => {
      expect(reverseTranslateSync(input)).toContain(preserved);
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
  });

  describe('reverseTranslateIPAWord edge cases', () => {
    it.each([
      ['', [], 'empty string'],
      ['   ', ['   '], 'whitespace-only'],
      ['∅', ['∅'], 'unconvertible IPA'],
    ] as const)('reverseTranslateIPAWord("%s") → %j (%s)', (input, expected) => {
      expect(reverseTranslateIPAWord(input)).toEqual([...expected]);
    });
  });

  describe('reverseTranslateWord edge cases', () => {
    it.each([
      ['', [], 'empty string'],
      ['123', ['123'], 'non-letter input'],
    ] as const)('reverseTranslateWord("%s") → %j (%s)', (input, expected) => {
      expect(reverseTranslateWord(input)).toEqual([...expected]);
    });
  });

  describe('non-English reverse translation', () => {
    it('round-trips French words through reverse translation', async () => {
      const { translate } = await import('../index');
      const ingglish = await translate('bonjour', { lang: 'fr' });
      const back = await reverseTranslate(ingglish, { lang: 'fr' });
      expect(back).toBe('bonjour');
    });

    it('falls back to alternative arpabet variant when primary key misses', () => {
      // "kat" → arpabet ['K', 'AE', 'T'] → primary key "K AE T"
      // Alternative: AE→AH → key "K AH T"
      // Put word under AH key so primary misses but alternative hits
      const reverseMap = new Map<string, string[]>([['K AH T', ['chat']]]);
      setDictReverseMap('test-alt', reverseMap);

      const result = reverseTranslateSync('kat', { lang: 'test-alt' });
      expect(result).toBe('chat');
    });
  });
});
