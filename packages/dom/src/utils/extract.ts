/**
 * Word extraction utilities.
 */

import { normalizeApostrophes } from '@ingglish/core';

/**
 * Extracts unique words from text for batch translation.
 * Returns lowercase words for dictionary lookup.
 */
export function extractWords(text: string): string[] {
  const normalized = normalizeApostrophes(text);
  const matches = normalized.match(/\b[a-zA-Z']+\b/g) ?? [];
  return [...new Set(matches.map((w) => w.toLowerCase()))];
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
