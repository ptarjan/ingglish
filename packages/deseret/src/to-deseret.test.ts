import { reverseTranslateSync, translateSync } from 'ingglish';
import { describe, expect, it } from 'vitest';

describe('Deseret round-trip', () => {
  it('should round-trip words through Deseret', () => {
    for (const word of [
      'cat',
      'bird',
      'car',
      'air',
      'shore',
      'think',
      'the',
      'world',
      'use',
      'cute',
    ]) {
      const deseret = translateSync(word, { format: 'deseret' });
      const english = reverseTranslateSync(deseret, { format: 'deseret' });
      expect(english, `Failed round-trip for "${word}"`).toBe(word);
    }
  });
});
