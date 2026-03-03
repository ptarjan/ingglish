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

import { loadReverseDictionary, loadFrequencies } from '@ingglish/dictionary';
import { buildReverseMap } from '@ingglish/ipa';
import type { TranslateOptions } from './dict-loader';
import { getDictReverseMap, loadLangDict, setDictReverseMap } from './dict-loader';
import './register-english';
import { reverseTranslateSync, translateSync } from './translate';

// =============================================================================
// Primary API (auto-loads dictionary)
// =============================================================================

/**
 * Translates Ingglish/IPA text back to the source language.
 * Auto-loads dictionaries on first call.
 * For homophones, uses the most common word.
 *
 * For English (default): uses the CMU reverse dictionary.
 * For other languages: builds/caches a reverse map from the dictionary.
 *
 * @param text - Text in Ingglish or IPA format
 * @param options - Translation options (format, lang)
 * @returns Source language text
 */
export async function reverseTranslate(
  text: string,
  options: TranslateOptions = {}
): Promise<string> {
  const { format = 'ingglish', lang } = options;

  if (lang && lang !== 'en') {
    const dict = await loadLangDict(lang);
    if (!getDictReverseMap(lang)) {
      setDictReverseMap(lang, buildReverseMap(dict));
    }
    return reverseTranslateSync(text, { format, lang });
  }

  await Promise.all([loadReverseDictionary(), loadFrequencies()]);
  return reverseTranslateSync(text, { format });
}

/**
 * Translates text to the specified format.
 * Auto-loads dictionaries on first call.
 *
 * For English (default): loads the CMU pronunciation dictionary.
 * For non-English languages: loads the dictionary via the registered loader.
 *
 * @param text - The text to translate
 * @param options - Translation options (format, lang)
 * @returns The translated text
 */
export async function translate(text: string, options: TranslateOptions = {}): Promise<string> {
  const { format = 'ingglish', lang } = options;
  const effectiveLang = lang !== undefined && lang !== '' ? lang : 'en';

  await loadLangDict(effectiveLang);

  return translateSync(text, { format, lang });
}

// =============================================================================
// Re-exports
// =============================================================================

export type { TranslateOptions } from './dict-loader';
export { loadLangDict, setDictLoader, setLangDict } from './dict-loader';

// Sync API (dictionary must be loaded first via translate() or reverseTranslate())
export { translateSync, translateSyncWithMapping } from './translate';
export { reverseTranslateSync, reverseTranslateSyncWithMapping } from './translate';
export type { TranslatedToken } from './translate';

export { LANGUAGES } from '@ingglish/ipa';
export type { Language } from '@ingglish/ipa';

export type { OutputFormat } from '@ingglish/phonemes';
