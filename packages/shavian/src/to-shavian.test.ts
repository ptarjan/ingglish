import { describe, expect, it } from 'vitest';
import { arpabetToShavian } from './to-shavian';

describe('arpabetToShavian', () => {
  it('should convert simple consonants', () => {
    // P → 𐑐, B → 𐑚
    expect(arpabetToShavian(['P'])).toBe('𐑐');
    expect(arpabetToShavian(['B'])).toBe('𐑚');
    expect(arpabetToShavian(['T'])).toBe('𐑑');
    expect(arpabetToShavian(['D'])).toBe('𐑛');
    expect(arpabetToShavian(['K'])).toBe('𐑒');
    expect(arpabetToShavian(['G'])).toBe('𐑜');
  });

  it('should convert all consonants', () => {
    expect(arpabetToShavian(['F'])).toBe('𐑓');
    expect(arpabetToShavian(['V'])).toBe('𐑝');
    expect(arpabetToShavian(['TH'])).toBe('𐑔');
    expect(arpabetToShavian(['DH'])).toBe('𐑞');
    expect(arpabetToShavian(['S'])).toBe('𐑕');
    expect(arpabetToShavian(['Z'])).toBe('𐑟');
    expect(arpabetToShavian(['SH'])).toBe('𐑖');
    expect(arpabetToShavian(['ZH'])).toBe('𐑠');
    expect(arpabetToShavian(['CH'])).toBe('𐑗');
    expect(arpabetToShavian(['JH'])).toBe('𐑡');
    expect(arpabetToShavian(['M'])).toBe('𐑥');
    expect(arpabetToShavian(['N'])).toBe('𐑯');
    expect(arpabetToShavian(['NG'])).toBe('𐑙');
    expect(arpabetToShavian(['L'])).toBe('𐑤');
    expect(arpabetToShavian(['R'])).toBe('𐑮');
    expect(arpabetToShavian(['W'])).toBe('𐑢');
    expect(arpabetToShavian(['Y'])).toBe('𐑘');
    expect(arpabetToShavian(['HH'])).toBe('𐑣');
  });

  it('should convert vowels', () => {
    expect(arpabetToShavian(['AA1'])).toBe('𐑭');
    expect(arpabetToShavian(['AE1'])).toBe('𐑨');
    expect(arpabetToShavian(['AO1'])).toBe('𐑷');
    expect(arpabetToShavian(['EH1'])).toBe('𐑧');
    expect(arpabetToShavian(['IH1'])).toBe('𐑦');
    expect(arpabetToShavian(['IY1'])).toBe('𐑰');
    expect(arpabetToShavian(['UH1'])).toBe('𐑫');
    expect(arpabetToShavian(['UW1'])).toBe('𐑵');
  });

  it('should convert diphthongs', () => {
    expect(arpabetToShavian(['AW1'])).toBe('𐑬');
    expect(arpabetToShavian(['AY1'])).toBe('𐑲');
    expect(arpabetToShavian(['EY1'])).toBe('𐑱');
    expect(arpabetToShavian(['OW1'])).toBe('𐑴');
    expect(arpabetToShavian(['OY1'])).toBe('𐑶');
  });

  it('should handle AH stress: AH0 → schwa, AH1 → strut', () => {
    expect(arpabetToShavian(['AH0'])).toBe('𐑩'); // schwa
    expect(arpabetToShavian(['AH1'])).toBe('𐑳'); // strut
    expect(arpabetToShavian(['AH2'])).toBe('𐑳'); // strut (secondary stress)
  });

  it('should use ER ligature', () => {
    expect(arpabetToShavian(['ER1'])).toBe('𐑻'); // nurse
    expect(arpabetToShavian(['ER0'])).toBe('𐑻'); // letter
  });

  it('should use R-colored ligatures', () => {
    // AA+R → 𐑸 (start)
    expect(arpabetToShavian(['AA1', 'R'])).toBe('𐑸');
    // AO+R → 𐑹 (north)
    expect(arpabetToShavian(['AO1', 'R'])).toBe('𐑹');
    // EH+R → 𐑺 (square)
    expect(arpabetToShavian(['EH1', 'R'])).toBe('𐑺');
    // AH0+R → 𐑼 (letter)
    expect(arpabetToShavian(['AH0', 'R'])).toBe('𐑼');
    // IH+R → 𐑽 (near)
    expect(arpabetToShavian(['IH1', 'R'])).toBe('𐑽');
  });

  it('should handle empty input', () => {
    expect(arpabetToShavian([])).toBe('');
  });
});
