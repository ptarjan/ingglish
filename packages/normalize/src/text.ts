/**
 * Text normalization utilities: apostrophe normalization, diacritics stripping,
 * and URL/email pattern preservation.
 */

/**
 * Regex to match URLs (http, https, ftp, file protocols).
 * Matches protocol through end of URL (stops at whitespace or common punctuation at end).
 */
export const URL_REGEX = /(?:https?|ftp|file):\/\/[^\s<>"')\]]+/gi;

/**
 * Regex to match email addresses.
 * Simple pattern: word characters, dots, hyphens, plus before @, domain after.
 */
export const EMAIL_REGEX = /[\w.%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

/**
 * Regex to match bare domain names (without protocol).
 * Matches common TLDs to avoid false positives like "Dr. Smith".
 * Includes optional path/query after the domain.
 */
export const BARE_DOMAIN_REGEX =
  /\b[a-z0-9][-a-z0-9]*(?:\.[a-z0-9][-a-z0-9]*)*\.(?:com|org|net|edu|gov|io|co|uk|de|fr|jp|au|ca|ru|ch|it|nl|se|no|es|mil|info|biz|tv|me|app|dev|ai|xyz)\b(?:\/[^\s<>"')\]]*)?/gi;

/**
 * Extracts URLs and emails from text, replacing them with placeholders.
 * Returns the modified text and a map to restore originals.
 * Placeholders use non-alphanumeric characters to avoid being split by word regex.
 */
export function extractPreservedPatterns(text: string): {
  text: string;
  preserved: Map<string, string>;
} {
  const preserved = new Map<string, string>();
  let counter = 0;

  // Replace URLs first (they may contain email-like patterns)
  // Use \x00 (null) and \x01 (SOH) to create non-word placeholders
  let result = text.replace(URL_REGEX, (match) => {
    const placeholder = `\x00\x01${counter++}\x01\x00`;
    preserved.set(placeholder, match);
    return placeholder;
  });

  // Replace emails
  result = result.replace(EMAIL_REGEX, (match) => {
    const placeholder = `\x00\x01${counter++}\x01\x00`;
    preserved.set(placeholder, match);
    return placeholder;
  });

  // Replace bare domains (after URLs and emails to avoid double-matching)
  result = result.replace(BARE_DOMAIN_REGEX, (match) => {
    const placeholder = `\x00\x01${counter++}\x01\x00`;
    preserved.set(placeholder, match);
    return placeholder;
  });

  return { text: result, preserved };
}

/**
 * Restores preserved patterns (URLs, emails) from placeholders.
 */
export function restorePreservedPatterns(text: string, preserved: Map<string, string>): string {
  if (preserved.size === 0) {
    return text;
  }
  let result = text;
  for (const [placeholder, original] of preserved) {
    result = result.replace(placeholder, original);
  }
  return result;
}

/**
 * Normalizes various apostrophe characters to the standard straight apostrophe.
 * Handles: ' (U+2019 right single quotation mark), ' (U+2018 left), ʼ (U+02BC modifier letter)
 */
export function normalizeApostrophes(text: string): string {
  return text.replace(/[\u2018\u2019\u02BC]/g, "'");
}

/**
 * Strips diacritics/accents from text, preserving base letters.
 * Converts résumé→resume, naïve→naive, cliché→cliche, café→cafe.
 * Uses Unicode NFD decomposition to separate base letters from combining marks.
 */
export function stripDiacritics(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
