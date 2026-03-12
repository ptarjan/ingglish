import { describe, expect, it } from 'vitest';
import { isValidOnset } from './phonotactics';
import { findOnsetStart } from './index';

describe('phonotactics', () => {
  describe('findOnsetStart', () => {
    it.each([
      [[], 0, 'empty consonant array'],
      [['T'], 0, 'single valid consonant'],
      [['K', 'S', 'T', 'R'], 1, '"extra" (K S T R)'],
      [['N', 'S', 'T', 'R'], 1, '"instruct" (N S T R)'],
      [['N', 'T'], 1, 'simple coda+onset (N T)'],
      [['S', 'T'], 0, 'entire cluster is valid onset'],
      [['NG', 'K'], 1, 'only last consonant valid'],
      [['NG'], 0, 'falls back to last consonant'],
    ] as const)('findOnsetStart(%j) → %d (%s)', (input, expected, _desc) => {
      expect(findOnsetStart([...input])).toBe(expected);
    });
  });

  describe('isValidOnset', () => {
    it('returns true for empty consonant array (null onset)', () => {
      expect(isValidOnset([])).toBe(true);
    });
  });
});
