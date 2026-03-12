import { describe, expect, it } from 'vitest';
import { applyStressPrediction } from './index';

describe('applyStressPrediction', () => {
  it.each([
    ['cat', ['K', 'AE1', 'T'], ['K', 'AE1', 'T'], 'monosyllabic unchanged'],
    ['str', ['S', 'T', 'R'], ['S', 'T', 'R'], 'zero-vowel unchanged'],
  ] as const)('%s → passes through (%s)', (word, phonemes, expected, _desc) => {
    expect(applyStressPrediction(word, [...phonemes])).toEqual([...expected]);
  });

  it('stresses first syllable by default for two-syllable words', () => {
    const result = applyStressPrediction('rabbit', ['R', 'AE1', 'B', 'IH1', 'T']);
    expect(result[1]).toBe('AE1');
    expect(result[3]).toBe('IH0');
  });

  it.each([
    ['volunteer', ['V', 'AA1', 'L', 'AH0', 'N', 'T', 'IH1', 'R'], 6, '-eer suffix'],
    ['cassette', ['K', 'AE1', 'S', 'EH1', 'T'], 3, '-ette suffix'],
    ['donation', ['D', 'OW1', 'N', 'EY1', 'SH', 'AH0', 'N'], 3, '-tion penultimate'],
    [
      'electricity',
      ['IH1', 'L', 'EH1', 'K', 'T', 'R', 'IH1', 'S', 'IH1', 'T', 'IY1'],
      6,
      '-ity antepenultimate',
    ],
    ['return', ['R', 'IY1', 'T', 'ER1', 'N'], 3, 're- prefix'],
    ['undo', ['AH1', 'N', 'D', 'UW1'], 3, 'un- prefix'],
    ['returning', ['R', 'IY1', 'T', 'ER1', 'N', 'IH1', 'NG'], 3, '-ing + re- prefix'],
    ['undoings', ['AH1', 'N', 'D', 'UW1', 'IH1', 'NG', 'Z'], 3, '-ings + un- prefix'],
  ] as const)('stresses correct syllable in %s (%s)', (word, phonemes, stressIdx, _desc) => {
    const result = applyStressPrediction(word, [...phonemes]);
    expect(result[stressIdx]).toMatch(/1$/);
  });

  it('preserves AH0 schwa phonemes from NRL rules', () => {
    const result = applyStressPrediction('computer', [
      'K',
      'AH0',
      'M',
      'P',
      'Y',
      'UW1',
      'T',
      'ER1',
    ]);
    expect(result[1]).toBe('AH0');
  });

  it('reduces AE to AH0 when unstressed', () => {
    const result = applyStressPrediction('abstract', ['AE1', 'B', 'S', 'T', 'R', 'AE1', 'K', 'T']);
    expect(result[0]).toBe('AH0');
    expect(result[5]).toBe('AE1');
  });

  it('reassigns stress backward when predicted syllable is AH0', () => {
    const result = applyStressPrediction('abekt', ['AH0', 'B', 'EH1', 'K', 'T']);
    expect(result[0]).toBe('AH0');
    expect(result[2]).toMatch(/1$/);
  });

  it('searches backward for non-AH0 when predicted stress is AH0', () => {
    const result = applyStressPrediction('exation', ['EH1', 'K', 'AH0', 'SH', 'AH0', 'N']);
    expect(result[0]).toBe('EH1');
  });
});
