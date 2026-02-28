/**
 * Fast JSON loading for Node.js.
 *
 * Uses readFileSync + JSON.parse to bypass esbuild's module parser,
 * which is the bottleneck for large data files in vitest. Falls back
 * to null in non-Node environments (Vite/browser), where callers
 * use dynamic import() instead.
 */

/**
 * Loads a JSON file from the same directory as this module.
 * Returns null if not in Node.js or if the file doesn't exist.
 */
export async function loadJson<T>(basename: string): Promise<null | T> {
  if (typeof process === 'undefined' || !process.versions?.node) {
    return null;
  }
  try {
    // Dynamic imports so Node.js builtins aren't bundled into the browser build.
    // Vite externalizes these to empty stubs, which is fine — the runtime guard
    // above ensures this code is unreachable in the browser.
    // (The Vite "externalized for browser compatibility" warning is suppressed
    // in the website's vite.config.ts onwarn.)
    const { readFileSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    const thisFile = fileURLToPath(import.meta.url);
    const dir = thisFile.slice(0, thisFile.lastIndexOf('/'));
    return JSON.parse(readFileSync(`${dir}/${basename}.json`, 'utf8')) as T;
  } catch {
    return null;
  }
}
