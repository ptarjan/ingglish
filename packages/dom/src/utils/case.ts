/**
 * Case transformation utilities for DOM translation.
 */

/**
 * Applies case transformation from original word to translated word.
 * Preserves ALL CAPS and Title Case.
 */
export function applyCase(original: string, translated: string): string {
  // ALL CAPS
  if (original.length > 1 && original === original.toUpperCase() && /[A-Z]/.test(original)) {
    return translated.toUpperCase();
  }
  // Title Case
  if (/^[A-Z]/.test(original) && original.slice(1) === original.slice(1).toLowerCase()) {
    return translated.charAt(0).toUpperCase() + translated.slice(1);
  }
  return translated;
}
