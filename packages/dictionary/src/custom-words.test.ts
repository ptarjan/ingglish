import { describe, it, expect, beforeAll } from 'vitest';
import { wordToArpabet } from '@ingglish/g2p';
import { ARPABET_VOWELS, ARPABET_CONSONANTS } from '@ingglish/phonemes';
import {
  CUSTOM_PRONUNCIATIONS,
  getCustomPronunciation,
  getDictionary,
  hasCustomPronunciation,
  loadDictionary,
} from './index';

/** All valid ARPAbet base phonemes (vowels + consonants) */
const VALID_BASES = new Set<string>([...ARPABET_VOWELS, ...ARPABET_CONSONANTS]);

/** Check if a phoneme token is valid ARPAbet (base or base+stress) */
function isValidArpabet(phoneme: string): boolean {
  // Consonants: exact match (e.g. "B", "SH", "NG")
  if (VALID_BASES.has(phoneme)) {
    return true;
  }
  // Vowels with stress marker: strip trailing 0/1/2
  const lastChar = phoneme.codePointAt(phoneme.length - 1)!;
  if (lastChar >= 48 && lastChar <= 50) {
    return VALID_BASES.has(phoneme.slice(0, -1));
  }
  return false;
}

describe('hasCustomPronunciation', () => {
  it.each([
    ['read', true],
    ['emoji', true],
    ['thyme', true],
    ['hello', false],
    ['xyzzy', false],
    ['constructor', false],
    ['toString', false],
    ['__proto__', false],
  ])('hasCustomPronunciation(%s) → %s', (word, expected) => {
    expect(hasCustomPronunciation(word)).toBe(expected);
  });
});

describe('getCustomPronunciation', () => {
  it('returns phoneme array for known words', () => {
    expect(getCustomPronunciation('read')).toEqual(['R', 'IY1', 'D']);
  });

  it.each(['hello', 'xyzzy'])('returns undefined for unknown word "%s"', (word) => {
    expect(getCustomPronunciation(word)).toBeUndefined();
  });
});

describe('CUSTOM_PRONUNCIATIONS data validation', () => {
  it('all entries have non-empty phoneme arrays', () => {
    for (const [word, phonemes] of Object.entries(CUSTOM_PRONUNCIATIONS)) {
      expect(phonemes.length, `"${word}" has empty phoneme array`).toBeGreaterThan(0);
    }
  });

  it('all phonemes are valid ARPAbet symbols', () => {
    for (const [word, phonemes] of Object.entries(CUSTOM_PRONUNCIATIONS)) {
      for (const phoneme of phonemes) {
        expect(isValidArpabet(phoneme), `"${word}" has invalid phoneme "${phoneme}"`).toBe(true);
      }
    }
  });

  it('has no duplicate keys', () => {
    const keys = Object.keys(CUSTOM_PRONUNCIATIONS);
    const uniqueKeys = new Set(keys);
    expect(keys.length).toBe(uniqueKeys.size);
  });

  describe('no redundant entries', () => {
    beforeAll(async () => {
      await loadDictionary();
    });

    it('every custom entry either corrects CMU or differs from G2P', () => {
      const dict = getDictionary();
      const redundant: string[] = [];

      for (const [word, customPhonemes] of Object.entries(CUSTOM_PRONUNCIATIONS)) {
        const inCMU = word in dict;
        const cmuPhonemes = inCMU ? dict[word]! : null;

        // If the word is in CMU and CMU differs from custom, this entry is
        // a CMU correction — keep it regardless of what G2P produces.
        if (cmuPhonemes && cmuPhonemes.join(' ') !== customPhonemes.join(' ')) {
          continue;
        }

        // Word is either not in CMU, or CMU already matches custom.
        // Check if G2P also produces the same phonemes (exact match).
        const g2pResult = wordToArpabet(word);
        if (g2pResult.join(' ') === customPhonemes.join(' ')) {
          redundant.push(word);
        }
      }

      expect(redundant).toEqual([]);
    });
  });
});
