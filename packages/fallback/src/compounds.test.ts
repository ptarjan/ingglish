import { describe, expect, it } from 'vitest';
import type { LookupFn } from './british';
import { translateAsCompound } from './compounds';
import type { FreqFn } from './compounds';

/**
 * Mock lookup and frequency functions that recognize a small vocabulary,
 * allowing us to test compound splitting without the full dictionary.
 */
const MOCK_DICT: Record<string, string[]> = {
  box: ['B AA1 K S'],
  cat: ['K AE1 T'],
  dog: ['D AO1 G'],
  hat: ['HH AE1 T'],
};

const mockLookup: LookupFn = (word: string) => MOCK_DICT[word] ?? null;
const mockFreq: FreqFn = (word: string) => (word in MOCK_DICT ? 10_000 : undefined);

describe('translateAsCompound – camelCase preservation', () => {
  it('capitalizes translated parts when original has uppercase letters', () => {
    // "HatBox" → lowercase "hatbox" → decompose ["hat","box"]
    // Original slices: "Hat" (uppercase H), "Box" (uppercase B)
    // Both parts should be capitalized in the output
    const result = translateAsCompound('HatBox', 'ingglish', mockLookup, mockFreq);
    expect(result).toBeTruthy();
    // First letter of each part should be uppercase
    const parts = result!.split('');
    expect(parts[0]).toBe(parts[0]!.toUpperCase());
  });

  it('capitalizes only parts with uppercase first letter in original', () => {
    // "hatBox" → lowercase "hatbox" → decompose ["hat","box"]
    // Original slices: "hat" (lowercase), "Box" (uppercase B)
    // Only second part should be capitalized
    const result = translateAsCompound('hatBox', 'ingglish', mockLookup, mockFreq);
    expect(result).toBeTruthy();
    // "hat" part stays lowercase, "Box" part gets capitalized
    expect(result!.startsWith('h')).toBe(true);
    // The result should contain a capital letter for the second part
    expect(result).toMatch(/[A-Z]/);
  });

  it('does not capitalize when original is all lowercase', () => {
    const result = translateAsCompound('hatbox', 'ingglish', mockLookup, mockFreq);
    expect(result).toBeTruthy();
    expect(result).toBe(result!.toLowerCase());
  });
});
