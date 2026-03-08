import { describe, expect, it } from 'vitest';
import { arpabetPhonemeToIPA, arpabetToIPARaw } from './to-ipa';

// Word joiner character (U+2060) prevents line breaks around stress markers
const WJ = '\u2060';

describe('arpabet-to-ipa', () => {
  describe('arpabetPhonemeToIPA', () => {
    it('should convert vowels', () => {
      expect(arpabetPhonemeToIPA('AA')).toBe('ɑ');
      expect(arpabetPhonemeToIPA('AE')).toBe('æ');
      expect(arpabetPhonemeToIPA('IY')).toBe('i');
      expect(arpabetPhonemeToIPA('UW')).toBe('u');
    });

    it('should convert consonants', () => {
      expect(arpabetPhonemeToIPA('B')).toBe('b');
      expect(arpabetPhonemeToIPA('SH')).toBe('ʃ');
      expect(arpabetPhonemeToIPA('TH')).toBe('θ');
      expect(arpabetPhonemeToIPA('DH')).toBe('ð');
      expect(arpabetPhonemeToIPA('NG')).toBe('ŋ');
    });

    it('should handle stressed vowels', () => {
      expect(arpabetPhonemeToIPA('EY1')).toBe(`${WJ}ˈ${WJ}eɪ`);
      expect(arpabetPhonemeToIPA('OW1')).toBe(`${WJ}ˈ${WJ}oʊ`);
      expect(arpabetPhonemeToIPA('AY2')).toBe(`${WJ}ˌ${WJ}aɪ`);
    });

    it('should convert unstressed AH to schwa', () => {
      expect(arpabetPhonemeToIPA('AH0')).toBe('ə');
    });

    it('should handle stressed AH as ʌ', () => {
      expect(arpabetPhonemeToIPA('AH1')).toBe(`${WJ}ˈ${WJ}ʌ`);
      expect(arpabetPhonemeToIPA('AH')).toBe('ʌ');
    });

    it('should return lowercase for unknown phonemes', () => {
      expect(arpabetPhonemeToIPA('XY')).toBe('xy');
    });
  });

  describe('arpabetToIPARaw', () => {
    it('should return IPA without slashes', () => {
      const phonemes = ['HH', 'AH0', 'L', 'OW1'];
      expect(arpabetToIPARaw(phonemes)).toBe(`hə${WJ}ˈ${WJ}loʊ`);
    });
  });
});
