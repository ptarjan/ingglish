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
  });

  describe('tokenizeIPA', () => {
    it('should tokenize IPA text', () => {
      const tokens = tokenizeIPA('həˈloʊ wɝld');
      expect(tokens).toHaveLength(3);
      expect(tokens[0]!.isWord).toBe(true);
      expect(tokens[1]!.isWord).toBe(false);
      expect(tokens[2]!.isWord).toBe(true);
    });
  });
});
