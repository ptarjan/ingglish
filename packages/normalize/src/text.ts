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
  /\b(?:[a-z0-9][-a-z0-9]*\.)+(?:com|org|net|edu|gov|io|co|uk|de|fr|jp|au|ca|ru|ch|it|nl|se|no|es|mil|info|biz|tv|me|app|dev|ai|xyz)\b(?:\/[^\s<>"')\]]*)?/gi;

/**
 * Extracts URLs and emails from text, replacing them with placeholders.
 * Returns the modified text and a map to restore originals.
 * Placeholders use non-alphanumeric characters to avoid being split by word regex.
 */
export function extractPreservedPatterns(text: string): {
  preserved: Map<string, string>;
  text: string;
} {
  const preserved = new Map<string, string>();
  let counter = 0;
  let result = text;

  // Short-circuit each regex when its trigger pattern isn't present.
  // Most text has no URLs, emails, or bare domains.

  // Replace URLs first (they may contain email-like patterns)
  // Use \x00 (null) and \x01 (SOH) to create non-word placeholders
  if (text.includes('://')) {
    result = result.replaceAll(URL_REGEX, (match) => {
      const placeholder = `\u0000\u0001${counter++}\u0001\u0000`;
      preserved.set(placeholder, match);
      return placeholder;
    });
  }

  // Replace emails
  if (result.includes('@')) {
    result = result.replaceAll(EMAIL_REGEX, (match) => {
      const placeholder = `\u0000\u0001${counter++}\u0001\u0000`;
      preserved.set(placeholder, match);
      return placeholder;
    });
  }

  // Replace bare domains (after URLs and emails to avoid double-matching)
  if (result.includes('.')) {
    result = result.replaceAll(BARE_DOMAIN_REGEX, (match) => {
      const placeholder = `\u0000\u0001${counter++}\u0001\u0000`;
      preserved.set(placeholder, match);
      return placeholder;
    });
  }

  return { preserved, text: result };
}

// Pre-compiled regex patterns (avoid per-call RegExp object creation)
const FANCY_APOSTROPHE = /[\u2018\u2019\u02BC]/g;
const COMBINING_MARKS = /[\u0300-\u036F]/g;

/**
 * Normalizes various apostrophe characters to the standard straight apostrophe.
 * Handles: ' (U+2019 right single quotation mark), ' (U+2018 left), ʼ (U+02BC modifier letter)
 */
export function normalizeApostrophes(text: string): string {
  return text.replaceAll(FANCY_APOSTROPHE, "'");
}

/**
 * Strips diacritics/accents from text, preserving base letters.
 * Converts résumé→resume, naïve→naive, cliché→cliche, café→cafe.
 * Uses Unicode NFD decomposition to separate base letters from combining marks.
 */
export function stripDiacritics(text: string): string {
  return text.normalize('NFD').replaceAll(COMBINING_MARKS, '');
}
