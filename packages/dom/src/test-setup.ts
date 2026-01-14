/**
 * Shared test setup for @ingglish/dom tests
 *
 * Note: Dictionary is pre-loaded in vitest.setup.ts, so setupDictionary()
 * is now a no-op kept for backwards compatibility.
 */

/**
 * @deprecated Dictionary is now pre-loaded globally. This function is a no-op.
 */
export function setupDictionary(): void {
  // Dictionary is pre-loaded in vitest.setup.ts - nothing to do here
}
