import { reverseTranslateSync, translateSync } from 'ingglish';
import { describe, expect, it } from 'vitest';
import { expandArpabetAlternatives, ingglishToArpabet } from './from-ingglish';

describe('reverse Ingglish translation', () => {
  it('returns empty for empty input', () => {
    expect(reverseTranslateSync('')).toBe('');
  });

  it('handles single consonant input', () => {
    const result = reverseTranslateSync('b');
    expect(typeof result).toBe('string');
  });

  it('handles single vowel input', () => {
    const result = reverseTranslateSync('a');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('phoneme alternative expansion in reverse', () => {
  it.each(['but', 'bird', 'ship', 'shiver'])('round-trips "%s"', (word) => {
    const ingglish = translateSync(word);
    const english = reverseTranslateSync(ingglish);
    expect(english).toBe(word);
  });
});

describe('expandArpabetAlternatives', () => {
  it('generates all-replaced variant when multiple same-length ambiguous phonemes', () => {
    // Two AE phonemes should produce the all-replaced AH variant (line 73)
    const arpabet = ['AE', 'K', 'AE', 'T'];
    const results = expandArpabetAlternatives(arpabet);
    // Should include original, two single-position AH substitutions, and the all-replaced variant
    expect(results).toContainEqual(['AH', 'K', 'AH', 'T']);
  });
});

describe('ingglishToArpabet', () => {
  it('skips unknown characters like digits and symbols', () => {
    // Digits and symbols should be skipped (line 143)
    const result = ingglishToArpabet('b2b');
    // Should parse 'b' and 'b', skipping '2'
    expect(result).toEqual(['B', 'B']);
  });

  it('returns null for input with only unknown characters', () => {
    expect(ingglishToArpabet('123!@#')).toBeNull();
  });
});
