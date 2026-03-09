import { describe, expect, it } from 'vitest';
import { isValidOnset } from './phonotactics';
import { findOnsetStart } from './index';

describe('phonotactics', () => {
  describe('findOnsetStart', () => {
    it('returns 0 for empty consonant array', () => {
      expect(findOnsetStart([])).toBe(0);
    });

    it('returns 0 for single valid consonant', () => {
      expect(findOnsetStart(['T'])).toBe(0);
    });

    it('finds onset start for "extra" (K S T R)', () => {
      // S T R is valid onset, onset starts at index 1
      expect(findOnsetStart(['K', 'S', 'T', 'R'])).toBe(1);
    });

    it('finds onset start for "instruct" (N S T R)', () => {
      // S T R is valid onset, onset starts at index 1
      expect(findOnsetStart(['N', 'S', 'T', 'R'])).toBe(1);
    });

    it('finds onset start for simple coda+onset (N T)', () => {
      // T is valid onset, onset starts at index 1
      expect(findOnsetStart(['N', 'T'])).toBe(1);
    });

    it('returns 0 when entire cluster is a valid onset', () => {
      expect(findOnsetStart(['S', 'T'])).toBe(0);
    });

    it('handles cluster where only last consonant is valid', () => {
      // NG is not a valid onset, so only K is valid
      expect(findOnsetStart(['NG', 'K'])).toBe(1);
    });

    it('falls back to last consonant when nothing is valid', () => {
      // NG alone is not a valid onset
      expect(findOnsetStart(['NG'])).toBe(0);
    });
  });

  describe('isValidOnset', () => {
    it('returns true for empty consonant array (null onset)', () => {
      expect(isValidOnset([])).toBe(true);
    });
  });
});
