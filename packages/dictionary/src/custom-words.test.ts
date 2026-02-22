import { describe, it, expect } from 'vitest';
import { ARPABET_VOWELS, ARPABET_CONSONANTS } from '@ingglish/phonemes';
import {
  hasCustomPronunciation,
  getCustomPronunciation,
  CUSTOM_PRONUNCIATIONS,
} from './custom-words';

/** All valid ARPAbet base phonemes (vowels + consonants) */
const VALID_BASES = new Set<string>([...ARPABET_VOWELS, ...ARPABET_CONSONANTS]);

/** Check if a phoneme token is valid ARPAbet (base or base+stress) */
function isValidArpabet(phoneme: string): boolean {
  // Consonants: exact match (e.g. "B", "SH", "NG")
  if (VALID_BASES.has(phoneme)) {
    return true;
  }
  // Vowels with stress marker: strip trailing 0/1/2
  const lastChar = phoneme.charCodeAt(phoneme.length - 1);
  if (lastChar >= 48 && lastChar <= 50) {
    return VALID_BASES.has(phoneme.slice(0, -1));
  }
  return false;
}

describe('hasCustomPronunciation', () => {
  it('returns true for known custom words', () => {
    expect(hasCustomPronunciation('read')).toBe(true);
    expect(hasCustomPronunciation('emoji')).toBe(true);
    expect(hasCustomPronunciation('thyme')).toBe(true);
  });

  it('returns false for words not in custom list', () => {
    expect(hasCustomPronunciation('hello')).toBe(false);
    expect(hasCustomPronunciation('xyzzy')).toBe(false);
  });

  it('is prototype-safe', () => {
    expect(hasCustomPronunciation('constructor')).toBe(false);
    expect(hasCustomPronunciation('toString')).toBe(false);
    expect(hasCustomPronunciation('__proto__')).toBe(false);
  });
});

describe('getCustomPronunciation', () => {
  it('returns phoneme array for known words', () => {
    const result = getCustomPronunciation('read');
    expect(result).toEqual(['R', 'IY1', 'D']);
  });

  it('returns undefined for unknown words', () => {
    expect(getCustomPronunciation('hello')).toBeUndefined();
    expect(getCustomPronunciation('xyzzy')).toBeUndefined();
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
});
