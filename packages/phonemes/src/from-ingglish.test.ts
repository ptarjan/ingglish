import { reverseTranslate, translate } from 'ingglish';
import { describe, expect, it } from 'vitest';

describe('reverse Ingglish translation', () => {
  it('returns empty for empty input', async () => {
    expect(await reverseTranslate('')).toBe('');
  });

  it('handles single consonant input', async () => {
    const result = await reverseTranslate('b');
    expect(typeof result).toBe('string');
  });

  it('handles single vowel input', async () => {
    const result = await reverseTranslate('a');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('phoneme alternative expansion in reverse', () => {
  it('reverses simple words', async () => {
    const ingglish = await translate('but');
    const english = await reverseTranslate(ingglish);
    expect(english).toBe('but');
  });

  it('reverses words with ER phoneme', async () => {
    // 'bird' has ER phoneme, reverse should handle ER↔EH+R ambiguity
    const ingglish = await translate('bird');
    const english = await reverseTranslate(ingglish);
    expect(english).toBe('bird');
  });

  it('reverses words with SH phoneme', async () => {
    // 'ship' has SH phoneme, reverse should handle SH↔S+HH ambiguity
    const ingglish = await translate('ship');
    const english = await reverseTranslate(ingglish);
    expect(english).toBe('ship');
  });

  it('handles words with multiple ambiguous phonemes', async () => {
    // 'shiver' has both SH and ER phonemes
    const ingglish = await translate('shiver');
    const english = await reverseTranslate(ingglish);
    expect(english).toBe('shiver');
  });
});
