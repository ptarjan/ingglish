/**
 * Compound word detection and translation.
 *
 * Handles words like "github" by splitting into "git" + "hub".
 * Preserves camelCase: "iCloud" -> "ie" + "Klowd" = "ieKlowd"
 */

import {
  lookupPronunciation,
  getWordFrequency,
  getCustomPronunciation,
} from '@ingglish/dictionary';
import {
  arpabetToFormat,
  getFormatPreservesCase,
  getFormatJoinSeparator,
} from '@ingglish/phonemes';
import type { OutputFormat } from '@ingglish/phonemes';

/**
 * Checks if a character is uppercase.
 */
function isUpperCase(char: string): boolean {
  return char === char.toUpperCase() && char !== char.toLowerCase();
}

/**
 * Capitalizes the first letter of a string.
 */
function capitalize(str: string): string {
  if (str.length === 0) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Minimum part length to avoid false splits like "a"+"theist" */
const MIN_PART_LENGTH = 3;

/**
 * Minimum SUBTLEX frequency for a word to be a valid compound part.
 * Parts not in the SUBTLEX corpus (freq undefined) are also rejected.
 * This prevents false splits using obscure dictionary words
 * (e.g., "contest" → "con"+"test" when neither is the intended meaning).
 * Threshold chosen by backtest optimization: 500 is the peak for stressless accuracy.
 */
const MIN_PART_FREQUENCY = 500;

/** Maximum length of a single compound part (avoids scanning the full word at each position) */
const MAX_PART_LENGTH = 15;

/**
 * Look up a word's pronunciation in custom dictionary or CMU.
 */
function lookupWord(word: string): string[] | null {
  return getCustomPronunciation(word) ?? lookupPronunciation(word) ?? null;
}

/**
 * Uses dynamic programming to find the best decomposition of a word into
 * known dictionary parts. Prefers fewer parts with higher word frequency.
 *
 * Returns an array of parts, or null if no complete decomposition exists.
 */
export function dpDecompose(word: string): string[] | null {
  const n = word.length;
  // dp[i] = best decomposition for word[0..i-1], or undefined if none
  const dp: ({ parts: string[]; score: number } | undefined)[] = new Array<undefined>(n + 1).fill(
    
  );
  dp[0] = { parts: [], score: 0 };

  for (let i = MIN_PART_LENGTH; i <= n; i++) {
    for (let j = Math.max(0, i - MAX_PART_LENGTH); j <= i - MIN_PART_LENGTH; j++) {
      // Skip whole-word match (j=0, i=n) — we want splits, not the word itself
      if (j === 0 && i === n) {
        continue;
      }
      const prev = dp[j];
      if (prev === undefined) {
        continue;
      }
      const chunk = word.substring(j, i);
      const phonemes = lookupWord(chunk);
      if (!phonemes) {
        continue;
      }

      const freq = getWordFrequency(chunk);
      // Skip parts that are obscure (not in SUBTLEX or below frequency threshold)
      if (freq === undefined || freq < MIN_PART_FREQUENCY) {
        continue;
      }
      const newScore = prev.score + freq;
      const newParts = prev.parts.length + 1;
      const current = dp[i];

      // Prefer: fewer parts first, then higher frequency
      if (
        current === undefined ||
        newParts < current.parts.length ||
        (newParts === current.parts.length && newScore > current.score)
      ) {
        dp[i] = { parts: [...prev.parts, chunk], score: newScore };
      }
    }
  }

  const result = dp[n];
  // Must have at least 2 parts (otherwise it's not a compound)
  if (result === undefined || result.parts.length < 2) {
    return null;
  }
  return result.parts;
}

/**
 * Attempts to translate an unknown word by splitting it into compound parts.
 * Uses DP to find N-part decompositions (e.g., "nevertheless" → "never"+"the"+"less").
 * Preserves camelCase by capitalizing each component appropriately.
 *
 * @param word The unknown word
 * @param format The output format
 * @returns The translated word, or null if no valid split found
 */
export function translateAsCompound(
  word: string,
  format: OutputFormat = 'ingglish'
): string | null {
  const lowerWord = word.toLowerCase();

  // Only try compound splitting for words 6+ characters
  if (lowerWord.length < 6) {
    return null;
  }

  const parts = dpDecompose(lowerWord);
  if (!parts) {
    return null;
  }

  // Look up each part and translate
  const translations: string[] = [];
  let pos = 0;
  for (const part of parts) {
    const phonemes = lookupWord(part);
    if (!phonemes) {
      return null;
    } // shouldn't happen but be safe
    let translated = arpabetToFormat(phonemes, format);

    // Preserve case per component for formats that support it
    if (getFormatPreservesCase(format)) {
      const originalPart = word.slice(pos, pos + part.length);
      if (originalPart.length > 0 && isUpperCase(originalPart[0]!)) {
        translated = capitalize(translated);
      }
    }
    translations.push(translated);
    pos += part.length;
  }

  return translations.join(getFormatJoinSeparator(format));
}
