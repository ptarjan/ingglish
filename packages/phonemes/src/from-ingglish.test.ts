import { reverseTranslateSync, translateSync } from 'ingglish';
import { describe, expect, it } from 'vitest';

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
  it('reverses simple words', () => {
    const ingglish = translateSync('but');
    const english = reverseTranslateSync(ingglish);
    expect(english).toBe('but');
  });

  it('reverses words with ER phoneme', () => {
    // 'bird' has ER phoneme, reverse should handle ER↔EH+R ambiguity
    const ingglish = translateSync('bird');
    const english = reverseTranslateSync(ingglish);
    expect(english).toBe('bird');
  });

  it('reverses words with SH phoneme', () => {
    // 'ship' has SH phoneme, reverse should handle SH↔S+HH ambiguity
    const ingglish = translateSync('ship');
    const english = reverseTranslateSync(ingglish);
    expect(english).toBe('ship');
  });

  it('handles words with multiple ambiguous phonemes', () => {
    // 'shiver' has both SH and ER phonemes
    const ingglish = translateSync('shiver');
    const english = reverseTranslateSync(ingglish);
    expect(english).toBe('shiver');
  });
});
