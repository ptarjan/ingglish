import { reverseTranslateSync, translateSync } from 'ingglish';
import { describe, expect, it } from 'vitest';

describe('Deseret → English', () => {
  it('should reverse translate Deseret words', () => {
    const deseret = translateSync('bat', { format: 'deseret' });
    const english = reverseTranslateSync(deseret, { format: 'deseret' });
    expect(english).toBe('bat');
  });

  it('should pass through non-Deseret input unchanged', () => {
    expect(reverseTranslateSync('', { format: 'deseret' })).toBe('');
    expect(reverseTranslateSync('hello', { format: 'deseret' })).toBe('hello');
  });
});
