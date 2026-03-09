import { reverseTranslate, translate } from 'ingglish';
import { describe, expect, it } from 'vitest';
import './index'; // registers shavian format

describe('Shavian → English', () => {
  it('should reverse translate Shavian words', async () => {
    const shavian = await translate('cat', { format: 'shavian' });
    const english = await reverseTranslate(shavian, { format: 'shavian' });
    expect(english).toBe('cat');
  });

  it('should pass through non-Shavian input unchanged', async () => {
    expect(await reverseTranslate('', { format: 'shavian' })).toBe('');
    expect(await reverseTranslate('hello', { format: 'shavian' })).toBe('hello');
  });
});
