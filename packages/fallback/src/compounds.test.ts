import { describe, expect, it } from 'vitest';
import { dpDecompose, translateAsCompound } from './compounds';

describe('dpDecompose', () => {
  it.each([
    ['dogcat', ['dog', 'cat'], 'common words'],
    ['sunlight', ['sun', 'light'], 'fewer parts with higher frequency'],
    ['footprint', ['foot', 'print'], 'skips low-frequency parts'],
  ] as const)('decomposes %s → %j (%s)', (word, expected) => {
    expect(dpDecompose(word)).toEqual([...expected]);
  });

  it('returns null for words shorter than 6 characters', () => {
    expect(dpDecompose('hello')).toBeNull();
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

  it.each(['hello', 'xyzabc'])('returns null for %s', (word) => {
    expect(translateAsCompound(word)).toBeNull();
  });
});
