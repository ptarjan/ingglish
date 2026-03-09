import { reverseTranslate, translate } from 'ingglish';
import { describe, expect, it } from 'vitest';
import './index'; // registers shavian format

describe('Shavian conversion', () => {
  it('should produce non-empty Shavian output', async () => {
    const shavian = await translate('cat', { format: 'shavian' });
    expect(shavian.length).toBeGreaterThan(0);
  });

  it('should handle empty input', async () => {
    const result = await translate('', { format: 'shavian' });
    expect(result).toBe('');
  });

  it('should round-trip words through Shavian', async () => {
    for (const word of ['cat', 'bird', 'car', 'air', 'shore', 'think', 'the', 'world']) {
      const shavian = await translate(word, { format: 'shavian' });
      const english = await reverseTranslate(shavian, { format: 'shavian' });
      expect(english, `Failed round-trip for "${word}"`).toBe(word);
    }
  });
});
