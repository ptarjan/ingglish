import { describe, expect, it } from 'vitest';
import { detectFormat, isLikelyIPA } from './language';

describe('language detection', () => {
  describe('isLikelyIPA', () => {
    it('should detect text in IPA brackets', () => {
      expect(isLikelyIPA('/h\u0259\u02C8lo\u028A/')).toBe(true);
      expect(isLikelyIPA('[k\u00E6t]')).toBe(true);
    });

    it('should detect text with IPA characters', () => {
      expect(isLikelyIPA('h\u0259\u02C8lo\u028A w\u025Dld')).toBe(true);
      expect(isLikelyIPA('\u03B8\u026A\u014Bk')).toBe(true);
    });

    it('should return false for plain English', () => {
      expect(isLikelyIPA('hello world')).toBe(false);
    });

    it('should return false for Ingglish', () => {
      expect(isLikelyIPA('haloh werld')).toBe(false);
    });
  });

  describe('detectFormat', () => {
    it('should detect IPA', () => {
      expect(detectFormat('/h\u0259\u02C8lo\u028A/')).toBe('ipa');
      expect(detectFormat('\u03B8\u026A\u014Bk \u0259\u02C8ba\u028At')).toBe('ipa');
    });

    it('should detect Ingglish', () => {
      expect(detectFormat('dha kat')).toBe('ingglish');
    });

    it('should detect English', () => {
      expect(detectFormat('the cat')).toBe('english');
      expect(detectFormat('thought')).toBe('english');
    });
  });
});
