import { describe, expect, it } from 'vitest';
import { translateSync } from '../index';

describe('camelCase translation', () => {
  it('should translate iCloud with capital at component boundary', () => {
    // "iCloud" should become "aiKloud" not "aIkloud"
    // The K should be capitalized because "Cloud" starts with capital C
    // (AY vowel maps to 'ai')
    const result = translateSync('iCloud');
    expect(result).toBe('aiKloud');
  });

  it('should translate iPhone with capital at component boundary', () => {
    // (AY vowel maps to 'ai')
    const result = translateSync('iPhone');
    expect(result).toBe('aiFohn');
  });

  it('should translate MacBook preserving both capitals', () => {
    const result = translateSync('MacBook');
    expect(result).toBe('MakBuk');
  });

  it('should handle unknown camelCase words', () => {
    // Unknown words should also preserve camelCase boundaries
    const result = translateSync('fooBar');
    expect(result).toBe('fooBar');
  });
});
