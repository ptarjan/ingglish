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
import { translateDOMAsync, restoreDOM as restoreDOMSync } from './dom-translator';
import { observeAndTranslate as observeAndTranslateSync } from './dom-observer';

// =============================================================================
// Types
// =============================================================================

export type { DOMTranslatorOptions, OutputFormat } from './types';

// =============================================================================
// Primary API
// =============================================================================

/** Translate English to the specified format (Ingglish or IPA). */
export async function translate(
  text: string,
  format: import('./types').OutputFormat = 'ingglish'
): Promise<string> {
  await loadDictionary();
  return translateText(text, format);
}

/** Translate text back to English from the specified format. */
export async function reverseTranslate(
  text: string,
  format: import('./types').OutputFormat = 'ingglish'
): Promise<string> {
  await loadDictionary();
  return reverseTranslateText(text, format);
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

export { translateText, translateWord, loadDictionary, isDictionaryLoaded } from './translator';
export { reverseTranslateText } from './reverse-translator';

// =============================================================================
// Spelling Guide UI
// =============================================================================

export { arpabetPhonemeToIngglish } from './arpabet-to-ingglish';
export { arpabetPhonemeToIPA } from './arpabet-to-ipa';
