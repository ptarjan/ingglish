import { reverseTranslateSync, translateSync } from 'ingglish';
import { describe, expect, it } from 'vitest';
import {
  ARPABET_CONSONANTS,
  ARPABET_TO_INGGLISH_MAP as ARPABET_MAP,
  ARPABET_VOWELS,
  arpabetPhonemeToIngglish,
  arpabetToFormat,
  arpabetToIngglish,
  isVowel,
  stripStress,
} from './index';

describe('phoneme-map', () => {
  describe('ARPABET_MAP', () => {
    it('maps all 39 phonemes (15 vowels + 24 consonants) to ingglish spellings', () => {
      expect(ARPABET_VOWELS.length).toBe(15);
      expect(ARPABET_CONSONANTS.length).toBe(24);
      expect(ARPABET_MAP).toEqual({
        AA: 'o',
        AE: 'a',
        AH: 'uh',
        AO: 'aw',
        AW: 'ou',
        AY: 'ai',
        B: 'b',
        CH: 'ch',
        D: 'd',
        DH: 'dh',
        EH: 'e',
        ER: 'er',
        EY: 'ay',
        F: 'f',
        G: 'g',
        HH: 'h',
        IH: 'i',
        IY: 'ee',
        JH: 'j',
        K: 'k',
        L: 'l',
        M: 'm',
        N: 'n',
        NG: 'ng',
        OW: 'oh',
        OY: 'oi',
        P: 'p',
        R: 'r',
        S: 's',
        SH: 'sh',
        T: 't',
        TH: 'th',
        UH: 'u',
        UW: 'oo',
        V: 'v',
        W: 'w',
        Y: 'y',
        Z: 'z',
        ZH: 'zh',
      });
    });
  });

  describe('stripStress', () => {
    it.each([
      ['AH0', 'AH', 'removes stress 0'],
      ['EY1', 'EY', 'removes stress 1'],
      ['IY2', 'IY', 'removes stress 2'],
      ['B', 'B', 'leaves consonant unchanged'],
      ['TH', 'TH', 'leaves consonant unchanged'],
      ['NG', 'NG', 'leaves consonant unchanged'],
      ['AH', 'AH', 'already stripped'],
      ['IY', 'IY', 'already stripped'],
    ])('stripStress(%s) → %s (%s)', (input, expected) => {
      expect(stripStress(input)).toBe(expected);
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
  it.each(['cat', 'bird', 'car', 'air', 'shore', 'think', 'the', 'world'])(
    'round-trips "%s"',
    (word) => {
      const ingglish = translateSync(word);
      const english = reverseTranslateSync(ingglish);
      expect(english).toBe(word);
    }
  );
});

describe('R-colored vowels', () => {
  it.each([
    ['beer', 'beer', 'NEAR'],
    ['beard', 'beerd', 'NEAR'],
    ['fear', 'feer', 'NEAR'],
    ['near', 'neer', 'NEAR'],
    ['deer', 'deer', 'NEAR'],
    ['clear', 'kleer', 'NEAR'],
    ['star', 'star', 'START (AA+R → ar)'],
    ['car', 'kar', 'START (AA+R → ar)'],
    ['far', 'far', 'START (AA+R → ar)'],
    ['store', 'stor', 'NORTH (AO+R → or)'],
    ['more', 'mor', 'NORTH (AO+R → or)'],
    ['bore', 'bor', 'NORTH (AO+R → or)'],
    ['care', 'kair', 'SQUARE (EH+R → air)'],
    ['there', 'dhair', 'SQUARE (EH+R → air)'],
    ['arrow', 'arroh', 'TRAP+R (AE+R → arr)'],
    ['barrow', 'barroh', 'TRAP+R (AE+R → arr)'],
    ['carrot', 'karrat', 'TRAP+R (AE+R → arr)'],
  ])('translates "%s" → "%s" (%s)', (word, expected) => {
    expect(translateSync(word)).toBe(expected);
  });
});

describe('common word translations', () => {
  it.each([
    ['think', 'thingk', 'NG cluster'],
    ['beautiful', 'byootafal', 'multi-syllable'],
    // vowel sounds
    ['hot', 'hot', 'AA'],
    ['dog', 'dawg', 'AO'],
    ['law', 'law', 'AO'],
    ['cow', 'kou', 'AW'],
    ['out', 'out', 'AW'],
    ['bed', 'bed', 'EH'],
    ['red', 'red', 'EH'],
    ['day', 'day', 'EY'],
    ['say', 'say', 'EY'],
    ['see', 'see', 'IY'],
    ['me', 'mee', 'IY'],
    ['book', 'buk', 'UH'],
    ['put', 'put', 'UH'],
    ['boy', 'boi', 'OY'],
    ['my', 'mai', 'AY'],
    ['go', 'goh', 'OW'],
    ['zoo', 'zoo', 'UW'],
    ['cup', 'kuhp', 'AH stressed'],
    ['love', 'luhv', 'AH stressed'],
    ['buzz', 'buhz', 'AH stressed'],
    // consonant sounds
    ['pen', 'pen', 'P'],
    ['she', 'shee', 'SH'],
    ['fish', 'fish', 'SH'],
    ['very', 'vairee', 'V'],
    ['measure', 'mezher', 'ZH'],
    ['jump', 'juhmp', 'JH+M+P'],
    ['yes', 'yes', 'Y'],
    ['not', 'not', 'N'],
    ['bat', 'bat', 'B'],
  ])('translates %s → %s (%s)', (word, expected) => {
    expect(translateSync(word)).toBe(expected);
  });
});

describe('arpabetPhonemeToIngglish', () => {
  it.each([
    ['AH0', 'a', 'unstressed schwa'],
    ['XX', 'xx', 'unknown phoneme'],
  ])('arpabetPhonemeToIngglish(%s) → %s (%s)', (input, expected) => {
    expect(arpabetPhonemeToIngglish(input)).toBe(expected);
  });
});

describe('arpabetToFormat fallback', () => {
  it('falls back to ingglish for unknown format', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    expect(arpabetToFormat(['K', 'AE1', 'T'], 'nonexistent' as any)).toBe('kat');
  });
});

describe('isVowel', () => {
  it.each([
    ['AH0', true],
    ['EY1', true],
    ['IY2', true],
    ['B', false],
    ['TH', false],
  ])('isVowel(%s) → %s', (phoneme, expected) => {
    expect(isVowel(phoneme)).toBe(expected);
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

  it.each([
    [['AA1', 'R'], 'or', 'AA+R'],
    [['AO1', 'R'], 'awr', 'AO+R'],
    [['EH1', 'R'], 'er', 'EH+R'],
    [['AE1', 'R'], 'ar', 'AE+R'],
    [['IH1', 'R'], 'ir', 'IH+R'],
  ])('treats %s as separate phonemes → %s (%s)', (phonemes, expected) => {
    expect(arpabetToFormat(phonemes, 'ingglish', { disableRColoring: true })).toBe(expected);
  });

  it('preserves unstressed schwa handling', () => {
    // AH0 → 'a' even without R-coloring
    expect(arpabetToFormat(['AH0'], 'ingglish', { disableRColoring: true })).toBe('a');
    expect(arpabetToFormat(['HH', 'AH0', 'L', 'OW'], 'ingglish', { disableRColoring: true })).toBe(
      'haloh'
    );
  });
});
