import { translateSync } from 'ingglish';
import { describe, expect, it } from 'vitest';
import { arpabetToFormat } from './index';

describe('pronunciation format', () => {
  it('translates hello via translateSync', () => {
    const result = translateSync('hello', { format: 'pronunciation' });
    expect(result).toBe('ha-LOH');
  });

  it('translates multi-syllable words', () => {
    expect(translateSync('beautiful', { format: 'pronunciation' })).toBe('BYOO-ta-fal');
  });

  it('translates single-syllable words', () => {
    expect(translateSync('cat', { format: 'pronunciation' })).toBe('KAT');
  });

  it('handles words with consonant clusters', () => {
    const result = translateSync('string', { format: 'pronunciation' });
    expect(result).toBeTruthy();
  });

  it('handles R-colored vowels', () => {
    expect(translateSync('star', { format: 'pronunciation' })).toBeTruthy();
  });

  it('converts ARPAbet directly', () => {
    expect(arpabetToFormat(['HH', 'AH0', 'L', 'OW1'], 'pronunciation')).toBe('ha-LOH');
  });

  it('handles adjacent vowels (no consonants between)', () => {
    // "chaos" or similar - test syllabification with adjacent vowels
    expect(arpabetToFormat(['K', 'EY1', 'AA0', 'S'], 'pronunciation')).toBe('KAY-os');
  });

  it('handles words with no vowels', () => {
    // Consonant-only should return single unstressed syllable
    expect(arpabetToFormat(['SH'], 'pronunciation')).toBe('sh');
  });
});
