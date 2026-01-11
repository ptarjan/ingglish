/**
 * Neural G2P via phonemize library.
 *
 * Provides better accuracy than rule-based G2P for unusual words,
 * when the phonemize library is available.
 */

import { arpabetToFormat } from '../convert/to-ingglish';
import { ipaToArpabet } from '../convert/from-ipa';
import type { OutputFormat } from '../types';

// Lazy-loaded phonemize function
let phonemizeFn: ((text: string) => string) | null = null;
// Cache the load promise to prevent concurrent loads (race condition)
let loadPromise: Promise<typeof phonemizeFn> | null = null;

/**
 * Attempts to load the phonemize module.
 * Returns null if not available (fails silently).
 * Uses promise caching to prevent race conditions on concurrent calls.
 */
async function loadPhonemize(): Promise<typeof phonemizeFn> {
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    try {
      // Dynamic import to allow tree-shaking if not used
      const mod = await import('phonemize');
      phonemizeFn = mod.phonemize;
      return phonemizeFn;
    } catch {
      // phonemize not available - fall back to rules
      return null;
    }
  })();

  return loadPromise;
}

/**
 * Synchronously get the phonemize function if already loaded.
 */
function getPhonemize(): typeof phonemizeFn {
  return phonemizeFn;
}

/**
 * Translates an unknown word using the phonemize library (neural G2P).
 * This provides better accuracy than rule-based G2P for unusual words.
 *
 * @param word The unknown word
 * @param format The output format
 * @returns The translation, or null if phonemize is not available
 */
export function translateWithPhonemize(
  word: string,
  format: OutputFormat = 'ingglish'
): string | null {
  const fn = getPhonemize();
  if (fn === null) {
    return null;
  }

  try {
    const ipa = fn(word);
    const arpabet = ipaToArpabet(ipa);
    if (arpabet.length === 0) {
      return null;
    }
    return arpabetToFormat(arpabet, format);
  } catch {
    return null;
  }
}

/**
 * Preloads the phonemize module for better unknown word handling.
 * Call this at startup if you want phonemize to be available synchronously.
 *
 * @returns Promise that resolves when phonemize is loaded (or failed to load)
 */
export async function preloadPhonemize(): Promise<boolean> {
  const mod = await loadPhonemize();
  return mod !== null;
}
