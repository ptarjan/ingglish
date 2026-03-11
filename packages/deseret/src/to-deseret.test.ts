import { reverseTranslateSync, translateSync } from 'ingglish';
import { describe, expect, it } from 'vitest';

describe('Deseret round-trip', () => {
  it.each(['cat', 'bird', 'car', 'air', 'shore', 'think', 'the', 'hello', 'world', 'use', 'cute'])(
    'round-trips "%s" through Deseret',
    (word) => {
      const deseret = translateSync(word, { format: 'deseret' });
      const english = reverseTranslateSync(deseret, { format: 'deseret' });
      expect(english, `Failed round-trip for "${word}"`).toBe(word);
    }
  );
});
