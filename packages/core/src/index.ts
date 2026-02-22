/**
 * ingglish - Phonetic English Translation Library
 *
 * @example
 * ```typescript
 * import { translate } from 'ingglish';
 *
 * await translate('Hello, world!'); // 'Haloh, werld!'
 * ```
 */

import { loadDictionary, loadReverseDictionary, loadFrequencies } from '@ingglish/dictionary';
import type { OutputFormat } from '@ingglish/phonemes';
import { translateSync, reverseTranslateSync } from './translate';

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

export { translateWord, translateSync, translateSyncWithMapping } from './translate';
export type { TranslatedToken } from './translate';
export {
  reverseTranslateWord,
  reverseTranslateSync,
  reverseTranslateSyncWithMapping,
} from './translate';
