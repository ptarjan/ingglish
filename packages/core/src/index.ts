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

/**
 * Translates English text to the specified format.
 * Auto-loads the dictionary on first call.
 *
 * @param text - The English text to translate
 * @param format - The output format ('ingglish' or 'ipa')
 * @returns The translated text
 */
export async function translate(text: string, format: OutputFormat = 'ingglish'): Promise<string> {
  await Promise.all([loadDictionary(), loadFrequencies()]);
  return translateSync(text, format);
}

/**
 * Translates Ingglish/IPA text back to English.
 * Auto-loads the dictionary on first call.
 * For homophones, uses the most common word.
 *
 * @param text - Text in Ingglish or IPA format
 * @param format - The input format ('ingglish' or 'ipa')
 * @returns English text
 */
export async function reverseTranslate(
  text: string,
  format: OutputFormat = 'ingglish'
): Promise<string> {
  await Promise.all([loadReverseDictionary(), loadFrequencies()]);
  return reverseTranslateSync(text, format);
}

// =============================================================================
// Sync API (dictionary must be loaded first via translate)
// =============================================================================

export { translateSync, translateSyncWithMapping } from './translate';
export type { TranslatedToken } from './translate';
export { reverseTranslateSync, reverseTranslateSyncWithMapping } from './translate';
