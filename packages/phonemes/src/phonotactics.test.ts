import { describe, expect, it } from 'vitest';
import { isValidOnset, VALID_ONSETS } from './phonotactics';
import { findOnsetStart } from './index';

describe('phonotactics', () => {
  describe('VALID_ONSETS', () => {
    it('includes single consonants', () => {
      expect(VALID_ONSETS.has('B')).toBe(true);
      expect(VALID_ONSETS.has('K')).toBe(true);
      expect(VALID_ONSETS.has('S')).toBe(true);
    });

    it('includes common two-consonant clusters', () => {
      expect(VALID_ONSETS.has('B L')).toBe(true);
      expect(VALID_ONSETS.has('S T')).toBe(true);
      expect(VALID_ONSETS.has('T R')).toBe(true);
    });

    it('includes three-consonant clusters', () => {
      expect(VALID_ONSETS.has('S T R')).toBe(true);
      expect(VALID_ONSETS.has('S P L')).toBe(true);
      expect(VALID_ONSETS.has('S K R')).toBe(true);
    });

    it('does not include NG (only valid in codas)', () => {
      expect(VALID_ONSETS.has('NG')).toBe(false);
    });

    it('does not include invalid clusters', () => {
      expect(VALID_ONSETS.has('S R')).toBe(false);
      expect(VALID_ONSETS.has('T L')).toBe(false);
    });
  });

  describe('isValidOnset', () => {
    it('returns true for empty onset (null onset)', () => {
      expect(isValidOnset([])).toBe(true);
    });

    it('returns true for valid single consonant', () => {
      expect(isValidOnset(['S'])).toBe(true);
    });

    it('returns true for valid cluster', () => {
      expect(isValidOnset(['S', 'T', 'R'])).toBe(true);
    });

    it('returns false for invalid cluster', () => {
      expect(isValidOnset(['S', 'R'])).toBe(false);
    });

    it('returns false for NG', () => {
      expect(isValidOnset(['NG'])).toBe(false);
    });
  });

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
});
