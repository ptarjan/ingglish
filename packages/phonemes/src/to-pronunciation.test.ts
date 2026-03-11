import { translateSync } from 'ingglish';
import { describe, expect, it } from 'vitest';
import { arpabetToFormat } from './index';

describe('pronunciation format', () => {
  it.each([
    ['hello', 'ha-LOH'],
    ['beautiful', 'BYOO-ta-fal'],
    ['cat', 'KAT'],
    ['chaos', 'KAY-os'],
  ])('translates %s → %s', (word, expected) => {
    expect(translateSync(word, { format: 'pronunciation' })).toBe(expected);
  });

  it.each(['string', 'star'])('translates "%s" to non-empty pronunciation', (word) => {
    expect(translateSync(word, { format: 'pronunciation' })).toBeTruthy();
  });

  it('handles words with no vowels', () => {
    expect(arpabetToFormat(['SH'], 'pronunciation')).toBe('sh');
  });
});
