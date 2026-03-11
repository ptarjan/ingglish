import { describe, expect, it } from 'vitest';
import { translateSync } from '../index';

describe('camelCase translation', () => {
  it.each([
    ['iCloud', 'aiKloud', 'capital at component boundary'],
    ['iPhone', 'aiFohn', 'capital at component boundary'],
    ['MacBook', 'MakBuk', 'preserving both capitals'],
    ['fooBar', 'fooBar', 'unknown camelCase words'],
  ])('translates %s → %s (%s)', (word, expected) => {
    expect(translateSync(word)).toBe(expected);
  });
});
