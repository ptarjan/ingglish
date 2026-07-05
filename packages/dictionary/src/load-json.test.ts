import { describe, expect, it } from 'vitest';
import { loadJson } from './load-json';

describe('loadJson', () => {
  it('returns null when the JSON file does not exist', async () => {
    // Exercises the defensive catch: readFileSync throws for a missing file.
    expect(await loadJson('this-file-does-not-exist')).toBeNull();
  });
});
