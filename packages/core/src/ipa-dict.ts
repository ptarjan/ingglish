/**
 * IPA dictionary loader and cache.
 *
 * Separated from index.ts to avoid circular dependencies with translate/forward.ts.
 */

import type { IpaDict } from '@ingglish/ipa';
import type { OutputFormat } from '@ingglish/phonemes';

// =============================================================================
// Types
// =============================================================================

export type DictLoader = (lang: string) => Promise<IpaDict>;

// =============================================================================
// IPA dictionary loader
// =============================================================================

export interface TranslateOptions {
  /** Output format. @default 'ingglish' */
  format?: OutputFormat;
  /** Language code (omit or 'en' for English). */
  lang?: string;
}

let dictLoader: DictLoader | undefined;
const dictCache = new Map<string, IpaDict>();
const dictReverseCache = new Map<string, Map<string, string[]>>();

/**
 * Get a cached reverse map for a language (ARPAbet key → source words).
 * Returns undefined if not yet built.
 */
export function getDictReverseMap(lang: string): Map<string, string[]> | undefined {
  return dictReverseCache.get(lang);
}

/**
 * Get a cached IPA dictionary (for sync use after a prior async load).
 * Returns undefined if the dictionary hasn't been loaded yet.
 */
export function getLangDict(lang: string): IpaDict | undefined {
  return dictCache.get(lang);
}

/**
 * Load an IPA dictionary, returning it from cache if available.
 * Requires a loader to have been registered via {@link setDictLoader}.
 */
export async function loadLangDict(lang: string): Promise<IpaDict> {
  const cached = dictCache.get(lang);
  if (cached) {
    return cached;
  }
  if (!dictLoader) {
    throw new Error(
      `No dictionary loader registered. Call setDictLoader() before translating foreign languages.`
    );
  }
  const dict = await dictLoader(lang);
  dictCache.set(lang, dict);
  return dict;
}

/**
 * Register a function that loads IPA dictionaries for foreign languages.
 * Called once at application startup (e.g. in the website's entry point).
 *
 * @example
 * ```typescript
 * setDictLoader(async (lang) => {
 *   const resp = await fetch(`/ipa-dicts/${lang}.json`);
 *   const entries = await resp.json();
 *   return { entries, lang };
 * });
 * ```
 */
export function setDictLoader(loader: DictLoader): void {
  dictLoader = loader;
}

/**
 * Store a reverse map for a language in the cache.
 */
export function setDictReverseMap(lang: string, map: Map<string, string[]>): void {
  dictReverseCache.set(lang, map);
}
