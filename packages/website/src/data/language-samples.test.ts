import { describe, expect, it } from 'vitest';
import { ALL_SAMPLES } from './language-samples';

describe('language samples', () => {
  it('has no duplicate source URLs within a language', () => {
    for (const [lang, samples] of Object.entries(ALL_SAMPLES)) {
      const seen = new Set<string>();
      for (const s of samples) {
        if (s.source === undefined) {
          continue;
        }
        expect(seen.has(s.source), `${lang}: duplicate source URL "${s.source}"`).toBe(false);
        seen.add(s.source);
      }
    }
  });
});
