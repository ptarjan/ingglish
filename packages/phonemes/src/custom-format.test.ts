import { describe, it, expect } from 'vitest';
import { createCustomConverter } from './custom-format';

describe('createCustomConverter', () => {
  it('should produce identical output to default with empty overrides', () => {
    const convert = createCustomConverter({ phonemeMap: {}, rColoredPrefixes: {} });
    // "hello" = HH AH0 L OW1
    expect(convert(['HH', 'AH0', 'L', 'OW1'])).toBe('haloh');
    // "cat" = K AE1 T
    expect(convert(['K', 'AE1', 'T'])).toBe('kat');
  });

  it('should apply phonemeMap overrides', () => {
    const convert = createCustomConverter({
      phonemeMap: { AA: 'ah' },
      rColoredPrefixes: {},
    });
    // "hot" = HH AA1 T
    expect(convert(['HH', 'AA1', 'T'])).toBe('haht');
  });

  it('should handle AH0 override', () => {
    const convert = createCustomConverter({
      phonemeMap: { AH0: 'uh' },
      rColoredPrefixes: {},
    });
    // "hello" = HH AH0 L OW1 — AH0 now maps to 'uh'
    expect(convert(['HH', 'AH0', 'L', 'OW1'])).toBe('huhloh');
  });

  it('should handle stress-specific overrides', () => {
    const convert = createCustomConverter({
      phonemeMap: { EY0: 'eh', EY: 'ay' },
      rColoredPrefixes: {},
    });
    // Stressed EY1 uses base EY -> 'ay'
    expect(convert(['EY1'])).toBe('ay');
    // Unstressed EY0 uses stress-specific override -> 'eh'
    expect(convert(['EY0'])).toBe('eh');
  });

  it('should apply rColoredPrefixes overrides', () => {
    const convert = createCustomConverter({
      phonemeMap: {},
      rColoredPrefixes: { AA: 'ah' },
    });
    // "star" = S T AA1 R — AA+R prefix now 'ah' instead of 'a', so 'ah'+'r' = 'ahr'
    expect(convert(['S', 'T', 'AA1', 'R'])).toBe('stahr');
  });

  it('should handle r-colored vowels with default prefixes', () => {
    const convert = createCustomConverter({ phonemeMap: {}, rColoredPrefixes: {} });
    // "star" = S T AA1 R → 'star' (AA+R prefix 'a' + R='r')
    expect(convert(['S', 'T', 'AA1', 'R'])).toBe('star');
    // "store" = S T AO1 R → 'stor' (AO+R prefix 'o' + R='r')
    expect(convert(['S', 'T', 'AO1', 'R'])).toBe('stor');
  });

  it('should handle consonants normally', () => {
    const convert = createCustomConverter({ phonemeMap: {}, rColoredPrefixes: {} });
    // "bed" = B EH1 D
    expect(convert(['B', 'EH1', 'D'])).toBe('bed');
  });

  it('should fall back to lowercase for unknown phonemes', () => {
    const convert = createCustomConverter({ phonemeMap: {}, rColoredPrefixes: {} });
    expect(convert(['XX'])).toBe('xx');
  });

  it('should handle multiple overrides together', () => {
    const convert = createCustomConverter({
      phonemeMap: { AH0: 'uh', IY: 'i' },
      rColoredPrefixes: { AA: 'ah' },
    });
    // "about" = AH0 B AW1 T → 'uhbout'
    expect(convert(['AH0', 'B', 'AW1', 'T'])).toBe('uhbout');
    // "see" = S IY1 → 'si'
    expect(convert(['S', 'IY1'])).toBe('si');
  });
});
