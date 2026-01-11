/**
 * Dictionary lookup utilities.
 */

import { getDictionary } from './loader';

/** Cache for split pronunciations to avoid repeated string splits */
const splitCache = new Map<string, string[]>();

/**
 * Looks up a word in the CMU dictionary.
 * @param word The word to look up (case insensitive)
 * @returns Array of phonemes, or null if not found
 */
export function lookupPronunciation(word: string): string[] | null {
  const dict = getDictionary();
  const key = word.toLowerCase();
  const pronunciation = dict[key];
  if (!pronunciation) {
    return null;
  }
  // Check cache first
  let phonemes = splitCache.get(key);
  if (!phonemes) {
    phonemes = pronunciation.split(' ');
    splitCache.set(key, phonemes);
  }
  return phonemes;
}

/**
 * Checks if a word exists in the dictionary.
 */
export function hasWord(word: string): boolean {
  const dict = getDictionary();
  return dict[word.toLowerCase()] !== undefined;
}
