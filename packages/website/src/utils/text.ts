/**
 * Returns true if the text is ALL CAPS (2+ letters, all uppercase).
 * Used to show a warning since Ingglish is case-sensitive.
 */
export function isAllCaps(text: string): boolean {
  const letters = text.replace(/[^a-zA-Z]/g, '');
  return letters.length >= 2 && letters === letters.toUpperCase();
}
