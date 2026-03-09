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
});

describe('arpabetToShavian', () => {
  it('should produce R-colored ligatures for non-AH vowels followed by R', () => {
    // AA+R → 𐑸 (start), tests the branch where base !== 'AH' so stressKey = base
    expect(arpabetToShavian(['AA1', 'R'])).toBe('𐑸');
    // EH+R → 𐑺 (square)
    expect(arpabetToShavian(['EH1', 'R'])).toBe('𐑺');
    // AO+R → 𐑹 (north)
    expect(arpabetToShavian(['AO1', 'R'])).toBe('𐑹');
    // IH+R → 𐑽 (near)
    expect(arpabetToShavian(['IH0', 'R'])).toBe('𐑽');
  });

  it('should convert AH0 to schwa', () => {
    // AH0 → 𐑩 (schwa), tests the AH stress=0 branch
    expect(arpabetToShavian(['AH0'])).toBe('𐑩');
  });

  it('should convert stressed AH to strut', () => {
    // AH1 → 𐑳 (strut), falls through to ARPABET_TO_SHAVIAN_MAP
    expect(arpabetToShavian(['AH1'])).toBe('𐑳');
  });

  it('should use fallback empty string for unknown phonemes', () => {
    // Unknown phoneme falls through to ARPABET_TO_SHAVIAN_MAP[base] ?? ''
    expect(arpabetToShavian(['XX'])).toBe('');
  });
});
