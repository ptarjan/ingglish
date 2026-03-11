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

  it.each(['cat', 'bird', 'car', 'air', 'shore', 'think', 'the', 'hello', 'world'])(
    'round-trips "%s" through Shavian',
    (word) => {
      const shavian = translateSync(word, { format: 'shavian' });
      const english = reverseTranslateSync(shavian, { format: 'shavian' });
      expect(english, `Failed round-trip for "${word}"`).toBe(word);
    }
  );

  it.each([
    ['star', '𐑸', 'AA+R'],
    ['care', '𐑺', 'EH+R'],
    ['store', '𐑹', 'AO+R'],
    ['beer', '𐑽', 'IH+R'],
  ])('produces R-colored ligature for "%s" (%s)', (word, char) => {
    expect(translateSync(word, { format: 'shavian' })).toContain(char);
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
