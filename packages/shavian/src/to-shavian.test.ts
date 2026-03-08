import { describe, expect, it } from 'vitest';
import { arpabetToShavian } from './to-shavian';

describe('arpabetToShavian', () => {
  it('should handle empty input', () => {
    expect(arpabetToShavian([])).toBe('');
  });

  it('should use AH0+R ligature for uncommon phoneme pair', () => {
    // AH0+R → 𐑼 (letter) — rare in CMU dict, so test directly
    expect(arpabetToShavian(['AH0', 'R'])).toBe('𐑼');
  });
});
