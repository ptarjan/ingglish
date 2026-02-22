/**
 * Browser environment checks.
 */

/**
 * Checks if we're in a browser environment.
 */
export function isBrowser(): boolean {
  return typeof document !== 'undefined' && globalThis.window !== undefined;
}

/**
 * Throws an error if not in a browser environment.
 */
export function requireBrowser(): void {
  if (!isBrowser()) {
    throw new Error('DOM translation requires a browser environment');
  }
}
