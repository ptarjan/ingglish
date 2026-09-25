/**
 * Word extraction utilities.
 */

import { tokenizeText } from '@ingglish/normalize';

/**
 * Extracts unique words from text for batch translation.
 *
 * @param text - Text to extract words from
 * @returns Array of unique lowercase words (no duplicates)
 */
export function extractWords(text: string): string[] {
  return extractWordsFromTexts([text]);
}

/**
 * Extracts all unique words from an array of text nodes.
 * Uses a single Set to collect and deduplicate in one pass.
 *
 * @param textNodes - Array of DOM text nodes to extract words from
 * @returns Array of unique lowercase words across all nodes
 */
export function extractWordsFromNodes(textNodes: Text[]): string[] {
  return extractWordsFromTexts(textNodes.map((node) => node.textContent ?? ''));
}

function extractWordsFromTexts(texts: string[]): string[] {
  const uniqueWords = new Set<string>();
  for (const text of texts) {
    for (const token of tokenizeText(text)) {
      if (token.isWord) {
        uniqueWords.add(token.text.toLowerCase());
      }
    }
  }
  return [...uniqueWords];
}
