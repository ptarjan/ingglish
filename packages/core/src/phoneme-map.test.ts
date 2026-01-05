import { describe, it, expect } from 'vitest';
import {
  PHONEME_MAP,
  VOWEL_MAP,
  CONSONANT_MAP,
  stripStress,
  phonemesToInglish,
} from './phoneme-map';

describe('phoneme-map', () => {
  describe('PHONEME_MAP', () => {
    it('should have all vowels mapped', () => {
      const vowels = [
        'AA',
        'AE',
        'AH',
        'AO',
        'AW',
        'AY',
        'EH',
        'ER',
        'EY',
        'IH',
        'IY',
        'OW',
        'OY',
        'UH',
        'UW',
      ];
      for (const vowel of vowels) {
        expect(PHONEME_MAP[vowel]).toBeDefined();
      }
    });

    it('should have all consonants mapped', () => {
      const consonants = [
        'B',
        'CH',
        'D',
        'DH',
        'F',
        'G',
        'HH',
        'JH',
        'K',
        'L',
        'M',
        'N',
        'NG',
        'P',
        'R',
        'S',
        'SH',
        'T',
        'TH',
        'V',
        'W',
        'Y',
        'Z',
        'ZH',
      ];
      for (const consonant of consonants) {
        expect(PHONEME_MAP[consonant]).toBeDefined();
      }
    });

    it('should have 39 total phonemes (15 vowels + 24 consonants)', () => {
      expect(Object.keys(VOWEL_MAP).length).toBe(15);
      expect(Object.keys(CONSONANT_MAP).length).toBe(24);
      expect(Object.keys(PHONEME_MAP).length).toBe(39);
    });
  });

  describe('stripStress', () => {
    it('should remove stress markers from phonemes', () => {
      expect(stripStress('AH0')).toBe('AH');
      expect(stripStress('EY1')).toBe('EY');
      expect(stripStress('IY2')).toBe('IY');
    });

    it('should leave consonants unchanged', () => {
      expect(stripStress('B')).toBe('B');
      expect(stripStress('TH')).toBe('TH');
      expect(stripStress('NG')).toBe('NG');
    });

    it('should handle already stripped vowels', () => {
      expect(stripStress('AH')).toBe('AH');
      expect(stripStress('IY')).toBe('IY');
    });
  });

  describe('phonemesToInglish', () => {
    it('should convert "hello" phonemes correctly', () => {
      // hello = HH AH0 L OW1
      const phonemes = ['HH', 'AH0', 'L', 'OW1'];
      expect(phonemesToInglish(phonemes)).toBe('huloh');
    });

    it('should convert "world" phonemes correctly', () => {
      // world = W ER1 L D
      const phonemes = ['W', 'ER1', 'L', 'D'];
      expect(phonemesToInglish(phonemes)).toBe('werld');
    });

    it('should convert "the" phonemes correctly', () => {
      // the = DH AH0 (or DH AH1)
      const phonemes = ['DH', 'AH0'];
      expect(phonemesToInglish(phonemes)).toBe('dhu');
    });

    it('should convert "think" phonemes correctly', () => {
      // think = TH IH1 NG K
      const phonemes = ['TH', 'IH1', 'NG', 'K'];
      expect(phonemesToInglish(phonemes)).toBe('thingk');
    });

    it('should convert "beautiful" phonemes correctly', () => {
      // beautiful = B Y UW1 T AH0 F AH0 L -> byootuful
      const phonemes = ['B', 'Y', 'UW1', 'T', 'AH0', 'F', 'AH0', 'L'];
      expect(phonemesToInglish(phonemes)).toBe('byootuful');
    });

    it('should handle vowel sounds correctly', () => {
      // Test each vowel
      expect(phonemesToInglish(['AA1'])).toBe('ah'); // father
      expect(phonemesToInglish(['AE1'])).toBe('a'); // cat
      expect(phonemesToInglish(['AH1'])).toBe('u'); // but
      expect(phonemesToInglish(['AO1'])).toBe('aw'); // caught
      expect(phonemesToInglish(['AW1'])).toBe('ow'); // cow
      expect(phonemesToInglish(['AY1'])).toBe('ai'); // my
      expect(phonemesToInglish(['EH1'])).toBe('e'); // bed
      expect(phonemesToInglish(['ER1'])).toBe('er'); // bird
      expect(phonemesToInglish(['EY1'])).toBe('ay'); // say
      expect(phonemesToInglish(['IH1'])).toBe('i'); // bit
      expect(phonemesToInglish(['IY1'])).toBe('ee'); // bee
      expect(phonemesToInglish(['OW1'])).toBe('oh'); // go
      expect(phonemesToInglish(['OY1'])).toBe('oi'); // boy
      expect(phonemesToInglish(['UH1'])).toBe('uu'); // book
      expect(phonemesToInglish(['UW1'])).toBe('oo'); // too
    });

    it('should handle consonant sounds correctly', () => {
      expect(phonemesToInglish(['B'])).toBe('b');
      expect(phonemesToInglish(['CH'])).toBe('ch');
      expect(phonemesToInglish(['D'])).toBe('d');
      expect(phonemesToInglish(['DH'])).toBe('dh');
      expect(phonemesToInglish(['F'])).toBe('f');
      expect(phonemesToInglish(['G'])).toBe('g');
      expect(phonemesToInglish(['HH'])).toBe('h');
      expect(phonemesToInglish(['JH'])).toBe('j');
      expect(phonemesToInglish(['K'])).toBe('k');
      expect(phonemesToInglish(['L'])).toBe('l');
      expect(phonemesToInglish(['M'])).toBe('m');
      expect(phonemesToInglish(['N'])).toBe('n');
      expect(phonemesToInglish(['NG'])).toBe('ng');
      expect(phonemesToInglish(['P'])).toBe('p');
      expect(phonemesToInglish(['R'])).toBe('r');
      expect(phonemesToInglish(['S'])).toBe('s');
      expect(phonemesToInglish(['SH'])).toBe('sh');
      expect(phonemesToInglish(['T'])).toBe('t');
      expect(phonemesToInglish(['TH'])).toBe('th');
      expect(phonemesToInglish(['V'])).toBe('v');
      expect(phonemesToInglish(['W'])).toBe('w');
      expect(phonemesToInglish(['Y'])).toBe('y');
      expect(phonemesToInglish(['Z'])).toBe('z');
      expect(phonemesToInglish(['ZH'])).toBe('zh');
    });
  });
});
