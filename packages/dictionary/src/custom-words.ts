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

  // CMU dictionary corrections — original
  buffet: ['B', 'AH0', 'F', 'EY1'], // /bʌˈfeɪ/ — French noun (food), not the verb "to strike"
  cuckoo: ['K', 'UW1', 'K', 'UW0'], // /ˈkuːku/ — CMU has AH1 (ʌ) for first vowel
  fiancee: ['F', 'IY0', 'AA0', 'N', 'S', 'EY1'], // /fiɑnˈseɪ/ — CMU has /si/ but should end in /seɪ/
  finagle: ['F', 'IH0', 'N', 'EY1', 'G', 'AH0', 'L'], // /fɪˈneɪɡəl/ — CMU has IH1 N AH0 (missing diphthong)
  grandma: ['G', 'R', 'AE1', 'N', 'M', 'AA2'], // /ˈɡɹænmɑ/ — CMU has spurious /d/
  hors: ['AO1', 'R'], // /ɔːr/ — French: silent h and silent s (hors d'oeuvres)
  intention: ['IH0', 'N', 'T', 'EH1', 'N', 'SH', 'AH0', 'N'], // /ɪnˈtɛnʃən/ — CMU has CH (tʃ) instead of SH (ʃ)
  ow: ['AW1'], // /aʊ/ — CMU has OW1 (oʊ) but interjection is "ouch" sound
  thyme: ['T', 'AY1', 'M'], // /taɪm/ — CMU has TH but h is silent (like "time")
  touche: ['T', 'UW0', 'SH', 'EY1'], // /tuˈʃeɪ/ — CMU has T UW1 SH (missing final syllable)

  // CMU dictionary corrections — N→NG before K/G (verified vs Cambridge/Wiktionary)
  // In English, /n/ always assimilates to [ŋ] before velar consonants /k,g/.
  // CMU convention uses NG before K/G (e.g., "think"=TH IH1 NG K).
  incompetent: ['IH2', 'NG', 'K', 'AA1', 'M', 'P', 'AH0', 'T', 'AH0', 'N', 'T'], // CMU has N K, should be NG K
  increment: ['IH1', 'NG', 'K', 'R', 'AH0', 'M', 'AH0', 'N', 'T'], // CMU has N K, should be NG K
  inconclusive: ['IH2', 'NG', 'K', 'AH0', 'NG', 'K', 'L', 'UW1', 'S', 'IH0', 'V'], // CMU has N K at both positions
  inconclusively: ['IH2', 'NG', 'K', 'AH0', 'NG', 'K', 'L', 'UW1', 'S', 'IH0', 'V', 'L', 'IY0'], // CMU has N K and wrong vowels
  conquests: ['K', 'AA1', 'NG', 'K', 'W', 'EH2', 'S', 'T', 'S'], // CMU has N K, "conquest" correctly has NG K
  engenders: ['EH0', 'N', 'JH', 'EH1', 'N', 'D', 'ER0', 'Z'], // CMU entry corrupted (NG G instead of N JH)

  // CMU dictionary corrections — consonant errors (verified vs Cambridge/Wiktionary)
  fraudulently: ['F', 'R', 'AO1', 'JH', 'AH0', 'L', 'AH0', 'N', 'T', 'L', 'IY0'], // CMU has D UW0, should be JH AH0 (like "fraudulent")
  haphazardly: ['HH', 'AE0', 'P', 'HH', 'AE1', 'Z', 'ER0', 'D', 'L', 'IY0'], // CMU has F, should be P HH (like "haphazard")
  conscientiously: ['K', 'AA2', 'N', 'SH', 'IY0', 'EH1', 'N', 'SH', 'AH0', 'S', 'L', 'IY0'], // CMU has CH, should be SH (like "conscientious")
  forgings: ['F', 'AO1', 'R', 'JH', 'IH0', 'NG', 'Z'], // CMU missing R (present in "forging")
  withdrawals: ['W', 'IH0', 'DH', 'D', 'R', 'AO1', 'AH0', 'L', 'Z'], // CMU has TH (voiceless), should be DH (voiced, like "withdrawal")
  presidentially: ['P', 'R', 'EH2', 'Z', 'IH0', 'D', 'EH1', 'N', 'SH', 'AH0', 'L', 'IY0'], // CMU has S, should be Z (like "presidential")
  resolutely: ['R', 'EH1', 'Z', 'AH0', 'L', 'UW2', 'T', 'L', 'IY0'], // CMU has S, should be Z (like "resolute")
  ceaselessly: ['S', 'IY1', 'S', 'L', 'AH0', 'S', 'L', 'IY0'], // CMU has Z, should be S (like "ceaseless")
  reschedulings: ['R', 'IY0', 'S', 'K', 'EH1', 'JH', 'UW0', 'L', 'IH0', 'NG', 'Z'], // CMU has SH (British), should be S (AmE, like "rescheduling")
  headquartered: ['HH', 'EH1', 'D', 'K', 'W', 'AO2', 'R', 'T', 'ER0', 'D'], // CMU missing W (present in "headquarter")

  // CMU dictionary corrections — vowel/glide errors (verified vs Cambridge/Wiktionary)
  duplication: ['D', 'UW2', 'P', 'L', 'AH0', 'K', 'EY1', 'SH', 'AH0', 'N'], // CMU has Y glide (British), AmE is /duː/ (like "duplications")
  duplicates: ['D', 'UW1', 'P', 'L', 'AH0', 'K', 'EY2', 'T', 'S'], // CMU has Y glide (British), AmE is /duː/ (like "duplicate")
  tuition: ['T', 'UW0', 'IH1', 'SH', 'AH0', 'N'], // CMU has Y glide, AmE is /tuː/ (like "tuitions")
  unknowns: ['AH0', 'N', 'N', 'OW1', 'N', 'Z'], // CMU missing second N (present in "unknown" /ʌnˈnoʊn/)
  convulsant: ['K', 'AH0', 'N', 'V', 'AH1', 'L', 'S', 'AH0', 'N', 'T'], // CMU missing N before V (present in "convulsants")
  revaluations: ['R', 'IY0', 'V', 'AE2', 'L', 'Y', 'UW0', 'EY1', 'SH', 'AH0', 'N', 'Z'], // CMU has extra IH0 (not in "revaluation")
  alienate: ['EY1', 'L', 'IY0', 'AH0', 'N', 'EY2', 'T'], // CMU has Y, should be IY0 (like "alienated"/"alienates")
  leniently: ['L', 'IY1', 'N', 'IY0', 'AH0', 'N', 'T', 'L', 'IY0'], // CMU has Y, should be IY0 (like "lenient")

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
