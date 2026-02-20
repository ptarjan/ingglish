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

  // Capitalized: first uppercase, rest all lowercase
  // Use charCode loop to avoid creating two temporary strings from slice(1)
  if (isFirstUpper) {
    let restIsLower = true;
    for (let i = 1; i < word.length; i++) {
      const c = word.charCodeAt(i);
      if (c >= 65 && c <= 90) {
        // A-Z
        restIsLower = false;
        break;
      }
    }
    if (restIsLower) {
      return 'capitalized';
    }
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
  // Fast path: need at least 2 chars for camelCase
  if (word.length < 2) {
    return null;
  }

  // Fast path: check for any internal uppercase (position 1+)
  // Uses charCode for speed - A-Z are 65-90
  let hasInternalUpper = false;
  for (let i = 1; i < word.length; i++) {
    const c = word.charCodeAt(i);
    if (c >= 65 && c <= 90) {
      hasInternalUpper = true;
      break;
    }
  }
  if (!hasInternalUpper) {
    return null;
  }

  // Full camelCase split
  const parts: string[] = [];
  let start = 0;

  for (let i = 1; i < word.length; i++) {
    const prevCode = word.charCodeAt(i - 1);
    const currCode = word.charCodeAt(i);
    // Boundary: previous char is lowercase (a-z), current is uppercase (A-Z)
    if (prevCode >= 97 && prevCode <= 122 && currCode >= 65 && currCode <= 90) {
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
    const char = lowerTranslated[i]!;
    // Use original's case pattern if within bounds, otherwise lowercase
    if (i < original.length) {
      const origChar = original[i]!;
      result += origChar === origChar.toUpperCase() ? char.toUpperCase() : char;
    } else {
      result += char;
    }
  }

  return result;
}
