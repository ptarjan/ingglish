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

  // CMU dictionary corrections
  buffet: ['B', 'AH0', 'F', 'EY1'], // /bʌˈfeɪ/ — French noun (food), not the verb "to strike"
  fiancee: ['F', 'IY0', 'AA0', 'N', 'S', 'EY1'], // /fiɑnˈseɪ/ — CMU has /si/ but should end in /seɪ/
  hors: ['AO1', 'R'], // /ɔːr/ — French: silent h and silent s (hors d'oeuvres)
  touche: ['T', 'UW0', 'SH', 'EY1'], // /tuˈʃeɪ/ — CMU has T UW1 SH (missing final syllable)

  // CMU variant ordering fixes — v1 has IY0 ("ee") but standard AmE uses EY ("ay")
  // See scripts/analyze-variants.js for the full analysis
  friday: ['F', 'R', 'AY1', 'D', 'EY2'],
  monday: ['M', 'AH1', 'N', 'D', 'EY2'],
  saturday: ['S', 'AE1', 'T', 'ER0', 'D', 'EY2'],
  tuesday: ['T', 'UW1', 'Z', 'D', 'EY2'],
  wednesday: ['W', 'EH1', 'N', 'Z', 'D', 'EY2'],

  // Accented homographs (diacritics signal different pronunciation)
  résumé: ['R', 'EH1', 'Z', 'AH0', 'M', 'EY2'], // /ˈɹɛz.əˌmeɪ/ — French noun (CV), not verb "to resume"
  exposé: ['EH2', 'K', 'S', 'P', 'OW0', 'Z', 'EY1'], // /ˌɛkspoʊˈzeɪ/ — French noun (report), not verb "to expose"

  // Foreign loanwords not in CMU dictionary
  brulee: ['B', 'R', 'UW0', 'L', 'EY1'], // /bɹuːˈleɪ/ — as in crème brûlée
  doppelganger: ['D', 'AA1', 'P', 'AH0', 'L', 'G', 'AE2', 'NG', 'ER0'], // /ˈdɑː.pəl.ˌɡæŋ.ər/
  flambe: ['F', 'L', 'AA0', 'M', 'B', 'EY1'], // /flɑːmˈbeɪ/
  gestalt: ['G', 'AH0', 'SH', 'T', 'AA1', 'L', 'T'], // /ɡəˈʃtɑːlt/
  manana: ['M', 'AE0', 'N', 'Y', 'AA1', 'N', 'AH0'], // /mænˈjɑːnə/ — Spanish: tomorrow
  negligee: ['N', 'EH1', 'G', 'L', 'AH0', 'ZH', 'EY2'], // /ˈnɛɡlɪˌʒeɪ/
  patisserie: ['P', 'AH0', 'T', 'IH1', 'S', 'ER0', 'IY0'], // /pəˈtɪsəɹi/
  pinata: ['P', 'IH0', 'N', 'Y', 'AA1', 'T', 'AH0'], // /pɪnˈjɑːtə/ — Spanish: party game
  soupcon: ['S', 'UW1', 'P', 'S', 'AA0', 'N'], // /ˈsuːpsɒn/ — French: a tiny amount

  // Irregular words not in CMU dictionary
  chamois: ['SH', 'AE1', 'M', 'IY0'], // /ˈʃæmi/ — standard AmE pronunciation
  cholmondeley: ['CH', 'AH1', 'M', 'L', 'IY0'], // /ˈtʃʌm.li/
  drachm: ['D', 'R', 'AE1', 'M'], // /dræm/ — silent ch
  islington: ['IH1', 'Z', 'L', 'IH0', 'NG', 'T', 'AH0', 'N'], // /ˈɪz.lɪŋ.tən/
  obsequies: ['AA1', 'B', 'S', 'IH0', 'K', 'W', 'IY0', 'Z'], // /ˈɑːb.sɪ.kwiz/
  oppugnant: ['AH0', 'P', 'AH1', 'G', 'N', 'AH0', 'N', 'T'], // /əˈpʌɡ.nənt/
  oppugners: ['AH0', 'P', 'Y', 'UW1', 'N', 'ER0', 'Z'], // /əˈpjuːnɝz/ — 'g' is silent (like impugn)
  phaeton: ['F', 'EY1', 'IH0', 'T', 'AH0', 'N'], // /ˈfeɪ.ɪ.tən/
  piquet: ['P', 'IH0', 'K', 'EY1'], // /pɪˈkeɪ/ — French card game
  puisne: ['P', 'Y', 'UW1', 'N', 'IY0'], // /ˈpjuː.ni/ — legal term
  streatham: ['S', 'T', 'R', 'EH1', 'T', 'AH0', 'M'], // /ˈstret.əm/
  terpsichore: ['T', 'ER0', 'P', 'S', 'IH1', 'K', 'ER0', 'IY0'], // /tɝpˈsɪk.ər.i/
  victual: ['V', 'IH1', 'T', 'AH0', 'L'], // /ˈvɪt.əl/ — silent c
  victuals: ['V', 'IH1', 'T', 'AH0', 'L', 'Z'],

  // Tech terms
  chatgpt: ['CH', 'AE1', 'T', 'JH', 'IY1', 'P', 'IY1', 'T', 'IY1'], // chat + G-P-T
  git: ['G', 'IH1', 'T'],
  github: ['G', 'IH1', 'T', 'HH', 'AH1', 'B'],
  npm: ['EH1', 'N', 'P', 'IY1', 'EH1', 'M'], // spelled out
  oauth: ['OW1', 'AO1', 'TH'],
  async: ['EY1', 'S', 'IH0', 'NG', 'K'],
  sudo: ['S', 'UW1', 'D', 'OW0'],
  webpack: ['W', 'EH1', 'B', 'P', 'AE1', 'K'],
  localhost: ['L', 'OW1', 'K', 'AH0', 'L', 'HH', 'OW2', 'S', 'T'],
  podcast: ['P', 'AA1', 'D', 'K', 'AE2', 'S', 'T'],
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
  return Object.prototype.hasOwnProperty.call(CUSTOM_PRONUNCIATIONS, word);
}

/**
 * Gets custom pronunciation for a word.
 * @param word The word to look up (should be lowercase for best performance)
 */
export function getCustomPronunciation(word: string): string[] | undefined {
  return Object.prototype.hasOwnProperty.call(CUSTOM_PRONUNCIATIONS, word)
    ? CUSTOM_PRONUNCIATIONS[word]
    : undefined;
}
