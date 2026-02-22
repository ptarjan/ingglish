import { describe, expect, it } from 'vitest';
import { applyStressPrediction } from './stress';

describe('applyStressPrediction', () => {
  it('passes through monosyllabic words unchanged', () => {
    const phonemes = ['K', 'AE1', 'T'];
    const result = applyStressPrediction('cat', phonemes);
    expect(result).toEqual(['K', 'AE1', 'T']);
  });

  it('keeps zero-vowel sequences unchanged', () => {
    // No vowels (edge case, e.g., consonant cluster)
    const phonemes = ['S', 'T', 'R'];
    expect(applyStressPrediction('str', phonemes)).toEqual(['S', 'T', 'R']);
  });

  it('stresses first syllable by default for two-syllable words', () => {
    // Simulating "rabbit" = R AE1 B IH1 T
    const phonemes = ['R', 'AE1', 'B', 'IH1', 'T'];
    const result = applyStressPrediction('rabbit', phonemes);
    // First vowel should be stressed (1), second unstressed (0)
    expect(result[1]).toBe('AE1');
    expect(result[3]).toBe('IH0');
  });

  it('stresses final syllable for stress-attracting suffixes (-eer)', () => {
    // Simulating "volunteer" = V AA1 L AH0 N T IH1 R
    const phonemes = ['V', 'AA1', 'L', 'AH0', 'N', 'T', 'IH1', 'R'];
    const result = applyStressPrediction('volunteer', phonemes);
    // Last vowel should be stressed
    expect(result[6]).toMatch(/1$/);
  });

  it('stresses final syllable for -ette suffix', () => {
    const phonemes = ['K', 'AE1', 'S', 'EH1', 'T'];
    const result = applyStressPrediction('cassette', phonemes);
    // Second vowel (last) should be stressed
    expect(result[3]).toBe('EH1');
  });

  it('applies pre-stress suffix rules (-tion = penultimate)', () => {
    // "donation" = D OW1 N EY1 SH AH0 N — 3 vowels
    const phonemes = ['D', 'OW1', 'N', 'EY1', 'SH', 'AH0', 'N'];
    const result = applyStressPrediction('donation', phonemes);
    // -tion stresses penultimate (2nd from end) = index 1 of 3 vowels
    expect(result[3]).toBe('EY1');
  });

  it('applies pre-stress suffix rules (-ity = antepenultimate)', () => {
    // "electricity" = IH1 L EH1 K T R IH1 S IH1 T IY1 — 5 vowels
    const phonemes = ['IH1', 'L', 'EH1', 'K', 'T', 'R', 'IH1', 'S', 'IH1', 'T', 'IY1'];
    const result = applyStressPrediction('electricity', phonemes);
    // -ity stresses 3rd from end = index 2 of 5 vowels
    expect(result[6]).toBe('IH1');
  });

  it('handles unstressed prefix "re-"', () => {
    // "return" = R IY1 T ER1 N — 2 vowels
    const phonemes = ['R', 'IY1', 'T', 'ER1', 'N'];
    const result = applyStressPrediction('return', phonemes);
    // Prefix re- → stress 2nd syllable
    expect(result[3]).toMatch(/1$/);
  });

  it('handles unstressed prefix "un-"', () => {
    // "undo" = AH1 N D UW1 — 2 vowels
    const phonemes = ['AH1', 'N', 'D', 'UW1'];
    const result = applyStressPrediction('undo', phonemes);
    // Prefix un- → stress 2nd syllable
    expect(result[3]).toMatch(/1$/);
  });

  it('preserves AH0 schwa phonemes from NRL rules', () => {
    // If NRL already reduced a vowel to AH0, don't re-stress it
    const phonemes = ['K', 'AH0', 'M', 'P', 'Y', 'UW1', 'T', 'ER1'];
    const result = applyStressPrediction('computer', phonemes);
    // AH0 should stay AH0
    expect(result[1]).toBe('AH0');
  });

  it('reduces AE to AH0 when unstressed', () => {
    // "abstract" = AE1 B S T R AE1 K T — 2 vowels
    // ab- prefix rule → stress falls on 2nd syllable
    const phonemes = ['AE1', 'B', 'S', 'T', 'R', 'AE1', 'K', 'T'];
    const result = applyStressPrediction('abstract', phonemes);
    // Second syllable stressed (ab- prefix), first AE reduces to AH0
    expect(result[0]).toBe('AH0');
    expect(result[5]).toBe('AE1');
  });

  it('handles -ing gerund with prefix detection', () => {
    // "returning" = R IY1 T ER1 N IH1 NX — 3 vowels
    const phonemes = ['R', 'IY1', 'T', 'ER1', 'N', 'IH1', 'NG'];
    const result = applyStressPrediction('returning', phonemes);
    // Should detect "re-" prefix after stripping -ing → stress 2nd syllable
    expect(result[3]).toMatch(/1$/);
  });
});
