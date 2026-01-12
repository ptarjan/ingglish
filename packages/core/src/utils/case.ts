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
 * Optimized for the common case (lowercase) by checking it first.
 */
export function detectCasePattern(word: string): CasePattern {
  if (word.length === 0) {
    return 'lower';
  }

  // Fast path: check first character to quickly identify lowercase words
  // Most English text is lowercase, so this avoids expensive string operations
  const firstChar = word.charCodeAt(0);
  const isFirstUpper = firstChar >= 65 && firstChar <= 90; // A-Z

  // All lowercase - most common case
  if (!isFirstUpper && word === word.toLowerCase()) {
    return 'lower';
  }

  // Single characters
  if (word.length === 1) {
    // "I" is treated as lowercase for translation purposes
    if (word === 'I') {
      return 'lower';
    }
    return isFirstUpper ? 'capitalized' : 'lower';
  }

  // Check if all uppercase
  if (word === word.toUpperCase()) {
    // Short all-caps words (2 letters like "UI", "AI") should be title-cased
    // These are typically initialisms (spelled out letter-by-letter)
    if (word.length <= 2) {
      return 'capitalized';
    }
    return 'upper';
  }

  // Capitalized: first uppercase, rest lowercase
  if (isFirstUpper && word.slice(1) === word.slice(1).toLowerCase()) {
    return 'capitalized';
  }

  // Mixed case (like "GitHub", "iPhone", "McDonald")
  return 'mixed';
}

/**
 * Applies a case pattern to a word, optionally using original word for mixed case.
 * Optimized: lowercase case returns word directly if already lowercase.
 */
export function applyCasePattern(word: string, pattern: CasePattern, original?: string): string {
  // Fast path for lowercase (most common case)
  // Check if word is already lowercase to avoid creating new string
  if (pattern === 'lower') {
    // Quick check: if first char is lowercase and word equals lowercase, return as-is
    const firstChar = word.charCodeAt(0);
    if (firstChar >= 97 && firstChar <= 122 && word === word.toLowerCase()) {
      return word;
    }
    return word.toLowerCase();
  }

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
