/**
 * Utilities for preserving case patterns during translation.
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
  if (word.length === 1) {
    return word === word.toUpperCase() && word !== word.toLowerCase() ? 'capitalized' : 'lower';
  }

  if (word === word.toUpperCase()) {
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
 * Applies mixed case from original word to translated word.
 * Preserves uppercase positions character-by-character.
 */
function applyMixedCase(translated: string, original: string): string {
  const result: string[] = [];
  const lowerTranslated = translated.toLowerCase();

  for (let i = 0; i < lowerTranslated.length; i++) {
    const char = lowerTranslated[i];
    // Use original's case pattern if within bounds, otherwise lowercase
    if (i < original.length && original[i] === original[i].toUpperCase()) {
      result.push(char.toUpperCase());
    } else {
      result.push(char);
    }
  }

  return result.join('');
}
