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
    expect(translateAsCompound('Dogcat')).toBe('Dawgkat');
  });

  it('does not capitalize when original is all lowercase', () => {
    expect(translateAsCompound('dogcat')).toBe('dawgkat');
  });

  it.each(['hello', 'xyzabc'])('returns null for %s', (word) => {
    expect(translateAsCompound(word)).toBeNull();
  });
});
