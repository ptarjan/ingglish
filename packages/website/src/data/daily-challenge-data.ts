/**
 * Daily Challenge (Ingglish Wordle) data helpers.
 *
 * Builds a pool of 5-letter Ingglish words from the CMU dictionary,
 * picks a daily answer seeded by the UTC date, and validates guesses.
 */

import { translateSync } from 'ingglish';
import { getDictionary, getWordFrequency } from '@ingglish/dictionary';
import { mulberry32 } from '../games/prng';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LetterResult = 'absent' | 'correct' | 'present';

export interface WordPair {
  english: string;
  ingglish: string;
}

// ---------------------------------------------------------------------------
// Date / seed helpers (kept from original)
// ---------------------------------------------------------------------------

/** Simple hash of a YYYY-MM-DD string to a stable integer seed. */
export function getDailySeed(dateKey: string): number {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = Math.imul(31, hash) + dateKey.codePointAt(i)!;
    hash = Math.trunc(hash); // int32
  }
  return Math.abs(hash);
}

/** Today's date key in YYYY-MM-DD (UTC). */
export function getTodayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** Milliseconds until next UTC midnight. */
export function msUntilNextChallenge(): number {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  return tomorrow.getTime() - now.getTime();
}

// ---------------------------------------------------------------------------
// Word pool building
// ---------------------------------------------------------------------------

const FIVE_LETTER = /^[a-z]{5}$/;

/**
 * Filter the full pool to common words suitable as daily answers.
 * Uses word frequency data to pick ~300-500 well-known words.
 */
export function buildAnswerPool(pool: WordPair[]): WordPair[] {
  // Sort by frequency (most common first) and take the top slice.
  // getWordFrequency returns a raw count; higher = more common.
  const scored = pool
    .map((w) => ({ ...w, freq: getWordFrequency(w.english) ?? 0 }))
    .filter((w) => w.freq > 0);

  scored.sort((a, b) => b.freq - a.freq);

  // Take the top 400 most common words
  return scored.slice(0, 400);
}

/**
 * Build the full pool of 5-letter Ingglish words.
 * Translates every word in the CMU dictionary and keeps entries where
 * the Ingglish form is exactly 5 lowercase letters and differs from
 * the English spelling.
 *
 * Must be called after loadDictionary() + loadFrequencies().
 */
export function buildWordPool(): WordPair[] {
  const dict = getDictionary();
  const pool: WordPair[] = [];
  const seen = new Set<string>();

  for (const english of Object.keys(dict)) {
    // Skip entries with digits/punctuation (e.g. "a's", "1st")
    if (!/^[a-z]+$/.test(english)) {
      continue;
    }

    const ingglish = translateSync(english).toLowerCase();

    if (!FIVE_LETTER.test(ingglish)) {
      continue;
    }
    if (ingglish === english) {
      continue;
    } // must differ from English
    if (seen.has(ingglish)) {
      continue;
    } // deduplicate Ingglish forms

    seen.add(ingglish);
    pool.push({ english, ingglish });
  }

  return pool;
}

/**
 * Compare a 5-letter guess against the answer.
 * Returns a per-letter result array following standard Wordle rules:
 * - 'correct': right letter, right position (green)
 * - 'present': right letter, wrong position (yellow)
 * - 'absent':  letter not in word (gray)
 */
export function checkGuess(guess: string, answer: string): LetterResult[] {
  const result: LetterResult[] = Array.from({ length: 5 }, () => 'absent');

  // Count remaining letters in the answer (not yet matched as correct)
  const remaining: Record<string, number> = {};

  // First pass: mark correct (green) letters
  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) {
      result[i] = 'correct';
    } else {
      remaining[answer[i]!] = (remaining[answer[i]!] ?? 0) + 1;
    }
  }

  // Second pass: mark present (yellow) letters
  for (let i = 0; i < 5; i++) {
    if (result[i] === 'correct') {
      continue;
    }
    const letter = guess[i]!;
    if ((remaining[letter] ?? 0) > 0) {
      result[i] = 'present';
      remaining[letter]!--;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Guess checking (core Wordle algorithm)
// ---------------------------------------------------------------------------

/**
 * Pick today's answer from the answer pool using a seeded PRNG.
 */
export function pickDailyWord(answerPool: WordPair[]): WordPair {
  const seed = getDailySeed(getTodayKey());
  const rng = mulberry32(seed);
  const idx = Math.floor(rng() * answerPool.length);
  return answerPool[idx]!;
}
