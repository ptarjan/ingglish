/**
 * Shared test setup for @ingglish/dom tests
 */
import { beforeAll } from 'vitest';
import { translate } from '@ingglish/core';

/**
 * Call this in your test file to ensure the dictionary is loaded before tests run.
 * Usage: setupDictionary();
 */
export function setupDictionary(): void {
  beforeAll(async () => {
    // translate() auto-loads the dictionary
    await translate('');
  }, 30000); // 30 second timeout for dictionary loading in CI
}
