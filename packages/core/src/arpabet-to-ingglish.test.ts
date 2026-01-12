import { describe, it, expect } from 'vitest';
import {
  ARPABET_TO_INGGLISH_MAP as ARPABET_MAP,
  INGGLISH_VOWEL_MAP as VOWEL_MAP,
  INGGLISH_CONSONANT_MAP as CONSONANT_MAP,
  arpabetToIngglish,
} from './convert';
import { stripStress } from './phonemes/arpabet';

describe('phoneme-map', () => {
  describe('ARPABET_MAP', () => {
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
        expect(ARPABET_MAP[vowel]).toBeDefined();
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
        expect(ARPABET_MAP[consonant]).toBeDefined();
      }
    });

    it('should have 39 total phonemes (15 vowels + 24 consonants)', () => {
      expect(Object.keys(VOWEL_MAP).length).toBe(15);
      expect(Object.keys(CONSONANT_MAP).length).toBe(24);
      expect(Object.keys(ARPABET_MAP).length).toBe(39);
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

  describe('arpabetToIngglish', () => {
    it('should convert "hello" phonemes correctly', () => {
      // hello = HH AH0 L OW1
      const phonemes = ['HH', 'AH0', 'L', 'OW1'];
      expect(arpabetToIngglish(phonemes)).toBe('huloh');
    });

    it('should convert "world" phonemes correctly', () => {
      // world = W ER1 L D
      const phonemes = ['W', 'ER1', 'L', 'D'];
      expect(arpabetToIngglish(phonemes)).toBe('werld');
    });

    it('should convert "the" phonemes correctly', () => {
      // the = DH AH0 (or DH AH1)
      const phonemes = ['DH', 'AH0'];
      expect(arpabetToIngglish(phonemes)).toBe('dhu');
    });

    it('should convert "think" phonemes correctly', () => {
      // think = TH IH1 NG K
      const phonemes = ['TH', 'IH1', 'NG', 'K'];
      expect(arpabetToIngglish(phonemes)).toBe('thingk');
    });

    it('should convert "beautiful" phonemes correctly', () => {
      // beautiful = B Y UW1 T AH0 F AH0 L -> byuutuful
      const phonemes = ['B', 'Y', 'UW1', 'T', 'AH0', 'F', 'AH0', 'L'];
      expect(arpabetToIngglish(phonemes)).toBe('byuutuful');
    });

    it('should handle vowel sounds correctly', () => {
      // Test each vowel
      expect(arpabetToIngglish(['AA1'])).toBe('o'); // father, hot, rock
      expect(arpabetToIngglish(['AE1'])).toBe('a'); // cat
      expect(arpabetToIngglish(['AH1'])).toBe('u'); // but
      expect(arpabetToIngglish(['AO1'])).toBe('aw'); // caught, law, thought
      expect(arpabetToIngglish(['AW1'])).toBe('ow'); // cow
      expect(arpabetToIngglish(['AY1'])).toBe('ai'); // my
      expect(arpabetToIngglish(['EH1'])).toBe('e'); // bed
      expect(arpabetToIngglish(['ER1'])).toBe('er'); // bird
      expect(arpabetToIngglish(['EY1'])).toBe('ay'); // say
      expect(arpabetToIngglish(['IH1'])).toBe('i'); // bit
      expect(arpabetToIngglish(['IY1'])).toBe('ee'); // bee
      expect(arpabetToIngglish(['OW1'])).toBe('oh'); // go
      expect(arpabetToIngglish(['OY1'])).toBe('oi'); // boy
      expect(arpabetToIngglish(['UH1'])).toBe('oo'); // book
      expect(arpabetToIngglish(['UW1'])).toBe('uu'); // too
    });

    it('should handle R-colored vowels (AA+R→ar, AO+R→or, EH+R→air, AE+R→arr)', () => {
      // AA+R → ar
      expect(arpabetToIngglish(['S', 'T', 'AA1', 'R'])).toBe('star');
      expect(arpabetToIngglish(['K', 'AA1', 'R'])).toBe('kar');
      // AO+R → or
      expect(arpabetToIngglish(['S', 'T', 'AO1', 'R'])).toBe('stor');
      expect(arpabetToIngglish(['M', 'AO1', 'R'])).toBe('mor');
      // EH+R → air
      expect(arpabetToIngglish(['EH1', 'R'])).toBe('air');
      expect(arpabetToIngglish(['K', 'EH1', 'R'])).toBe('kair');
      expect(arpabetToIngglish(['DH', 'EH1', 'R'])).toBe('dhair');
      // AE+R → arr
      expect(arpabetToIngglish(['AE1', 'R', 'OW0'])).toBe('arroh'); // arrow
      expect(arpabetToIngglish(['B', 'AE1', 'R', 'OW0'])).toBe('barroh'); // barrow
      expect(arpabetToIngglish(['K', 'AE1', 'R', 'AH0', 'T'])).toBe('karrut'); // carrot
      // Standalone vowels without R
      expect(arpabetToIngglish(['AA1'])).toBe('o');
      expect(arpabetToIngglish(['AO1'])).toBe('aw');
      expect(arpabetToIngglish(['EH1'])).toBe('e');
      expect(arpabetToIngglish(['AE1'])).toBe('a');
    });

    it('should handle consonant sounds correctly', () => {
      expect(arpabetToIngglish(['B'])).toBe('b');
      expect(arpabetToIngglish(['CH'])).toBe('ch');
      expect(arpabetToIngglish(['D'])).toBe('d');
      expect(arpabetToIngglish(['DH'])).toBe('dh');
      expect(arpabetToIngglish(['F'])).toBe('f');
      expect(arpabetToIngglish(['G'])).toBe('g');
      expect(arpabetToIngglish(['HH'])).toBe('h');
      expect(arpabetToIngglish(['JH'])).toBe('j');
      expect(arpabetToIngglish(['K'])).toBe('k');
      expect(arpabetToIngglish(['L'])).toBe('l');
      expect(arpabetToIngglish(['M'])).toBe('m');
      expect(arpabetToIngglish(['N'])).toBe('n');
      expect(arpabetToIngglish(['NG'])).toBe('ng');
      expect(arpabetToIngglish(['P'])).toBe('p');
      expect(arpabetToIngglish(['R'])).toBe('r');
      expect(arpabetToIngglish(['S'])).toBe('s');
      expect(arpabetToIngglish(['SH'])).toBe('sh');
      expect(arpabetToIngglish(['T'])).toBe('t');
      expect(arpabetToIngglish(['TH'])).toBe('th');
      expect(arpabetToIngglish(['V'])).toBe('v');
      expect(arpabetToIngglish(['W'])).toBe('w');
      expect(arpabetToIngglish(['Y'])).toBe('y');
      expect(arpabetToIngglish(['Z'])).toBe('z');
      expect(arpabetToIngglish(['ZH'])).toBe('zh');
    });
  });
});
