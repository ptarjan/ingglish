/**
 * Shared ARPAbet utilities used by both arpabet-to-ingglish and arpabet-to-ipa.
 */

/**
 * Strips stress markers (0, 1, 2) from a phoneme.
 * Example: "AH0" -> "AH", "EY1" -> "EY"
 */
export function stripStress(phoneme: string): string {
  return phoneme.replace(/[012]$/, '');
}

/**
 * Check if an ARPAbet phoneme is a vowel (has stress marker or is a vowel sound).
 */
export function isVowel(phoneme: string): boolean {
  const base = stripStress(phoneme);
  // All ARPAbet vowels are 2-letter codes that start with A, E, I, O, U
  // and can have stress markers (0, 1, 2)
  return /^(AA|AE|AH|AO|AW|AY|EH|ER|EY|IH|IY|OW|OY|UH|UW)$/.test(base);
}
