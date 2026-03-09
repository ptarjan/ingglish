import { reverseTranslate, translate, translateSync } from 'ingglish';
import { describe, expect, it } from 'vitest';
import {
  ARPABET_CONSONANTS,
  ARPABET_TO_INGGLISH_MAP as ARPABET_MAP,
  ARPABET_VOWELS,
  arpabetToFormat,
  arpabetToIngglish,
  stripStress,
} from './index';

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
      expect(ARPABET_VOWELS.length).toBe(15);
      expect(ARPABET_CONSONANTS.length).toBe(24);
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
    it('should insert hyphen to break 3+ identical consecutive letters', () => {
      // IY+EH = "ee"+"e" → "ee-e" (not "eee")
      expect(arpabetToIngglish(['K', 'IY1', 'EH'])).toBe('kee-e');
      // Full word: Romanian "copilărie" /ko.pi.ləˈri.e/
      expect(arpabetToIngglish(['K', 'OW', 'P', 'IY', 'L', 'AH0', 'R', 'IY1', 'EH'])).toBe(
        'kohpeeluhree-e'
      );
      // UW+UH = "oo"+"u" is fine (no triple), should not get a hyphen
      expect(arpabetToIngglish(['K', 'UW1', 'UH'])).toBe('koou');
    });
  });
});

describe('arpabetToIngglish round-trip', () => {
  it('should round-trip words through Ingglish', async () => {
    // Test words covering various phoneme categories including R-colored vowels
    for (const word of ['cat', 'bird', 'car', 'air', 'shore', 'think', 'the', 'world']) {
      const ingglish = await translate(word);
      const english = await reverseTranslate(ingglish);
      expect(english, `Failed round-trip for "${word}"`).toBe(word);
    }
  });
});

describe('R-colored vowels', () => {
  it('translates NEAR vowel words (IH+R → eer)', () => {
    expect(translateSync('beer')).toBe('beer');
    expect(translateSync('beard')).toBe('beerd');
    expect(translateSync('fear')).toBe('feer');
    expect(translateSync('near')).toBe('neer');
    expect(translateSync('deer')).toBe('deer');
    expect(translateSync('clear')).toBe('kleer');
  });

  it('translates START vowel words (AA+R → ar)', () => {
    expect(translateSync('star')).toBe('star');
    expect(translateSync('car')).toBe('kar');
    expect(translateSync('far')).toBe('far');
  });

  it('translates NORTH vowel words (AO+R → or)', () => {
    expect(translateSync('store')).toBe('stor');
    expect(translateSync('more')).toBe('mor');
    expect(translateSync('bore')).toBe('bor');
  });

  it('translates SQUARE vowel words (EH+R → air)', () => {
    expect(translateSync('care')).toBe('kair');
    expect(translateSync('there')).toBe('dhair');
  });

  it('translates words with TRAP before R (AE+R → arr)', () => {
    expect(translateSync('arrow')).toBe('arroh');
    expect(translateSync('barrow')).toBe('barroh');
    expect(translateSync('carrot')).toBe('karrat');
  });
});

describe('common word translations', () => {
  it('translates NG cluster words', () => {
    expect(translateSync('think')).toBe('thingk');
  });

  it('translates multi-syllable words', () => {
    expect(translateSync('beautiful')).toBe('byootafal');
  });

  it('translates all vowel sounds', () => {
    expect(translateSync('hot')).toBe('hot'); // AA
    expect(translateSync('dog')).toBe('dawg'); // AO
    expect(translateSync('law')).toBe('law'); // AO
    expect(translateSync('cow')).toBe('kou'); // AW
    expect(translateSync('out')).toBe('out'); // AW
    expect(translateSync('bed')).toBe('bed'); // EH
    expect(translateSync('red')).toBe('red'); // EH
    expect(translateSync('day')).toBe('day'); // EY
    expect(translateSync('say')).toBe('say'); // EY
    expect(translateSync('see')).toBe('see'); // IY
    expect(translateSync('me')).toBe('mee'); // IY
    expect(translateSync('book')).toBe('buk'); // UH
    expect(translateSync('put')).toBe('put'); // UH
    expect(translateSync('boy')).toBe('boi'); // OY
    expect(translateSync('my')).toBe('mai'); // AY
    expect(translateSync('go')).toBe('goh'); // OW
    expect(translateSync('zoo')).toBe('zoo'); // UW
    expect(translateSync('cup')).toBe('kuhp'); // AH (stressed)
    expect(translateSync('love')).toBe('luhv'); // AH (stressed)
    expect(translateSync('buzz')).toBe('buhz'); // AH (stressed)
  });

  it('translates all consonant sounds', () => {
    expect(translateSync('go')).toBe('goh'); // G
    expect(translateSync('pen')).toBe('pen'); // P
    expect(translateSync('she')).toBe('shee'); // SH
    expect(translateSync('fish')).toBe('fish'); // SH
    expect(translateSync('very')).toBe('vairee'); // V
    expect(translateSync('zoo')).toBe('zoo'); // Z
    expect(translateSync('measure')).toBe('mezher'); // ZH
    expect(translateSync('jump')).toBe('juhmp'); // JH, M, P
    expect(translateSync('yes')).toBe('yes'); // Y (before non-UW vowel)
    expect(translateSync('not')).toBe('not'); // N
    expect(translateSync('bat')).toBe('bat'); // B
  });
});

describe('arpabetToFormat with disableRColoring', () => {
  it('disables R-coloring for foreign text', () => {
    // With R-coloring (English default): AE+R → "arr"
    expect(arpabetToFormat(['S', 'AE', 'R', 'AE', 'NG'])).toBe('sarrang');
    // Without R-coloring (foreign text): AE+R → "a"+"r" = "ar"
    expect(
      arpabetToFormat(['S', 'AE', 'R', 'AE', 'NG'], 'ingglish', { disableRColoring: true })
    ).toBe('sarang');
  });

  it('treats all vowel+R as separate phonemes when disabled', () => {
    // AA+R: "ar" stays "ar" (same result, different path)
    expect(arpabetToFormat(['AA1', 'R'], 'ingglish', { disableRColoring: true })).toBe('or');
    // AO+R: "or" → "aw"+"r" = "awr"
    expect(arpabetToFormat(['AO1', 'R'], 'ingglish', { disableRColoring: true })).toBe('awr');
    // EH+R: "air" → "e"+"r" = "er"
    expect(arpabetToFormat(['EH1', 'R'], 'ingglish', { disableRColoring: true })).toBe('er');
    // AE+R: "arr" → "a"+"r" = "ar"
    expect(arpabetToFormat(['AE1', 'R'], 'ingglish', { disableRColoring: true })).toBe('ar');
    // IH+R: "eer" → "i"+"r" = "ir"
    expect(arpabetToFormat(['IH1', 'R'], 'ingglish', { disableRColoring: true })).toBe('ir');
  });

  it('preserves unstressed schwa handling', () => {
    // AH0 → 'a' even without R-coloring
    expect(arpabetToFormat(['AH0'], 'ingglish', { disableRColoring: true })).toBe('a');
    expect(arpabetToFormat(['HH', 'AH0', 'L', 'OW'], 'ingglish', { disableRColoring: true })).toBe(
      'haloh'
    );
  });
});
