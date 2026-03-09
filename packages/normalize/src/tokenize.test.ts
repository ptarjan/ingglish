import { describe, expect, it } from 'vitest';
import { tokenizeIPA, tokenizeText, tokenizeUnicodeScript } from './index';

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
});
