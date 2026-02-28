/**
 * A single token from a translated text, preserving the mapping between
 * original and translated forms. Used by both forward and reverse translation.
 */
export interface TranslatedToken {
  /** Whether this token is a word (true) or punctuation/whitespace (false). */
  isWord: boolean;
  /** Whether the word was found in the dictionary (false = heuristic fallback). */
  matched: boolean;
  /** The original text of this token (English for forward, Ingglish for reverse). */
  original: string;
  /** The translated text (Ingglish for forward, English for reverse). */
  translated: string;
}
