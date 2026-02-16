import { describe, it, expect } from 'vitest';
import { isConsonant, getStress } from './arpabet';

describe('arpabet utilities', () => {
  describe('isConsonant', () => {
    it('should return true for consonants', () => {
      expect(isConsonant('B')).toBe(true);
      expect(isConsonant('SH')).toBe(true);
      expect(isConsonant('TH')).toBe(true);
      expect(isConsonant('NG')).toBe(true);
    });

    it('should return false for vowels', () => {
      expect(isConsonant('AH')).toBe(false);
      expect(isConsonant('AH0')).toBe(false);
      expect(isConsonant('EY1')).toBe(false);
    });
  });

  describe('getStress', () => {
    it('should extract stress level from vowels', () => {
      expect(getStress('AH0')).toBe(0);
      expect(getStress('EY1')).toBe(1);
      expect(getStress('AO2')).toBe(2);
    });

    it('should return null for consonants', () => {
      expect(getStress('B')).toBe(null);
      expect(getStress('SH')).toBe(null);
    });

    it('should return null for vowels without stress', () => {
      expect(getStress('AH')).toBe(null);
    });
  });
});
