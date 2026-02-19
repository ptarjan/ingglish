/**
 * Shared utility for expanding preserved pattern placeholders into tokens.
 * Used by both forward and reverse translation with-mapping functions.
 */

import type { TranslatedToken } from './forward';

/**
 * If a token contains a preserved pattern placeholder (URL, email, domain),
 * expands it into one or more non-word tokens and returns them.
 * Returns null if the token contains no placeholder.
 */
export function expandPlaceholder(
  token: string,
  preserved: Map<string, string>
): TranslatedToken[] | null {
  for (const [placeholder, original] of preserved) {
    if (token.includes(placeholder)) {
      const result: TranslatedToken[] = [];
      const parts = token.split(placeholder);
      if (parts[0]!.length > 0) {
        result.push({ original: parts[0]!, translated: parts[0]!, isWord: false, matched: true });
      }
      result.push({ original, translated: original, isWord: false, matched: true });
      if (parts[1] && parts[1].length > 0) {
        result.push({ original: parts[1], translated: parts[1], isWord: false, matched: true });
      }
      return result;
    }
  }
  return null;
}
