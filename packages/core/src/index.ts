/**
 * @ingglish/core - Phonetic English Translation Library
 *
 * IMPORTANT: Keep this file absolutely minimal. Every export here ends up in
 * the main bundle. Use internal.ts for exports needed by other packages.
 *
 * @example
 * ```typescript
 * import { translate } from '@ingglish/core';
 *
 * await translate('Hello, world!'); // 'Huloh, werld!'
 * ```
 */

import { loadDictionary, loadReverseDictionary } from './dictionary';
import { loadFrequencies } from './dictionary/frequency';
import { translateSync, reverseTranslateSync } from './translate';
import { type OutputFormat } from './types';

// =============================================================================
// Types
// =============================================================================

export type { OutputFormat } from './types';

// =============================================================================
// Primary API (auto-loads dictionary)
// =============================================================================

/** Translate English text to the specified format (Ingglish or IPA). */
export async function translate(text: string, format: OutputFormat = 'ingglish'): Promise<string> {
  // Load dictionary and word frequencies in parallel
  await Promise.all([loadDictionary(), loadFrequencies()]);
  return translateSync(text, format);
}

/** Reverse translate Ingglish/IPA text back to English. */
export async function reverseTranslate(
  text: string,
  format: OutputFormat = 'ingglish'
): Promise<string> {
  // Load reverse dictionary and frequencies (forward dictionary not needed)
  await Promise.all([loadReverseDictionary(), loadFrequencies()]);
  return reverseTranslateSync(text, format);
}

// =============================================================================
// Sync API (dictionary must be loaded first via translate)
// =============================================================================

export { translateSync, translateSyncWithMapping } from './translate';
export type { TranslatedToken } from './translate';
export { reverseTranslateSync } from './translate';
