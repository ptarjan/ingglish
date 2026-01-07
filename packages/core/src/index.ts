/**
 * @ingglish/core - Phonetic English Translation Library
 *
 * @example
 * ```typescript
 * import { translate, reverseTranslate } from '@ingglish/core';
 *
 * await translate('Hello, world!');       // 'hulo, werld!'
 * await reverseTranslate('hulo, werld!'); // 'hello, world!'
 * ```
 */

import { loadDictionary, translateText } from './translator';
import { reverseTranslateText } from './reverse-translator';
import {
  translateDOMAsync,
  observeAndTranslate as observeAndTranslateSync,
  restoreDOM as restoreDOMSync,
} from './dom-translator';

// =============================================================================
// Types
// =============================================================================

export type { DOMTranslatorOptions } from './types';

// =============================================================================
// Primary API
// =============================================================================

/** Translate English to Ingglish. */
export async function translate(text: string): Promise<string> {
  await loadDictionary();
  return translateText(text);
}

/** Translate Ingglish back to English. */
export async function reverseTranslate(text: string): Promise<string> {
  await loadDictionary();
  return reverseTranslateText(text);
}

/** Translate all text in a DOM element. */
export const translateDOM = translateDOMAsync;

/** Observe DOM for changes and translate new content. Returns stop function. */
export async function observeAndTranslate(
  root: Element | Document,
  options?: import('./types').DOMTranslatorOptions
): Promise<() => void> {
  await loadDictionary();
  return observeAndTranslateSync(root, options);
}

/** Restore original text in a DOM element (undo translation). */
export function restoreDOM(root: Element | Document): void {
  restoreDOMSync(root);
}

// =============================================================================
// Sync API (dictionary must be loaded first via translate/translateDOM)
// =============================================================================

export { translateText } from './translator';
export { reverseTranslateText } from './reverse-translator';

// =============================================================================
// Phoneme Maps (for spelling guide UI)
// =============================================================================

export { VOWEL_MAP, CONSONANT_MAP } from './phoneme-map';

// =============================================================================
// Advanced: Phonemize support for better unknown word handling
// =============================================================================

export { preloadPhonemize } from './unknown-words';
