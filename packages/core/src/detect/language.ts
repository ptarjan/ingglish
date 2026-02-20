/**
 * Language detection utilities.
 *
 * Heuristic detection of whether text is English, Ingglish, or IPA.
 */

/**
 * Patterns that suggest text is in Ingglish format.
 */
const INGGLISH_PATTERNS = [
  /\buu\b/i, // "uu" is rare in English
  /\bdh/i, // "dh" at word start
  /\bng[aeiou]/i, // "ng" + vowel at start
  /[aeiou]h\b/i, // vowel + "h" at end
];

/**
 * Patterns that suggest text is in standard English.
 */
const ENGLISH_PATTERNS = [
  /tion\b/i, // "-tion" ending
  /ight\b/i, // "-ight" ending
  /ough/i, // "ough" pattern
  /\bthe\b/i, // "the" (would be "dha" in Ingglish)
  /\bwh/i, // "wh-" words
];

/**
 * IPA-specific characters for detection (Set for O(1) lookup).
 */
const IPA_CHARS_SET = new Set('əɝɚʌæɑɔɛɪʊðθʃʒŋɹɡˈˌ');

// Fraction of characters that must be IPA-specific to classify text as IPA
const IPA_CHAR_THRESHOLD = 0.1;

/**
 * Heuristically detects if text is Ingglish vs English.
 *
 * @param text - The text to analyze
 * @returns true if text appears to be Ingglish, false if likely English
 */
export function isLikelyIngglish(text: string): boolean {
  let ingglishScore = 0;
  let englishScore = 0;
  for (const p of INGGLISH_PATTERNS) {
    if (p.test(text)) {
      ingglishScore++;
    }
  }
  for (const p of ENGLISH_PATTERNS) {
    if (p.test(text)) {
      englishScore++;
    }
  }
  return ingglishScore > englishScore;
}

/**
 * Checks if text appears to be in IPA notation.
 * Looks for IPA-specific characters and notation markers.
 *
 * @param text - The text to analyze
 * @returns true if text appears to be IPA
 */
export function isLikelyIPA(text: string): boolean {
  // IPA notation markers
  if (/^[[/].*[\]/]$/.test(text.trim())) {
    return true;
  }

  // Count IPA-specific characters using pre-built Set
  let ipaCount = 0;
  for (const char of text) {
    if (IPA_CHARS_SET.has(char)) {
      ipaCount++;
    }
  }

  return ipaCount > text.length * IPA_CHAR_THRESHOLD;
}

/**
 * Detects the format of input text.
 *
 * @param text - The text to analyze
 * @returns 'ipa', 'ingglish', or 'english'
 */
export function detectFormat(text: string): 'ipa' | 'ingglish' | 'english' {
  if (isLikelyIPA(text)) {
    return 'ipa';
  }
  if (isLikelyIngglish(text)) {
    return 'ingglish';
  }
  return 'english';
}
