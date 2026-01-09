/**
 * @ingglish/core - Phonetic English Translation Library
 *
 * @example
 * ```typescript
 * import { translate } from '@ingglish/core';
 *
 * await translate('Hello, world!'); // 'hulo, werld!'
 * ```
 */

import { loadDictionary, translateText } from './translator';

// =============================================================================
// Types
// =============================================================================

export type { OutputFormat } from './types';

// =============================================================================
// Primary API (auto-loads dictionary)
// =============================================================================

/** Translate English text to the specified format (Ingglish or IPA). */
export async function translate(
  text: string,
  format: import('./types').OutputFormat = 'ingglish'
): Promise<string> {
  await loadDictionary();
  return translateText(text, format);
}

// =============================================================================
// Sync API (dictionary must be loaded first via translate)
// =============================================================================

export { translateText, translateTextWithMapping } from './translator';
export { reverseTranslateText } from './reverse-translator';

// =============================================================================
// Spelling Guide
// =============================================================================

export { arpabetPhonemeToIngglish } from './arpabet-to-ingglish';
export { arpabetPhonemeToIPA } from './arpabet-to-ipa';
