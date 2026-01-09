/**
 * Shared test setup and data for @ingglish/core tests
 */
import { beforeAll } from 'vitest';
import { loadDictionary } from './translator';
import { warmReverseDictionaryCache } from './reverse-translator';

/**
 * Call this in your test file to ensure the dictionary is loaded before tests run.
 * Also pre-builds the reverse dictionary cache to avoid ~400ms hit on first lookup.
 * Usage: setupDictionary();
 */
export function setupDictionary(): void {
  beforeAll(async () => {
    await loadDictionary();
    // Pre-build reverse dictionary cache to speed up first test
    warmReverseDictionaryCache();
  });
}

/**
 * Sample pangram text used for testing translations
 */
export const SAMPLE_TEXT = `The quick brown fox jumps over the lazy dog.
This sentence contains every letter of the English alphabet.

"Though" and "through" are spelled similarly but sound different.
English spelling is notoriously difficult to learn because it has
so many exceptions. With phonetic spelling, words
are written exactly as they sound - what you see is what you say!`;

/**
 * Common test words that appear in the CMU dictionary
 */
export const COMMON_TEST_WORDS = [
  'hello',
  'world',
  'the',
  'quick',
  'brown',
  'fox',
  'jumps',
  'over',
  'lazy',
  'dog',
  'alphabet',
  'through',
  'english',
];

/**
 * Tech/brand words not in the CMU dictionary (for testing unknown word handling)
 */
export const UNKNOWN_TECH_WORDS = [
  'kubernetes',
  'spotify',
  'airbnb',
  'instagram',
  'tiktok',
  'chatgpt',
  'cryptocurrency',
  'blockchain',
];
