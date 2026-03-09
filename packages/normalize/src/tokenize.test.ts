import { describe, expect, it } from 'vitest';
import { tokenizeIPA, tokenizeText } from './index';

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
      const tokens = tokenizeIPA('həˈloʊ wɝld');
      expect(tokens).toHaveLength(3);
      expect(tokens[0]!.isWord).toBe(true);
      expect(tokens[1]!.isWord).toBe(false);
      expect(tokens[2]!.isWord).toBe(true);
    });

    it('should recognize IPA symbols as word characters', () => {
      const tokens = tokenizeIPA('ʃɪp');
      expect(tokens).toHaveLength(1);
      expect(tokens[0]!.isWord).toBe(true);
    });

    it('should recognize IPA stress markers as part of words', () => {
      const tokens = tokenizeIPA('ˈhɛloʊ');
      expect(tokens).toHaveLength(1);
      expect(tokens[0]!.isWord).toBe(true);
    });

    it('should treat accented vowels as non-IPA word breaks', () => {
      // Accented vowels (á, é) are Ingglish phonetic markers, not IPA
      const tokens = tokenizeIPA('háloh');
      expect(tokens.some((t) => !t.isWord)).toBe(true);
    });

    it('should separate on punctuation and spaces', () => {
      const tokens = tokenizeIPA('həˈloʊ, wɝld!');
      const words = tokens.filter((t) => t.isWord);
      const nonWords = tokens.filter((t) => !t.isWord);
      expect(words).toHaveLength(2);
      expect(nonWords).toHaveLength(2);
    });
  });
});
