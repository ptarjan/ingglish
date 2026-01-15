/**
 * Shared test setup and data for @ingglish/core tests
 */
import { beforeAll } from 'vitest';
import { loadDictionary, loadReverseDictionary } from './dictionary';
import { loadFrequencies } from './dictionary/frequency';

/**
 * Call this in your test file to ensure the dictionary is loaded before tests run.
 * Also loads the reverse dictionary for reverse translation tests.
 * Usage: setupDictionary();
 */
export function setupDictionary(): void {
  beforeAll(async () => {
    await Promise.all([loadDictionary(), loadReverseDictionary(), loadFrequencies()]);
  });
}

/**
 * Call this in your test file to ensure word frequencies are loaded before tests run.
 * Usage: setupFrequencies();
 */
export function setupFrequencies(): void {
  beforeAll(async () => {
    await loadFrequencies();
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
 * Note: The CMU dictionary is regularly updated, so some tech words may be added.
 * These are verified not to be in the dictionary as of the current version.
 */
export const UNKNOWN_TECH_WORDS = ['kubernetes', 'airbnb', 'tiktok', 'chatgpt', 'cryptocurrency'];
