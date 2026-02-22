import { describe, expect, it } from 'vitest';
import { arpabetPhonemeToIPA, arpabetToIPA, arpabetToIPARaw } from './to-ipa';

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

  describe('arpabetToIPA', () => {
    it('should convert hello', () => {
      const phonemes = ['HH', 'AH0', 'L', 'OW1'];
      expect(arpabetToIPA(phonemes)).toBe(`/hə${WJ}ˈ${WJ}loʊ/`);
    });

    it('should convert world', () => {
      const phonemes = ['W', 'ER1', 'L', 'D'];
      expect(arpabetToIPA(phonemes)).toBe(`/${WJ}ˈ${WJ}wɝld/`);
    });

    it('should convert the', () => {
      const phonemes = ['DH', 'AH0'];
      expect(arpabetToIPA(phonemes)).toBe('/ðə/');
    });

    it('should convert think', () => {
      const phonemes = ['TH', 'IH1', 'NG', 'K'];
      expect(arpabetToIPA(phonemes)).toBe(`/${WJ}ˈ${WJ}θɪŋk/`);
    });

    it('should convert beautiful', () => {
      const phonemes = ['B', 'Y', 'UW1', 'T', 'AH0', 'F', 'AH0', 'L'];
      expect(arpabetToIPA(phonemes)).toBe(`/${WJ}ˈ${WJ}bjutəfəl/`);
    });

    it('should handle affricates', () => {
      const phonemes = ['CH', 'ER1', 'CH'];
      expect(arpabetToIPA(phonemes)).toBe(`/${WJ}ˈ${WJ}tʃɝtʃ/`);

      const phonemes2 = ['JH', 'AH1', 'JH'];
      expect(arpabetToIPA(phonemes2)).toBe(`/${WJ}ˈ${WJ}dʒʌdʒ/`);
    });

    it('should handle diphthongs', () => {
      const phonemes = ['T', 'AY1', 'M'];
      expect(arpabetToIPA(phonemes)).toBe(`/${WJ}ˈ${WJ}taɪm/`);

      const phonemes2 = ['K', 'OY1', 'N'];
      expect(arpabetToIPA(phonemes2)).toBe(`/${WJ}ˈ${WJ}kɔɪn/`);
    });

    it('should place secondary stress at syllable boundary', () => {
      const phonemes = ['IH0', 'G', 'Z', 'AE2', 'M', 'AH0', 'N', 'EY1', 'SH', 'AH0', 'N'];
      expect(arpabetToIPA(phonemes)).toBe(`/ɪɡ${WJ}ˌ${WJ}zæmə${WJ}ˈ${WJ}neɪʃən/`);
    });
  });

  describe('arpabetToIPARaw', () => {
    it('should return IPA without slashes', () => {
      const phonemes = ['HH', 'AH0', 'L', 'OW1'];
      expect(arpabetToIPARaw(phonemes)).toBe(`hə${WJ}ˈ${WJ}loʊ`);
    });
  });
});
