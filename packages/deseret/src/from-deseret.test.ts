import { reverseTranslateSync, translateSync } from 'ingglish';
import { describe, expect, it } from 'vitest';
import { deseretToArpabet } from './from-deseret';

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

describe('deseretToArpabet', () => {
  it('skips non-Deseret characters in mixed input', () => {
    // 𐐺 (U+1043A) = Deseret lowercase BEE = B phoneme
    // Mix with ASCII 'x' which should be skipped
    const result = deseretToArpabet('x\u{1043A}');
    expect(result).not.toBeNull();
    expect(result).toContain('B');
  });

  it('returns null for input with no Deseret characters', () => {
    expect(deseretToArpabet('hello')).toBeNull();
  });
});
