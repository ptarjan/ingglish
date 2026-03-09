import { describe, expect, it } from 'vitest';
import { isIPAChar, isPhoneticChar, tokenizePhonetic } from './tokenize';
import {
  extractPreservedPatterns,
  stripDiacritics,
  tokenizeIPA,
  tokenizeText,
  tokenizeUnicodeScript,
} from './index';

const isUpperLatin = (ch: string) => ch >= 'A' && ch <= 'Z';

describe('text utilities', () => {
  describe('tokenizeText', () => {
    it('should tokenize simple text', () => {
      const tokens = tokenizeText('Hello world');
      expect(tokens).toHaveLength(3);
      expect(tokens[0]).toEqual({ isWord: true, text: 'Hello' });
      expect(tokens[1]).toEqual({ isWord: false, text: ' ' });
      expect(tokens[2]).toEqual({ isWord: true, text: 'world' });
    });

    it('should handle punctuation', () => {
      const tokens = tokenizeText('Hello, world!');
      expect(tokens.filter((t) => t.isWord)).toHaveLength(2);
      expect(tokens.filter((t) => !t.isWord)).toHaveLength(2);
    });

    it('should normalize curly apostrophes', () => {
      const tokens = tokenizeText('don\u2019t');
      expect(tokens).toHaveLength(1);
      expect(tokens[0]!.text).toBe("don't");
    });

    it('should keep apostrophes as part of words', () => {
      const tokens = tokenizeText("it's");
      expect(tokens).toHaveLength(1);
      expect(tokens[0]!.isWord).toBe(true);
    });

    it('should keep contractions as single words', () => {
      const tokens = tokenizeText("don't stop");
      const words = tokens.filter((t) => t.isWord);
      expect(words).toHaveLength(2);
      expect(words[0]!.text).toBe("don't");
      expect(words[1]!.text).toBe('stop');
    });
  });

  describe('tokenizeIPA', () => {
    it('should tokenize IPA text', () => {
      const tokens = tokenizeIPA('h\u0259\u02C8lo\u028A w\u025Dld');
      expect(tokens).toHaveLength(3);
      expect(tokens[0]!.isWord).toBe(true);
      expect(tokens[1]!.isWord).toBe(false);
      expect(tokens[2]!.isWord).toBe(true);
    });

    it('should recognize IPA symbols as word characters', () => {
      const tokens = tokenizeIPA('\u0283\u026Ap');
      expect(tokens).toHaveLength(1);
      expect(tokens[0]!.isWord).toBe(true);
    });

    it('should recognize IPA stress markers as part of words', () => {
      const tokens = tokenizeIPA('\u02C8h\u025Blo\u028A');
      expect(tokens).toHaveLength(1);
      expect(tokens[0]!.isWord).toBe(true);
    });

    it('should treat accented vowels as non-IPA word breaks', () => {
      // Accented vowels (\u00E1, \u00E9) are Ingglish phonetic markers, not IPA
      const tokens = tokenizeIPA('h\u00E1loh');
      expect(tokens.some((t) => !t.isWord)).toBe(true);
    });

    it('should separate on punctuation and spaces', () => {
      const tokens = tokenizeIPA('h\u0259\u02C8lo\u028A, w\u025Dld!');
      const words = tokens.filter((t) => t.isWord);
      const nonWords = tokens.filter((t) => !t.isWord);
      expect(words).toHaveLength(2);
      expect(nonWords).toHaveLength(2);
    });
  });

  describe('tokenizeUnicodeScript', () => {
    it('tokenizes script characters into word tokens', () => {
      const tokens = tokenizeUnicodeScript('ABC DEF', isUpperLatin);
      const words = tokens.filter((t) => t.isWord);
      expect(words.length).toBe(2);
      expect(words[0]!.text).toBe('ABC');
      expect(words[1]!.text).toBe('DEF');
    });

    it('separates non-script characters as non-word tokens', () => {
      const tokens = tokenizeUnicodeScript('AB, CD!', isUpperLatin);
      expect(tokens.some((t) => !t.isWord && t.text.includes(','))).toBe(true);
    });

    it('handles empty string', () => {
      const tokens = tokenizeUnicodeScript('', isUpperLatin);
      expect(tokens.length).toBe(0);
    });

    it('handles string with no script characters', () => {
      const tokens = tokenizeUnicodeScript('123 !@#', isUpperLatin);
      expect(tokens.every((t) => !t.isWord)).toBe(true);
    });
  });

  describe('isIPAChar', () => {
    it('recognizes Latin letters', () => {
      expect(isIPAChar('a')).toBe(true);
      expect(isIPAChar('Z')).toBe(true);
    });

    it('recognizes word joiner U+2060', () => {
      expect(isIPAChar('\u2060')).toBe(true);
    });

    it('recognizes IPA stress markers', () => {
      expect(isIPAChar('\u02C8')).toBe(true); // ˈ primary stress
      expect(isIPAChar('\u02CC')).toBe(true); // ˌ secondary stress
    });

    it('recognizes IPA symbols', () => {
      expect(isIPAChar('ə')).toBe(true);
      expect(isIPAChar('ʃ')).toBe(true);
      expect(isIPAChar('ŋ')).toBe(true);
    });

    it('rejects punctuation and digits', () => {
      expect(isIPAChar('.')).toBe(false);
      expect(isIPAChar('1')).toBe(false);
      expect(isIPAChar(' ')).toBe(false);
    });
  });

  describe('isPhoneticChar', () => {
    it('recognizes Latin letters', () => {
      expect(isPhoneticChar('a')).toBe(true);
      expect(isPhoneticChar('Z')).toBe(true);
    });

    it('recognizes apostrophe', () => {
      expect(isPhoneticChar("'")).toBe(true);
    });

    it('recognizes accented vowels (stress markers)', () => {
      expect(isPhoneticChar('á')).toBe(true);
      expect(isPhoneticChar('é')).toBe(true);
      expect(isPhoneticChar('ü')).toBe(true);
      expect(isPhoneticChar('À')).toBe(true);
    });

    it('recognizes word joiner U+2060', () => {
      expect(isPhoneticChar('\u2060')).toBe(true);
    });

    it('recognizes IPA stress markers', () => {
      expect(isPhoneticChar('\u02C8')).toBe(true);
      expect(isPhoneticChar('\u02CC')).toBe(true);
    });

    it('recognizes IPA symbols', () => {
      expect(isPhoneticChar('ə')).toBe(true);
      expect(isPhoneticChar('ʃ')).toBe(true);
    });

    it('rejects punctuation and digits', () => {
      expect(isPhoneticChar('.')).toBe(false);
      expect(isPhoneticChar('1')).toBe(false);
      expect(isPhoneticChar(' ')).toBe(false);
    });
  });

  describe('tokenizePhonetic', () => {
    it('tokenizes phonetic text into words with indices', () => {
      const tokens = tokenizePhonetic('haloh werld');
      const words = tokens.filter((t) => t.isWord);
      expect(words.length).toBe(2);
      expect(words[0]!.text).toBe('haloh');
      expect(words[0]!.wordIndex).toBe(0);
      expect(words[1]!.text).toBe('werld');
      expect(words[1]!.wordIndex).toBe(1);
    });

    it('includes non-word tokens with null wordIndex', () => {
      const tokens = tokenizePhonetic('haloh, werld!');
      const nonWords = tokens.filter((t) => !t.isWord);
      expect(nonWords.length).toBeGreaterThan(0);
      expect(nonWords.every((t) => t.wordIndex === null)).toBe(true);
    });

    it('handles IPA symbols as word characters', () => {
      const tokens = tokenizePhonetic('həˈloʊ wɝld');
      const words = tokens.filter((t) => t.isWord);
      expect(words.length).toBe(2);
    });

    it('handles accented vowels as word characters', () => {
      const tokens = tokenizePhonetic('háloʊ');
      expect(tokens.length).toBe(1);
      expect(tokens[0]!.isWord).toBe(true);
    });

    it('handles empty string', () => {
      expect(tokenizePhonetic('')).toEqual([]);
    });
  });

  describe('extractPreservedPatterns', () => {
    it('extracts URLs and replaces with placeholders', () => {
      const { preserved, text } = extractPreservedPatterns('Visit https://example.com today');
      expect(preserved.size).toBe(1);
      expect(text).not.toContain('https://example.com');
      const url = [...preserved.values()][0];
      expect(url).toBe('https://example.com');
    });

    it('extracts email addresses', () => {
      const { preserved, text } = extractPreservedPatterns('Email test@example.com please');
      expect(preserved.size).toBe(1);
      expect(text).not.toContain('test@example.com');
      const email = [...preserved.values()][0];
      expect(email).toBe('test@example.com');
    });

    it('extracts bare domains', () => {
      const { preserved, text } = extractPreservedPatterns('Visit google.com today');
      expect(preserved.size).toBe(1);
      expect(text).not.toContain('google.com');
    });

    it('extracts multiple patterns', () => {
      const { preserved } = extractPreservedPatterns(
        'See https://a.com and user@b.com or google.com'
      );
      expect(preserved.size).toBe(3);
    });

    it('returns unchanged text when no patterns', () => {
      const { preserved, text } = extractPreservedPatterns('Hello world');
      expect(preserved.size).toBe(0);
      expect(text).toBe('Hello world');
    });
  });

  describe('stripDiacritics', () => {
    it('strips accents from vowels', () => {
      expect(stripDiacritics('café')).toBe('cafe');
      expect(stripDiacritics('résumé')).toBe('resume');
      expect(stripDiacritics('naïve')).toBe('naive');
    });

    it('preserves text without diacritics', () => {
      expect(stripDiacritics('hello')).toBe('hello');
    });

    it('handles mixed text', () => {
      expect(stripDiacritics('cliché world')).toBe('cliche world');
    });
  });
});
