/**
 * Foreign dictionary loader and cache.
 *
 * Separated from index.ts to avoid circular dependencies with translate/forward.ts.
 */

import type { IpaDict } from '@ingglish/ipa';
import type { OutputFormat } from '@ingglish/phonemes';

// =============================================================================
// Types
// =============================================================================

export type ForeignDictLoader = (lang: string) => Promise<IpaDict>;

// =============================================================================
// Foreign dictionary loader
// =============================================================================

export interface TranslateOptions {
  /** Output format. @default 'ingglish' */
  format?: OutputFormat;
  /** Language code (omit or 'en' for English). */
  lang?: string;
}

let foreignDictLoader: ForeignDictLoader | undefined;
const foreignDictCache = new Map<string, IpaDict>();

/**
 * Get a cached foreign dictionary (for sync use after a prior async load).
 * Returns undefined if the dictionary hasn't been loaded yet.
 */
export function getForeignDict(lang: string): IpaDict | undefined {
  return foreignDictCache.get(lang);
}

/** Helper: is this a foreign language request? */
export function isForeignLang(lang: string | undefined): lang is string {
  return lang !== undefined && lang !== '' && lang !== 'en';
}

/**
 * Load a foreign dictionary, returning it from cache if available.
 * Requires a loader to have been registered via {@link setForeignDictLoader}.
 */
export async function loadForeignDict(lang: string): Promise<IpaDict> {
  const cached = foreignDictCache.get(lang);
  if (cached) {
    return cached;
  }
  if (!foreignDictLoader) {
    throw new Error(
      `No foreign dictionary loader registered. Call setForeignDictLoader() before translating foreign languages.`
    );
  }
  const dict = await foreignDictLoader(lang);
  foreignDictCache.set(lang, dict);
  return dict;
}

/**
 * Register a function that loads IPA dictionaries for foreign languages.
 * Called once at application startup (e.g. in the website's entry point).
 *
 * @example
 * ```typescript
 * setForeignDictLoader(async (lang) => {
 *   const resp = await fetch(`/ipa-dicts/${lang}.json`);
 *   const entries = await resp.json();
 *   return { entries, lang };
 * });
 * ```
 */
export function setForeignDictLoader(loader: ForeignDictLoader): void {
  foreignDictLoader = loader;
}
