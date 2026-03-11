import { describe, expect, it } from 'vitest';
import { getStress } from './index';

describe('arpabet utilities', () => {
  describe('getStress', () => {
    it.each([
      ['AH0', 0],
      ['EY1', 1],
      ['AO2', 2],
      ['B', null],
      ['SH', null],
      ['AH', null],
    ] as const)('getStress(%s) → %s', (input, expected) => {
      expect(getStress(input)).toBe(expected);
    });
  });
});
