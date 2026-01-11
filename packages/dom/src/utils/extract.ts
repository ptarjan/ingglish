/**
 * Word extraction utilities.
 */

import { normalizeApostrophes, WORD_SPLIT_REGEX, WORD_TEST_REGEX } from '@ingglish/core/internal';

/**
 * Extracts unique words from text for batch translation.
 *
 * @param text - Text to extract words from
 * @returns Array of unique lowercase words (no duplicates)
 */
export function extractWords(text: string): string[] {
  const normalized = normalizeApostrophes(text);
  const tokens = normalized.split(WORD_SPLIT_REGEX);
  // Single pass: filter, lowercase, and deduplicate
  const uniqueWords = new Set<string>();
  for (const token of tokens) {
    if (token !== '' && WORD_TEST_REGEX.test(token)) {
      uniqueWords.add(token.toLowerCase());
    }
  }
  return Array.from(uniqueWords);
}

/**
 * Extracts all unique words from an array of text nodes.
 * Useful for batch translation scenarios.
 *
 * @param textNodes - Array of DOM text nodes to extract words from
 * @returns Array of unique lowercase words across all nodes
 */
export function extractWordsFromNodes(textNodes: Text[]): string[] {
  const allWords: string[] = [];
  for (const node of textNodes) {
    const words = extractWords(node.textContent ?? '');
    allWords.push(...words);
  }
  return [...new Set(allWords)];
}
