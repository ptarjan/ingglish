import { reverseTranslateSync, translateSync } from 'ingglish';
import { describe, expect, it } from 'vitest';

describe('Shavian → English', () => {
  it('should reverse translate Shavian words', () => {
    const shavian = translateSync('cat', { format: 'shavian' });
    const english = reverseTranslateSync(shavian, { format: 'shavian' });
    expect(english).toBe('cat');
  });

  it('should pass through non-Shavian input unchanged', () => {
    expect(reverseTranslateSync('', { format: 'shavian' })).toBe('');
    expect(reverseTranslateSync('hello', { format: 'shavian' })).toBe('hello');
  });
});
