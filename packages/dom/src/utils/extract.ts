/**
 * Word extraction utilities.
 */

import { normalizeApostrophes, WORD_SPLIT_REGEX, WORD_TEST_REGEX } from '@ingglish/core/internal';

/**
 * Extracts unique words from text for batch translation.
 * Returns lowercase words for dictionary lookup.
 */
export function extractWords(text: string): string[] {
  const normalized = normalizeApostrophes(text);
  // Use split with WORD_SPLIT_REGEX and filter for words
  const tokens = normalized.split(WORD_SPLIT_REGEX);
  const words = tokens.filter((t) => t !== '' && WORD_TEST_REGEX.test(t));
  return [...new Set(words.map((w) => w.toLowerCase()))];
}

/**
 * Extracts all unique words from an array of text nodes.
 * Useful for batch translation scenarios.
 */
export function extractWordsFromNodes(textNodes: Text[]): string[] {
  const allWords: string[] = [];
  for (const node of textNodes) {
    const words = extractWords(node.textContent ?? '');
    allWords.push(...words);
  }
  return [...new Set(allWords)];
}
