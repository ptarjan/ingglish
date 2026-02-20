/**
 * Shared utility for expanding preserved pattern placeholders into tokens.
 * Used by both forward and reverse translation with-mapping functions.
 */

import type { TranslatedToken } from './forward';

/**
 * If a token contains one or more preserved pattern placeholders (URL, email, domain),
 * expands them into non-word tokens and returns the result.
 * Returns null if the token contains no placeholder.
 */
export function expandPlaceholder(
  token: string,
  preserved: Map<string, string>
): TranslatedToken[] | null {
  // Find all placeholders present in this token
  const matches: { placeholder: string; original: string; index: number }[] = [];
  for (const [placeholder, original] of preserved) {
    const idx = token.indexOf(placeholder);
    if (idx !== -1) {
      matches.push({ placeholder, original, index: idx });
    }
  }

  if (matches.length === 0) {
    return null;
  }

  // Sort by position so we process left-to-right
  matches.sort((a, b) => a.index - b.index);

  const result: TranslatedToken[] = [];
  let pos = 0;

  for (const { placeholder, original, index } of matches) {
    // Text before this placeholder
    if (index > pos) {
      const before = token.slice(pos, index);
      result.push({ original: before, translated: before, isWord: false, matched: true });
    }
    // The preserved pattern itself
    result.push({ original, translated: original, isWord: false, matched: true });
    pos = index + placeholder.length;
  }

  // Text after the last placeholder
  if (pos < token.length) {
    const after = token.slice(pos);
    result.push({ original: after, translated: after, isWord: false, matched: true });
  }

  return result;
}
