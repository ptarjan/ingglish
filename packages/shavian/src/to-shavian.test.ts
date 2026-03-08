import { describe, expect, it } from 'vitest';
import { verifyScriptRoundTrip } from '@ingglish/phonemes';
import { shavianToArpabet } from './from-shavian';
import { arpabetToShavian } from './to-shavian';

describe('arpabetToShavian', () => {
  it('should handle empty input', () => {
    expect(arpabetToShavian([])).toBe('');
  });

  it('should use AH0+R ligature for uncommon phoneme pair', () => {
    // AH0+R → 𐑼 (letter) — rare in CMU dict, so test directly
    expect(arpabetToShavian(['AH0', 'R'])).toBe('𐑼');
  });

  it('should round-trip all phonemes', () => {
    expect(() =>
      { verifyScriptRoundTrip(arpabetToShavian, shavianToArpabet, [
        ['AA1', 'R'],
        ['AO1', 'R'],
        ['EH1', 'R'],
        ['AH0', 'R'],
        ['IH1', 'R'],
      ]); }
    ).not.toThrow();
  });
});
