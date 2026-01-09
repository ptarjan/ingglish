/**
 * Text processing utilities.
 */

/**
 * Normalizes apostrophes to standard ASCII apostrophe.
 * Handles: ' (U+2019), ' (U+2018), ʼ (U+02BC)
 */
export function normalizeApostrophes(text: string): string {
  return text.replace(/[\u2018\u2019\u02BC]/g, "'");
}
