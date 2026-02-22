/**
 * Word-by-word scoring for the Reading Challenge.
 *
 * Compares user's typed English against the original English sentence,
 * with homophone acceptance via reverseTranslateWord.
 */

import { reverseTranslateWord } from 'ingglish';
import type { TranslatedToken } from 'ingglish';

export interface WordScore {
  /** The Ingglish word shown to the user */
  ingglish: string;
  /** The expected English word */
  expected: string;
  /** What the user typed for this position */
  actual: string;
  /** Whether the user's answer was accepted */
  correct: boolean;
  /** True if accepted via fuzzy match (close misspelling) */
  fuzzy?: boolean;
}

export interface SentenceScore {
  words: WordScore[];
  correct: number;
  total: number;
  /** Score as fraction 0–1 */
  score: number;
}

const EDGE_PUNCTUATION = /^[^a-z0-9]+|[^a-z0-9]+$/gi;

function stripPunctuation(word: string): string {
  return word.replace(EDGE_PUNCTUATION, '');
}

/** Levenshtein edit distance between two strings. */
function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = i - 1;
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j]!;
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j]!, dp[j - 1]!);
      prev = temp;
    }
  }
  return dp[n]!;
}

/** Allow 1 edit for words <= 5 chars, 2 edits for longer words. */
function isCloseEnough(actual: string, expected: string): boolean {
  const dist = editDistance(actual, expected);
  const maxDist = expected.length <= 5 ? 1 : 2;
  return dist > 0 && dist <= maxDist;
}

/**
 * Score a user's English guess against the expected sentence.
 * Matches word-by-word, accepting homophones via reverseTranslateWord.
 */
export function scoreSentence(tokens: TranslatedToken[], userInput: string): SentenceScore {
  // Extract word tokens (skip whitespace/punctuation-only tokens)
  const wordTokens = tokens.filter((t) => t.isWord);
  const userWords = userInput.trim().split(/\s+/).filter(Boolean);

  const words: WordScore[] = [];
  let correct = 0;

  for (let i = 0; i < wordTokens.length; i++) {
    const token = wordTokens[i]!;
    const expected = stripPunctuation(token.original);
    const ingglish = stripPunctuation(token.translated);
    const actual = stripPunctuation(userWords[i] ?? '');

    if (!expected) {
      continue;
    }

    let isCorrect = false;
    let isFuzzy = false;

    if (actual && expected) {
      const actualLower = actual.toLowerCase();
      const expectedLower = expected.toLowerCase();

      // 1. Exact match (case-insensitive)
      if (actualLower === expectedLower) {
        isCorrect = true;
      } else {
        // 2. Check homophones: reverse-translate the ingglish word
        //    and see if the user's answer is among valid English words
        const homophones = reverseTranslateWord(ingglish);
        isCorrect = homophones.some((h) => stripPunctuation(h).toLowerCase() === actualLower);
      }

      // 3. Fuzzy match: accept close misspellings of the expected word
      if (!isCorrect && isCloseEnough(actualLower, expectedLower)) {
        isCorrect = true;
        isFuzzy = true;
      }
    }

    if (isCorrect) {
      correct++;
    }
    words.push({ ingglish, expected, actual, correct: isCorrect, fuzzy: isFuzzy });
  }

  const total = words.length;
  return {
    words,
    correct,
    total,
    score: total > 0 ? correct / total : 0,
  };
}
