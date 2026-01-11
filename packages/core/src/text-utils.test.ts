import { describe, it, expect } from 'vitest';
import {
  isPhoneticChar,
  tokenizeText,
  tokenizePhonetic,
  tokenizeIPA,
  isIPAChar,
} from './utils/text';
import { isLikelyIPA, detectFormat } from './detect/language';
import { isConsonant, getStress } from './phonemes/arpabet';

describe('text utilities', () => {
  describe('isPhoneticChar', () => {
    it('should return true for basic Latin letters', () => {
      expect(isPhoneticChar('a')).toBe(true);
      expect(isPhoneticChar('Z')).toBe(true);
    });

    it('should return true for accented vowels (stress markers)', () => {
      expect(isPhoneticChar('á')).toBe(true);
      expect(isPhoneticChar('é')).toBe(true);
      expect(isPhoneticChar('ü')).toBe(true);
    });

    it('should return true for IPA symbols', () => {
      expect(isPhoneticChar('ə')).toBe(true);
      expect(isPhoneticChar('ʃ')).toBe(true);
      expect(isPhoneticChar('θ')).toBe(true);
    });

    it('should return true for IPA stress markers', () => {
      expect(isPhoneticChar('ˈ')).toBe(true);
      expect(isPhoneticChar('ˌ')).toBe(true);
    });

    it('should return true for word joiner', () => {
      expect(isPhoneticChar('\u2060')).toBe(true);
    });

    it('should return false for punctuation and spaces', () => {
      expect(isPhoneticChar(' ')).toBe(false);
      expect(isPhoneticChar('.')).toBe(false);
      expect(isPhoneticChar(',')).toBe(false);
      expect(isPhoneticChar('!')).toBe(false);
    });
  });

  describe('isIPAChar', () => {
    it('should return true for IPA symbols', () => {
      expect(isIPAChar('ə')).toBe(true);
      expect(isIPAChar('ɹ')).toBe(true);
    });

    it('should return true for Latin letters', () => {
      expect(isIPAChar('a')).toBe(true);
      expect(isIPAChar('Z')).toBe(true);
    });

    it('should return false for accented vowels (not IPA)', () => {
      expect(isIPAChar('á')).toBe(false);
      expect(isIPAChar('é')).toBe(false);
    });
  });

  describe('tokenizeText', () => {
    it('should tokenize simple text', () => {
      const tokens = tokenizeText('Hello world');
      expect(tokens).toHaveLength(3);
      expect(tokens[0]).toEqual({ text: 'Hello', isWord: true });
      expect(tokens[1]).toEqual({ text: ' ', isWord: false });
      expect(tokens[2]).toEqual({ text: 'world', isWord: true });
    });

    it('should handle punctuation', () => {
      const tokens = tokenizeText('Hello, world!');
      expect(tokens.filter((t) => t.isWord)).toHaveLength(2);
      expect(tokens.filter((t) => !t.isWord)).toHaveLength(2);
    });

    it('should normalize curly apostrophes', () => {
      const tokens = tokenizeText('don\u2019t');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].text).toBe("don't");
    });
  });

  describe('tokenizePhonetic', () => {
    it('should tokenize with word indices', () => {
      const tokens = tokenizePhonetic('huloh werld');
      expect(tokens).toHaveLength(3);
      expect(tokens[0]).toEqual({ text: 'huloh', isWord: true, wordIndex: 0 });
      expect(tokens[1]).toEqual({ text: ' ', isWord: false, wordIndex: null });
      expect(tokens[2]).toEqual({ text: 'werld', isWord: true, wordIndex: 1 });
    });

    it('should handle IPA text with stress markers', () => {
      const tokens = tokenizePhonetic('həˈloʊ');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].isWord).toBe(true);
    });

    it('should handle accented Ingglish vowels', () => {
      const tokens = tokenizePhonetic('húloh');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].text).toBe('húloh');
    });

    it('should handle punctuation', () => {
      const tokens = tokenizePhonetic('huloh, werld!');
      const words = tokens.filter((t) => t.isWord);
      const nonWords = tokens.filter((t) => !t.isWord);
      expect(words).toHaveLength(2);
      expect(nonWords).toHaveLength(2);
      expect(nonWords.every((t) => t.wordIndex === null)).toBe(true);
    });
  });

  describe('tokenizeIPA', () => {
    it('should tokenize IPA text', () => {
      const tokens = tokenizeIPA('həˈloʊ wɝld');
      expect(tokens).toHaveLength(3);
      expect(tokens[0].isWord).toBe(true);
      expect(tokens[1].isWord).toBe(false);
      expect(tokens[2].isWord).toBe(true);
    });
  });
});

describe('language detection', () => {
  describe('isLikelyIPA', () => {
    it('should detect text in IPA brackets', () => {
      expect(isLikelyIPA('/həˈloʊ/')).toBe(true);
      expect(isLikelyIPA('[kæt]')).toBe(true);
    });

    it('should detect text with IPA characters', () => {
      expect(isLikelyIPA('həˈloʊ wɝld')).toBe(true);
      expect(isLikelyIPA('θɪŋk')).toBe(true);
    });

    it('should return false for plain English', () => {
      expect(isLikelyIPA('hello world')).toBe(false);
    });

    it('should return false for Ingglish', () => {
      expect(isLikelyIPA('huloh werld')).toBe(false);
    });
  });

  describe('detectFormat', () => {
    it('should detect IPA', () => {
      expect(detectFormat('/həˈloʊ/')).toBe('ipa');
      expect(detectFormat('θɪŋk əˈbaʊt')).toBe('ipa');
    });

    it('should detect Ingglish', () => {
      expect(detectFormat('dhu kat')).toBe('ingglish');
    });

    it('should detect English', () => {
      expect(detectFormat('the cat')).toBe('english');
      expect(detectFormat('thought')).toBe('english');
    });
  });
});

describe('arpabet utilities', () => {
  describe('isConsonant', () => {
    it('should return true for consonants', () => {
      expect(isConsonant('B')).toBe(true);
      expect(isConsonant('SH')).toBe(true);
      expect(isConsonant('TH')).toBe(true);
      expect(isConsonant('NG')).toBe(true);
    });

    it('should return false for vowels', () => {
      expect(isConsonant('AH')).toBe(false);
      expect(isConsonant('AH0')).toBe(false);
      expect(isConsonant('EY1')).toBe(false);
    });
  });

  describe('getStress', () => {
    it('should extract stress level from vowels', () => {
      expect(getStress('AH0')).toBe(0);
      expect(getStress('EY1')).toBe(1);
      expect(getStress('AO2')).toBe(2);
    });

    it('should return null for consonants', () => {
      expect(getStress('B')).toBe(null);
      expect(getStress('SH')).toBe(null);
    });

    it('should return null for vowels without stress', () => {
      expect(getStress('AH')).toBe(null);
    });
  });
});
