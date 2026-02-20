/**
 * Neural G2P via phonemize library.
 *
 * Provides better accuracy than rule-based G2P for unusual words,
 * when the phonemize library is available.
 */

import { arpabetToFormat } from '@ingglish/phonemes';
import type { OutputFormat } from '@ingglish/phonemes';
import { ipaToArpabet } from '@ingglish/ipa';

// Type for the phonemize function
type PhonemizeFn = ((text: string) => string) | null;

// Lazy-loaded phonemize function
let phonemizeFn: PhonemizeFn = null;
// Cache the load promise to prevent concurrent loads (race condition)
let loadPromise: Promise<PhonemizeFn> | null = null;

/**
 * Attempts to load the phonemize module.
 * Returns null if not available (fails silently).
 * Uses promise caching to prevent race conditions on concurrent calls.
 */
async function loadPhonemize(): Promise<PhonemizeFn> {
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
function getPhonemize(): PhonemizeFn {
  return phonemizeFn;
}

/**
 * Converts a word to ARPAbet phonemes using the phonemize library (neural G2P).
 * Returns the phoneme array, or null if phonemize is not available.
 */
export function phonemizeToArpabet(word: string): string[] | null {
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
    return arpabet;
  } catch {
    return null;
  }
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
  const arpabet = phonemizeToArpabet(word);
  if (arpabet === null) {
    return null;
  }
  return arpabetToFormat(arpabet, format);
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
