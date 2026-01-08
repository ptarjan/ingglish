import { describe, it, expect } from 'vitest';
import { arpabetPhonemeToIPA, phonemesToIPA, phonemesToIPARaw } from './arpabet-to-ipa';

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

  describe('phonemesToIPA', () => {
    it('should convert hello', () => {
      // hello: HH AH0 L OW1
      // Stress marker at syllable boundary (before L, which starts the stressed syllable)
      const phonemes = ['HH', 'AH0', 'L', 'OW1'];
      expect(phonemesToIPA(phonemes)).toBe(`/hə${WJ}ˈ${WJ}loʊ/`);
    });

    it('should convert world', () => {
      // world: W ER1 L D
      // Word-initial stress - marker at the very beginning (W is onset)
      const phonemes = ['W', 'ER1', 'L', 'D'];
      expect(phonemesToIPA(phonemes)).toBe(`/${WJ}ˈ${WJ}wɝld/`);
    });

    it('should convert the', () => {
      // the: DH AH0 (no stress)
      const phonemes = ['DH', 'AH0'];
      expect(phonemesToIPA(phonemes)).toBe('/ðə/');
    });

    it('should convert think', () => {
      // think: TH IH1 NG K
      // Word-initial stress
      const phonemes = ['TH', 'IH1', 'NG', 'K'];
      expect(phonemesToIPA(phonemes)).toBe(`/${WJ}ˈ${WJ}θɪŋk/`);
    });

    it('should convert beautiful', () => {
      // beautiful: B Y UW1 T AH0 F AH0 L
      // Word-initial stress (B,Y form the onset)
      const phonemes = ['B', 'Y', 'UW1', 'T', 'AH0', 'F', 'AH0', 'L'];
      expect(phonemesToIPA(phonemes)).toBe(`/${WJ}ˈ${WJ}bjutəfəl/`);
    });

    it('should handle affricates', () => {
      // church: CH ER1 CH
      const phonemes = ['CH', 'ER1', 'CH'];
      expect(phonemesToIPA(phonemes)).toBe(`/${WJ}ˈ${WJ}tʃɝtʃ/`);

      // judge: JH AH1 JH
      const phonemes2 = ['JH', 'AH1', 'JH'];
      expect(phonemesToIPA(phonemes2)).toBe(`/${WJ}ˈ${WJ}dʒʌdʒ/`);
    });

    it('should handle diphthongs', () => {
      // time: T AY1 M
      const phonemes = ['T', 'AY1', 'M'];
      expect(phonemesToIPA(phonemes)).toBe(`/${WJ}ˈ${WJ}taɪm/`);

      // coin: K OY1 N
      const phonemes2 = ['K', 'OY1', 'N'];
      expect(phonemesToIPA(phonemes2)).toBe(`/${WJ}ˈ${WJ}kɔɪn/`);
    });

    it('should place secondary stress at syllable boundary', () => {
      // examination: IH0 G Z AE2 M AH0 N EY1 SH AH0 N
      const phonemes = ['IH0', 'G', 'Z', 'AE2', 'M', 'AH0', 'N', 'EY1', 'SH', 'AH0', 'N'];
      // Note: IPA uses ɡ (U+0261) not g
      expect(phonemesToIPA(phonemes)).toBe(`/ɪ${WJ}ˌ${WJ}ɡzæmə${WJ}ˈ${WJ}neɪʃən/`);
    });
  });

  describe('phonemesToIPARaw', () => {
    it('should return IPA without slashes', () => {
      const phonemes = ['HH', 'AH0', 'L', 'OW1'];
      expect(phonemesToIPARaw(phonemes)).toBe(`hə${WJ}ˈ${WJ}loʊ`);
    });
  });
});
