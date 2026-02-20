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
}

export interface SentenceScore {
  words: WordScore[];
  correct: number;
  total: number;
  /** Score as fraction 0–1 */
  score: number;
}

const EDGE_PUNCTUATION = /^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g;

function stripPunctuation(word: string): string {
  return word.replace(EDGE_PUNCTUATION, '');
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

    if (actual && expected) {
      // 1. Exact match (case-insensitive)
      if (actual.toLowerCase() === expected.toLowerCase()) {
        isCorrect = true;
      } else {
        // 2. Check homophones: reverse-translate the ingglish word
        //    and see if the user's answer is among valid English words
        const homophones = reverseTranslateWord(ingglish);
        isCorrect = homophones.some(
          (h) => stripPunctuation(h).toLowerCase() === actual.toLowerCase()
        );
      }
    }

    if (isCorrect) {
      correct++;
    }
    words.push({ ingglish, expected, actual, correct: isCorrect });
  }

  const total = words.length;
  return {
    words,
    correct,
    total,
    score: total > 0 ? correct / total : 0,
  };
}
