/**
 * Utilities for preserving case patterns during translation.
 */

/**
 * Case pattern detected in a word.
 * - 'lower': all lowercase (hello)
 * - 'upper': all uppercase (HELLO)
 * - 'capitalized': first letter uppercase (Hello)
 * - 'mixed': mixed case like camelCase (GitHub, iPhone)
 */
export type CasePattern = 'lower' | 'upper' | 'capitalized' | 'mixed';

/**
 * Detects the case pattern of a word.
 */
export function detectCasePattern(word: string): CasePattern {
  if (word.length === 0) {
    return 'lower';
  }

  // Single characters: check if uppercase
  // Exception: "I" is always capitalized in English by convention, but it's just
  // a regular pronoun, not special - treat it as lowercase for translation
  if (word.length === 1) {
    if (word === 'I') {
      return 'lower';
    }
    return word === word.toUpperCase() && word !== word.toLowerCase() ? 'capitalized' : 'lower';
  }

  // All uppercase words
  if (word === word.toUpperCase()) {
    // Short all-caps words (2 letters like "UI", "AI") should be title-cased, not ALL CAPS
    // These are typically initialisms (spelled out letter-by-letter), not acronyms
    if (word.length <= 2) {
      return 'capitalized';
    }
    return 'upper';
  }

  if (/^[A-Z]/.test(word) && word.slice(1) === word.slice(1).toLowerCase()) {
    return 'capitalized';
  }

  // Check for mixed case (like "GitHub", "iPhone", "McDonald")
  if (word !== word.toLowerCase()) {
    return 'mixed';
  }

  return 'lower';
}

/**
 * Applies a case pattern to a word, optionally using original word for mixed case.
 */
export function applyCasePattern(word: string, pattern: CasePattern, original?: string): string {
  switch (pattern) {
    case 'upper':
      return word.toUpperCase();
    case 'capitalized':
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    case 'mixed':
      if (original !== undefined && original.length > 0) {
        return applyMixedCase(word, original);
      }
      return word.toLowerCase();
    case 'lower':
    default:
      return word.toLowerCase();
  }
}

/**
 * Splits a word at camelCase boundaries.
 * e.g., "iCloud" -> ["i", "Cloud"], "MacBook" -> ["Mac", "Book"]
 */
export function splitCamelCase(word: string): string[] | null {
  const parts: string[] = [];
  let start = 0;

  for (let i = 1; i < word.length; i++) {
    const prev = word[i - 1];
    const curr = word[i];
    // Boundary: previous char is lowercase, current is uppercase
    if (
      prev === prev.toLowerCase() &&
      prev !== prev.toUpperCase() &&
      curr === curr.toUpperCase() &&
      curr !== curr.toLowerCase()
    ) {
      parts.push(word.slice(start, i));
      start = i;
    }
  }

  if (parts.length > 0) {
    parts.push(word.slice(start));
    return parts;
  }

  return null;
}

/**
 * Applies mixed case from original word to translated word.
 * Uses position-based mapping for each character.
 */
function applyMixedCase(translated: string, original: string): string {
  const lowerTranslated = translated.toLowerCase();
  let result = '';

  for (let i = 0; i < lowerTranslated.length; i++) {
    const char = lowerTranslated[i];
    // Use original's case pattern if within bounds, otherwise lowercase
    result +=
      i < original.length && original[i] === original[i].toUpperCase() ? char.toUpperCase() : char;
  }

  return result;
}
