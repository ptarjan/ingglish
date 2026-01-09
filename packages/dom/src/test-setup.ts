/**
 * Shared test setup for @ingglish/dom tests
 */
import { beforeAll } from 'vitest';
import { loadDictionary } from '@ingglish/core';

/**
 * Call this in your test file to ensure the dictionary is loaded before tests run.
 * Usage: setupDictionary();
 */
export function setupDictionary(): void {
  beforeAll(async () => {
    await loadDictionary();
  });
}
