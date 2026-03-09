import { reverseTranslate, translate } from 'ingglish';
import { describe, expect, it } from 'vitest';
import './index'; // registers deseret format

describe('Deseret → English', () => {
  it('should reverse translate Deseret words', async () => {
    const deseret = await translate('bat', { format: 'deseret' });
    const english = await reverseTranslate(deseret, { format: 'deseret' });
    expect(english).toBe('bat');
  });

  it('should pass through non-Deseret input unchanged', async () => {
    expect(await reverseTranslate('', { format: 'deseret' })).toBe('');
    expect(await reverseTranslate('hello', { format: 'deseret' })).toBe('hello');
  });
});
