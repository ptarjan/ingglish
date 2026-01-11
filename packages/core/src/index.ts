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

import { loadDictionary } from './dictionary';
import { translateSync } from './translate';

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
  return translateSync(text, format);
}

// =============================================================================
// Sync API (dictionary must be loaded first via translate)
// =============================================================================

export { translateSync, translateSyncWithMapping } from './translate';
export type { TranslatedToken } from './translate';
export { reverseTranslateSync } from './translate';

// =============================================================================
// Spelling Guide
// =============================================================================

export { arpabetPhonemeToIngglish } from './convert';
export { arpabetPhonemeToIPA } from './convert';

// =============================================================================
// Text Utilities (shared with @ingglish/dom)
// =============================================================================

export {
  normalizeApostrophes,
  isIPAChar,
  isPhoneticChar,
  tokenizeIPA,
  tokenizeText,
  tokenizePhonetic,
} from './utils/text';
export type { TextToken, IndexedToken } from './utils/text';
export { detectCasePattern, applyCasePattern } from './utils/case';
export type { CasePattern } from './utils/case';
