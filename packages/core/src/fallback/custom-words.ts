/**
 * Custom pronunciations for words not in CMU dictionary.
 * Primarily tech terms, brand names, and neologisms.
 */

/**
 * Custom pronunciations for common words not in CMU dictionary.
 */
export const CUSTOM_PRONUNCIATIONS: Record<string, string[]> = {
  // Abbreviations
  vs: ['V', 'ER1', 'S', 'AH0', 'S'], // versus
  devs: ['D', 'EH1', 'V', 'Z'], // developers (prevents "de" + "vs" compound split)

  // Irregular words not in CMU dictionary
  chamois: ['SH', 'AE1', 'M', 'IY0'], // /ˈʃæm.i/
  drachm: ['D', 'R', 'AE1', 'M'], // /dræm/ — silent ch
  piquet: ['P', 'IH0', 'K', 'EY1'], // /pɪˈkeɪ/ — French card game
  puisne: ['P', 'Y', 'UW1', 'N', 'IY0'], // /ˈpjuː.ni/ — legal term
  victual: ['V', 'IH1', 'T', 'AH0', 'L'], // /ˈvɪt.əl/ — silent c
  victuals: ['V', 'IH1', 'T', 'AH0', 'L', 'Z'],
  phaeton: ['F', 'EY1', 'IH0', 'T', 'AH0', 'N'], // /ˈfeɪ.ɪ.tən/

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
 * @param word The word to look up (should be lowercase for best performance)
 */
export function hasCustomPronunciation(word: string): boolean {
  return CUSTOM_PRONUNCIATIONS[word] !== undefined;
}

/**
 * Gets custom pronunciation for a word.
 * @param word The word to look up (should be lowercase for best performance)
 */
export function getCustomPronunciation(word: string): string[] | undefined {
  return CUSTOM_PRONUNCIATIONS[word];
}
