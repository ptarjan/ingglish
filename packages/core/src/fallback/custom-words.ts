/**
 * Custom pronunciations for words not in CMU dictionary.
 * Primarily tech terms, brand names, and neologisms.
 */

import { IPA_DICT_SUPPLEMENT } from './ipa-dict-supplement';

/**
 * Custom pronunciations for common words not in CMU dictionary.
 * These take priority over the ipa-dict supplement.
 */
export const CUSTOM_PRONUNCIATIONS: Record<string, string[]> = {
  // Tech terms
  git: ['G', 'IH1', 'T'],
  npm: ['EH1', 'N', 'P', 'IY1', 'EH1', 'M'], // spelled out
  oauth: ['OW1', 'AO1', 'TH'],
  async: ['EY1', 'S', 'IH0', 'NG', 'K'],
  sudo: ['S', 'UW1', 'D', 'OW0'],
  webpack: ['W', 'EH1', 'B', 'P', 'AE1', 'K'],
  localhost: ['L', 'OW1', 'K', 'AH0', 'L', 'HH', 'OW1', 'S', 'T'],
  podcast: ['P', 'AA1', 'D', 'K', 'AE1', 'S', 'T'],
  emoji: ['IH0', 'M', 'OW1', 'JH', 'IY0'],
  meme: ['M', 'IY1', 'M'],
  vlog: ['V', 'L', 'AO1', 'G'],
  blog: ['B', 'L', 'AO1', 'G'],
};

/**
 * Checks if a word has a custom pronunciation.
 * Checks both hand-curated CUSTOM_PRONUNCIATIONS and the ipa-dict supplement.
 */
export function hasCustomPronunciation(word: string): boolean {
  const lower = word.toLowerCase();
  return CUSTOM_PRONUNCIATIONS[lower] !== undefined || IPA_DICT_SUPPLEMENT[lower] !== undefined;
}

/**
 * Gets custom pronunciation for a word.
 * Checks hand-curated CUSTOM_PRONUNCIATIONS first, then falls back to ipa-dict supplement.
 */
export function getCustomPronunciation(word: string): string[] | undefined {
  const lower = word.toLowerCase();
  return CUSTOM_PRONUNCIATIONS[lower] ?? IPA_DICT_SUPPLEMENT[lower];
}
