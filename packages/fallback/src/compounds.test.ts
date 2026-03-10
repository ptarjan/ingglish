import { describe, expect, it } from 'vitest';
import { dpDecompose, translateAsCompound } from './compounds';

describe('dpDecompose', () => {
  it('decomposes compound words into known parts', () => {
    // "dogcat" = "dog" + "cat" — both common words with high frequency
    const parts = dpDecompose('dogcat');
    expect(parts).toEqual(['dog', 'cat']);
  });

  it('returns null for words shorter than 6 characters', () => {
    expect(dpDecompose('hello')).toBeNull();
  });

  it('prefers fewer parts with higher frequency', () => {
    // "sunlight" = "sun" + "light" — both very common words
    const parts = dpDecompose('sunlight');
    expect(parts).toEqual(['sun', 'light']);
  });

  it('skips parts with low frequency (e.g. "foo" in "footprint")', () => {
    // "foo" is in the dictionary but has freq 56 < MIN_PART_FREQUENCY (500)
    // so dpDecompose skips it and finds "foot" + "print" instead
    const parts = dpDecompose('footprint');
    expect(parts).toEqual(['foot', 'print']);
  });
});

describe('translateAsCompound – case preservation', () => {
  it('preserves initial capital via compound decomposition', () => {
    // "Dogcat" has first letter uppercase — capitalize branch triggered
    const result = translateAsCompound('Dogcat');
    expect(result).toBeTruthy();
    expect(result![0]).toBe(result![0]!.toUpperCase());
  });

  it('does not capitalize when original is all lowercase', () => {
    const result = translateAsCompound('dogcat');
    expect(result).toBeTruthy();
    expect(result).toBe(result!.toLowerCase());
  });

  it('returns null for short words', () => {
    expect(translateAsCompound('hello')).toBeNull();
  });

  it('returns null when no valid decomposition exists', () => {
    // "xyzabc" is 6+ chars but has no valid dictionary decomposition
    expect(translateAsCompound('xyzabc')).toBeNull();
  });
});
