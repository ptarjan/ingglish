import { reverseTranslate, translate } from 'ingglish';
import { describe, expect, it } from 'vitest';
import './index'; // registers deseret format

describe('Deseret round-trip', () => {
  it('should round-trip words through Deseret', async () => {
    for (const word of ['cat', 'bird', 'car', 'air', 'shore', 'think', 'the', 'world']) {
      const deseret = await translate(word, { format: 'deseret' });
      const english = await reverseTranslate(deseret, { format: 'deseret' });
      expect(english, `Failed round-trip for "${word}"`).toBe(word);
    }
  });
});
