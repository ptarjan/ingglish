/**
 * Dictionary lookup utilities.
 */

import { getDictionary } from './loader';

/**
 * Looks up a word in the CMU dictionary.
 * @param word The word to look up (case insensitive)
 * @returns Array of phonemes, or null if not found
 */
export function lookupPronunciation(word: string): string[] | null {
  const dict = getDictionary();
  const pronunciation = dict[word.toLowerCase()];
  if (!pronunciation) {
    return null;
  }
  return pronunciation.split(' ');
}

/**
 * Checks if a word exists in the dictionary.
 */
export function hasWord(word: string): boolean {
  const dict = getDictionary();
  return dict[word.toLowerCase()] !== undefined;
}
