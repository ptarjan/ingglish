/**
 * ingglish - Phonetic English Translation Library
 *
 * @example
 * ```typescript
 * import { translate } from 'ingglish';
 *
 * await translate('Hello, world!'); // 'Haloh, werld!'
 * await translate('Bonjour', { lang: 'fr' }); // French → Ingglish
 * ```
 */

import { loadDictionary, loadReverseDictionary, loadFrequencies } from '@ingglish/dictionary';
import { translateForeign } from '@ingglish/ipa';
import type { TranslateOptions } from './foreign-dict';
import { isForeignLang, loadForeignDict } from './foreign-dict';
import { reverseTranslateSync, translateSync } from './translate';

// =============================================================================
// Primary API (auto-loads dictionary)
// =============================================================================

/**
 * Translates Ingglish/IPA text back to English.
 * Auto-loads the dictionary on first call.
 * For homophones, uses the most common word.
 *
 * @param text - Text in Ingglish or IPA format
 * @param options - Translation options (format)
 * @returns English text
 */
export async function reverseTranslate(
  text: string,
  options: TranslateOptions = {}
): Promise<string> {
  const { format = 'ingglish' } = options;
  await Promise.all([loadReverseDictionary(), loadFrequencies()]);
  return reverseTranslateSync(text, { format });
}

/**
 * Translates text to the specified format.
 * Auto-loads dictionaries on first call.
 *
 * For English (default): loads the CMU pronunciation dictionary.
 * For foreign languages: loads the IPA dictionary via the registered loader.
 *
 * @param text - The text to translate
 * @param options - Translation options (format, lang)
 * @returns The translated text
 */
export async function translate(text: string, options: TranslateOptions = {}): Promise<string> {
  const { format = 'ingglish', lang } = options;

  if (isForeignLang(lang)) {
    const dict = await loadForeignDict(lang);
    return translateForeign(text, dict, format);
  }

  await Promise.all([loadDictionary(), loadFrequencies()]);
  return translateSync(text, { format });
}

// =============================================================================
// Re-exports
// =============================================================================

export type { ForeignDictLoader, TranslateOptions } from './foreign-dict';
export { getForeignDict, loadForeignDict, setForeignDictLoader } from './foreign-dict';

// Sync API (dictionary must be loaded first via translate)
export { translateSync, translateSyncWithMapping, translateWord } from './translate';
export type { TranslatedToken } from './translate';
export {
  reverseTranslateSync,
  reverseTranslateSyncWithMapping,
  reverseTranslateWord,
} from './translate';

export type { IpaDict } from '@ingglish/ipa';
export type { Language } from '@ingglish/ipa';
export { LANGUAGES } from '@ingglish/ipa';

export type { OutputFormat } from '@ingglish/phonemes';
