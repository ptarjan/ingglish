/**
 * Compound word detection and translation.
 *
 * Handles words like "github" by splitting into "git" + "hub".
 * Preserves camelCase: "iCloud" -> "ie" + "Klowd" = "ieKlowd"
 */

import { lookupPronunciation, getWordFrequency } from '@ingglish/dictionary';
import type { OutputFormat } from '@ingglish/phonemes';
import {
  arpabetToFormat,
  getFormatJoinSeparator,
  getFormatPreservesCase,
} from '@ingglish/phonemes';
import type { LookupFn } from './british';

export type FreqFn = (word: string) => number | undefined;

/**
 * Capitalizes the first letter of a string.
 */
function capitalize(str: string): string {
  if (str.length === 0) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Checks if a character is uppercase.
 */
function isUpperCase(char: string): boolean {
  return char === char.toUpperCase() && char !== char.toLowerCase();
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
 * Uses dynamic programming to find the best decomposition of a word into
 * known dictionary parts. Prefers fewer parts with higher word frequency.
 *
 * Returns an array of parts, or null if no complete decomposition exists.
 */
export function dpDecompose(word: string, lookup?: LookupFn, getFreq?: FreqFn): null | string[] {
  const lookupFn = lookup ?? lookupPronunciation;
  const freqFn = getFreq ?? getWordFrequency;
  const n = word.length;
  // Store backtrace index + score + part count instead of copying arrays.
  // dp[i].from = split point j (word[j..i] is the last part), dp[i].count = number of parts.
  const dp: (undefined | { count: number; from: number; score: number })[] = Array.from<undefined>({
    length: n + 1,
  });
  dp[0] = { count: 0, from: -1, score: 0 };

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
      const chunk = word.slice(j, i);
      const phonemes = lookupFn(chunk);
      if (!phonemes) {
        continue;
      }

      const freq = freqFn(chunk);
      // Skip parts that are obscure (not in SUBTLEX or below frequency threshold)
      if (freq === undefined || freq < MIN_PART_FREQUENCY) {
        continue;
      }
      const newScore = prev.score + freq;
      const newCount = prev.count + 1;
      const current = dp[i];

      // Prefer: fewer parts first, then higher frequency
      if (
        current === undefined ||
        newCount < current.count ||
        (newCount === current.count && newScore > current.score)
      ) {
        dp[i] = { count: newCount, from: j, score: newScore };
      }
    }
  }

  const result = dp[n];
  // Must have at least 2 parts (otherwise it's not a compound)
  if (result === undefined || result.count < 2) {
    return null;
  }

  // Reconstruct parts by walking the backtrace
  const parts: string[] = [];
  let pos = n;
  while (pos > 0) {
    const entry = dp[pos]!;
    parts.push(word.slice(entry.from, pos));
    pos = entry.from;
  }
  parts.reverse();
  return parts;
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
  format: OutputFormat = 'ingglish',
  lookup?: LookupFn,
  getFreq?: FreqFn
): null | string {
  const lowerWord = word.toLowerCase();
  const lookupFn = lookup ?? lookupPronunciation;

  // Only try compound splitting for words 6+ characters
  if (lowerWord.length < 6) {
    return null;
  }

  const parts = dpDecompose(lowerWord, lookup, getFreq);
  if (!parts) {
    return null;
  }

  // Look up each part and translate
  const translations: string[] = [];
  let pos = 0;
  for (const part of parts) {
    const phonemes = lookupFn(part);
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
