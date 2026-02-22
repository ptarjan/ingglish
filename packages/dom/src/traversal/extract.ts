/**
 * Word extraction utilities.
 */

import { normalizeApostrophes } from '@ingglish/normalize';
import { WORD_SPLIT_REGEX, WORD_TEST_REGEX } from '@ingglish/tokenize';

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
 * Uses a single Set to collect and deduplicate in one pass.
 *
 * @param textNodes - Array of DOM text nodes to extract words from
 * @returns Array of unique lowercase words across all nodes
 */
export function extractWordsFromNodes(textNodes: Text[]): string[] {
  const uniqueWords = new Set<string>();
  for (const node of textNodes) {
    const text = node.textContent ?? '';
    const normalized = normalizeApostrophes(text);
    const tokens = normalized.split(WORD_SPLIT_REGEX);
    for (const token of tokens) {
      if (token !== '' && WORD_TEST_REGEX.test(token)) {
        uniqueWords.add(token.toLowerCase());
      }
    }
  }
  return Array.from(uniqueWords);
}
