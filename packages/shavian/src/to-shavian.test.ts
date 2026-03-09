import { reverseTranslateSync, translateSync } from 'ingglish';
import { describe, expect, it } from 'vitest';

describe('Shavian conversion', () => {
  it('should produce non-empty Shavian output', () => {
    const shavian = translateSync('cat', { format: 'shavian' });
    expect(shavian.length).toBeGreaterThan(0);
  });

  it('should handle empty input', () => {
    const result = translateSync('', { format: 'shavian' });
    expect(result).toBe('');
  });

  it('should round-trip words through Shavian', () => {
    for (const word of ['cat', 'bird', 'car', 'air', 'shore', 'think', 'the', 'world']) {
      const shavian = translateSync(word, { format: 'shavian' });
      const english = reverseTranslateSync(shavian, { format: 'shavian' });
      expect(english, `Failed round-trip for "${word}"`).toBe(word);
    }
  });
});
