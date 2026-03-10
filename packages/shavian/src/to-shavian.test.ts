import { reverseTranslateSync, translateSync } from 'ingglish';
import { describe, expect, it } from 'vitest';
import { arpabetToShavian } from './to-shavian';

describe('Shavian conversion', () => {
  it('should produce non-empty Shavian output', () => {
    const shavian = translateSync('cat', { format: 'shavian' });
    expect(shavian.length).toBeGreaterThan(0);
  });

  it('should handle empty input', () => {
    const result = translateSync('', { format: 'shavian' });
    expect(result).toBe('');
  });

  it('should round-trip words through Shavian', () => {
    for (const word of ['cat', 'bird', 'car', 'air', 'shore', 'think', 'the', 'world']) {
      const shavian = translateSync(word, { format: 'shavian' });
      const english = reverseTranslateSync(shavian, { format: 'shavian' });
      expect(english, `Failed round-trip for "${word}"`).toBe(word);
    }
  });

  it('should produce R-colored ligatures', () => {
    expect(translateSync('star', { format: 'shavian' })).toContain('𐑸'); // AA+R
    expect(translateSync('care', { format: 'shavian' })).toContain('𐑺'); // EH+R
    expect(translateSync('store', { format: 'shavian' })).toContain('𐑹'); // AO+R
    expect(translateSync('beer', { format: 'shavian' })).toContain('𐑽'); // IH+R
  });

  it('should convert schwa', () => {
    expect(translateSync('the', { format: 'shavian' })).toContain('𐑩');
  });

  it('should convert stressed AH to strut', () => {
    expect(translateSync('cup', { format: 'shavian' })).toContain('𐑳');
  });

  it('should use fallback empty string for unknown phonemes', () => {
    // Unknown phoneme falls through to ARPABET_TO_SHAVIAN_MAP[base] ?? ''
    expect(arpabetToShavian(['XX'])).toBe('');
  });
});
