import { describe, expect, it } from 'vitest';
import { getStress } from './arpabet';

describe('arpabet utilities', () => {
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
