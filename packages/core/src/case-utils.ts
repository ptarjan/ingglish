/**
 * Utilities for preserving case patterns during translation.
 */

export type CasePattern = 'lower' | 'upper' | 'capitalized';

/**
 * Detects the case pattern of a word.
 */
export function detectCasePattern(word: string): CasePattern {
  if (word.length <= 1) {
    return word === word.toUpperCase() ? 'upper' : 'lower';
  }

  if (word === word.toUpperCase()) {
    return 'upper';
  }

  if (/^[A-Z]/.test(word) && word.slice(1) === word.slice(1).toLowerCase()) {
    return 'capitalized';
  }

  return 'lower';
}

/**
 * Applies a case pattern to a word.
 */
export function applyCasePattern(word: string, pattern: CasePattern): string {
  switch (pattern) {
    case 'upper':
      return word.toUpperCase();
    case 'capitalized':
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    case 'lower':
    default:
      return word.toLowerCase();
  }
}
