/**
 * Custom pronunciations that override CMU dictionary entries or add missing words.
 *
 * Two categories:
 * 1. CMU corrections — fix errors in existing CMU entries (verified vs Cambridge/Wiktionary)
 * 2. Additions — words not in CMU (tech terms, loanwords, etc.)
 *
 * Note: ~800 N-before-velar errors (N K → NG K, N G → NG G) are fixed automatically
 * by normalizeVelarNasal() in lookup.ts and don't need entries here.
 */
export const CUSTOM_PRONUNCIATIONS: Record<string, string[]> = {
  // ---------------------------------------------------------------------------
  // CMU corrections — wrong consonant
  // ---------------------------------------------------------------------------

  // CH should be SH in -tion/-sion suffix after N (S+CH is correct, e.g. "question")
  intention: ['IH0', 'N', 'T', 'EH1', 'N', 'SH', 'AH0', 'N'], // CMU has CH
  intentions: ['IH0', 'N', 'T', 'EH1', 'N', 'SH', 'AH0', 'N', 'Z'], // CMU has CH
  tensions: ['T', 'EH1', 'N', 'SH', 'AH0', 'N', 'Z'], // CMU has CH (singular is correct)
  mansions: ['M', 'AE1', 'N', 'SH', 'AH0', 'N', 'Z'], // CMU has CH (singular is correct)
  abstention: ['AH0', 'B', 'S', 'T', 'EH1', 'N', 'SH', 'AH0', 'N'], // CMU has CH
  abstentions: ['AH0', 'B', 'S', 'T', 'EH1', 'N', 'SH', 'AH0', 'N', 'Z'], // CMU has CH
  contravention: ['K', 'AA2', 'N', 'T', 'R', 'AH0', 'V', 'EH1', 'N', 'SH', 'AH0', 'N'], // CMU has CH
  inattention: ['IH2', 'N', 'AH0', 'T', 'EH1', 'N', 'SH', 'AH0', 'N'], // CMU has CH
  circumvention: ['S', 'ER2', 'K', 'AH0', 'M', 'V', 'EH1', 'N', 'SH', 'AH0', 'N'], // CMU has CH
  conscientiously: ['K', 'AA2', 'N', 'SH', 'IY0', 'EH1', 'N', 'SH', 'AH0', 'S', 'L', 'IY0'], // CMU has CH

  // Voicing errors (S↔Z, TH↔DH)
  presidentially: ['P', 'R', 'EH2', 'Z', 'IH0', 'D', 'EH1', 'N', 'SH', 'AH0', 'L', 'IY0'], // CMU has S, should be Z
  resolutely: ['R', 'EH1', 'Z', 'AH0', 'L', 'UW2', 'T', 'L', 'IY0'], // CMU has S, should be Z
  ceaselessly: ['S', 'IY1', 'S', 'L', 'AH0', 'S', 'L', 'IY0'], // CMU has Z, should be S
  reschedulings: ['R', 'IY0', 'S', 'K', 'EH1', 'JH', 'UW0', 'L', 'IH0', 'NG', 'Z'], // CMU has SH (British), AmE is S
  withdrawals: ['W', 'IH0', 'DH', 'D', 'R', 'AO1', 'AH0', 'L', 'Z'], // CMU has TH, should be DH

  // Wrong consonant
  fraudulently: ['F', 'R', 'AO1', 'JH', 'AH0', 'L', 'AH0', 'N', 'T', 'L', 'IY0'], // CMU has D, should be JH
  haphazardly: ['HH', 'AE0', 'P', 'HH', 'AE1', 'Z', 'ER0', 'D', 'L', 'IY0'], // CMU has F, should be P HH
  engenders: ['EH0', 'N', 'JH', 'EH1', 'N', 'D', 'ER0', 'Z'], // CMU has NG G, should be N JH
  thyme: ['T', 'AY1', 'M'], // CMU has TH, but h is silent (like "time")
  grandma: ['G', 'R', 'AE1', 'N', 'M', 'AA2'], // CMU has spurious /d/
  actuator: ['AE1', 'K', 'CH', 'UW0', 'EY2', 'T', 'ER0'], // CMU has T Y UW, should be CH UW
  actuators: ['AE1', 'K', 'CH', 'UW0', 'EY2', 'T', 'ER0', 'Z'], // CMU has T Y UW, should be CH UW

  // Missing phoneme in derived form
  forgings: ['F', 'AO1', 'R', 'JH', 'IH0', 'NG', 'Z'], // CMU missing R
  headquartered: ['HH', 'EH1', 'D', 'K', 'W', 'AO2', 'R', 'T', 'ER0', 'D'], // CMU missing W
  unknowns: ['AH0', 'N', 'N', 'OW1', 'N', 'Z'], // CMU missing second N
  convulsant: ['K', 'AH0', 'N', 'V', 'AH1', 'L', 'S', 'AH0', 'N', 'T'], // CMU missing N before V
  temptation: ['T', 'EH0', 'M', 'P', 'T', 'EY1', 'SH', 'AH0', 'N'], // CMU missing P in /mpt/ cluster
  temptations: ['T', 'EH0', 'M', 'P', 'T', 'EY1', 'SH', 'AH0', 'N', 'Z'],
  roommate: ['R', 'UW1', 'M', 'M', 'EY2', 'T'], // CMU missing geminate M at compound boundary
  roommates: ['R', 'UW1', 'M', 'M', 'EY2', 'T', 'S'],

  // N→NG + additional vowel fix (N→NG alone handled by normalizeVelarNasal)
  inconclusively: ['IH2', 'NG', 'K', 'AH0', 'NG', 'K', 'L', 'UW1', 'S', 'IH0', 'V', 'L', 'IY0'], // CMU has N K and wrong vowels

  // ---------------------------------------------------------------------------
  // CMU corrections — wrong vowel or glide
  // ---------------------------------------------------------------------------

  // Spurious Y glide (British /juː/ where AmE uses /uː/)
  duplication: ['D', 'UW2', 'P', 'L', 'AH0', 'K', 'EY1', 'SH', 'AH0', 'N'], // CMU has D Y UW, AmE is /duː/
  duplicates: ['D', 'UW1', 'P', 'L', 'AH0', 'K', 'EY2', 'T', 'S'], // CMU has D Y UW, AmE is /duː/
  tuition: ['T', 'UW0', 'IH1', 'SH', 'AH0', 'N'], // CMU has T Y UW, AmE is /tuː/
  alienate: ['EY1', 'L', 'IY0', 'AH0', 'N', 'EY2', 'T'], // CMU has Y, should be IY0
  leniently: ['L', 'IY1', 'N', 'IY0', 'AH0', 'N', 'T', 'L', 'IY0'], // CMU has Y, should be IY0

  // Wrong vowel
  president: ['P', 'R', 'EH1', 'Z', 'IH0', 'D', 'AH0', 'N', 'T'], // CMU has AH0 for /ɪ/ and EH2 for /ə/
  cuckoo: ['K', 'UW1', 'K', 'UW0'], // CMU has AH1 for first vowel
  finagle: ['F', 'IH0', 'N', 'EY1', 'G', 'AH0', 'L'], // CMU missing EY diphthong
  nemo: ['N', 'IY1', 'M', 'OW0'], // CMU has EH1 (/ɛ/) for /iː/
  valium: ['V', 'AE1', 'L', 'IY0', 'AH0', 'M'], // CMU has EY1 (/eɪ/) for /æ/
  legit: ['L', 'AH0', 'JH', 'IH1', 'T'], // CMU has stress on wrong syllable
  legalese: ['L', 'IY2', 'G', 'AH0', 'L', 'IY1', 'Z'], // CMU has wrong vowels, stress, and final consonant
  bocce: ['B', 'AA1', 'CH', 'IY0'], // CMU has OW1 (/oʊ/) for /ɑː/
  padre: ['P', 'AA1', 'D', 'R', 'EY0'], // CMU has AE1 (/æ/) for /ɑː/
  africa: ['AE1', 'F', 'R', 'IH0', 'K', 'AH0'], // CMU has AH0 (/ə/) for /ɪ/ and AA0 (/ɑ/) for /ə/
  abele: ['AH0', 'B', 'IY1', 'L'], // CMU has EH1 (/ɛ/) for /iː/
  revaluations: ['R', 'IY0', 'V', 'AE2', 'L', 'Y', 'UW0', 'EY1', 'SH', 'AH0', 'N', 'Z'], // CMU has extra IH0
  ow: ['AW1'], // CMU has OW1, but interjection is /aʊ/ ("ouch")

  // ---------------------------------------------------------------------------
  // CMU corrections — wrong word sense or incomplete entry
  // ---------------------------------------------------------------------------

  buffet: ['B', 'AH0', 'F', 'EY1'], // CMU has verb "to strike", should be noun (food) /bʌˈfeɪ/
  fiancee: ['F', 'IY0', 'AA0', 'N', 'S', 'EY1'], // CMU has wrong final syllable
  hors: ['AO1', 'R'], // CMU wrong — French: silent h and s (hors d'oeuvres)
  touche: ['T', 'UW0', 'SH', 'EY1'], // CMU missing final syllable

  // ---------------------------------------------------------------------------
  // CMU corrections — variant ordering (v1 wrong for standard AmE)
  // ---------------------------------------------------------------------------

  // Days of the week: CMU v1 has IY0 ("ee") but standard AmE uses EY ("ay")
  friday: ['F', 'R', 'AY1', 'D', 'EY2'],
  monday: ['M', 'AH1', 'N', 'D', 'EY2'],
  saturday: ['S', 'AE1', 'T', 'ER0', 'D', 'EY2'],
  tuesday: ['T', 'UW1', 'Z', 'D', 'EY2'],
  wednesday: ['W', 'EH1', 'N', 'Z', 'D', 'EY2'],

  // Accented homographs: diacritics signal a different word than CMU's default
  résumé: ['R', 'EH1', 'Z', 'AH0', 'M', 'EY2'], // French noun (CV), not verb "to resume"
  exposé: ['EH2', 'K', 'S', 'P', 'OW0', 'Z', 'EY1'], // French noun (report), not verb "to expose"

  // ---------------------------------------------------------------------------
  // Additions — words not in CMU dictionary
  // ---------------------------------------------------------------------------

  // Abbreviations
  vs: ['V', 'ER1', 'S', 'AH0', 'S'], // "versus" — prevents "de" + "vs" compound split
  devs: ['D', 'EH1', 'V', 'Z'], // "developers"

  // Tech terms
  async: ['EY1', 'S', 'IH0', 'NG', 'K'],
  blog: ['B', 'L', 'AO1', 'G'],
  chatgpt: ['CH', 'AE1', 'T', 'JH', 'IY1', 'P', 'IY1', 'T', 'IY1'],
  emoji: ['IH0', 'M', 'OW1', 'JH', 'IY0'],
  git: ['G', 'IH1', 'T'],
  github: ['G', 'IH1', 'T', 'HH', 'AH1', 'B'],
  localhost: ['L', 'OW1', 'K', 'AH0', 'L', 'HH', 'OW2', 'S', 'T'],
  meme: ['M', 'IY1', 'M'],
  npm: ['EH1', 'N', 'P', 'IY1', 'EH1', 'M'],
  oauth: ['OW1', 'AO1', 'TH'],
  podcast: ['P', 'AA1', 'D', 'K', 'AE2', 'S', 'T'],
  sudo: ['S', 'UW1', 'D', 'OW0'],
  vlog: ['V', 'L', 'AO1', 'G'],
  webpack: ['W', 'EH1', 'B', 'P', 'AE1', 'K'],

  // Foreign loanwords
  brulee: ['B', 'R', 'UW0', 'L', 'EY1'], // as in crème brûlée
  doppelganger: ['D', 'AA1', 'P', 'AH0', 'L', 'G', 'AE2', 'NG', 'ER0'],
  flambe: ['F', 'L', 'AA0', 'M', 'B', 'EY1'],
  gestalt: ['G', 'AH0', 'SH', 'T', 'AA1', 'L', 'T'],
  manana: ['M', 'AE0', 'N', 'Y', 'AA1', 'N', 'AH0'], // Spanish: tomorrow
  negligee: ['N', 'EH1', 'G', 'L', 'AH0', 'ZH', 'EY2'],
  patisserie: ['P', 'AH0', 'T', 'IH1', 'S', 'ER0', 'IY0'],
  pinata: ['P', 'IH0', 'N', 'Y', 'AA1', 'T', 'AH0'], // Spanish: party game
  soupcon: ['S', 'UW1', 'P', 'S', 'AA0', 'N'], // French: a tiny amount

  // Irregular English words
  chamois: ['SH', 'AE1', 'M', 'IY0'],
  cholmondeley: ['CH', 'AH1', 'M', 'L', 'IY0'],
  drachm: ['D', 'R', 'AE1', 'M'], // silent ch
  islington: ['IH1', 'Z', 'L', 'IH0', 'NG', 'T', 'AH0', 'N'],
  obsequies: ['AA1', 'B', 'S', 'IH0', 'K', 'W', 'IY0', 'Z'],
  oppugnant: ['AH0', 'P', 'AH1', 'G', 'N', 'AH0', 'N', 'T'],
  oppugners: ['AH0', 'P', 'Y', 'UW1', 'N', 'ER0', 'Z'], // silent g (like "impugn")
  phaeton: ['F', 'EY1', 'IH0', 'T', 'AH0', 'N'],
  piquet: ['P', 'IH0', 'K', 'EY1'], // French card game
  puisne: ['P', 'Y', 'UW1', 'N', 'IY0'], // legal term
  streatham: ['S', 'T', 'R', 'EH1', 'T', 'AH0', 'M'],
  terpsichore: ['T', 'ER0', 'P', 'S', 'IH1', 'K', 'ER0', 'IY0'],
  victual: ['V', 'IH1', 'T', 'AH0', 'L'], // silent c
  victuals: ['V', 'IH1', 'T', 'AH0', 'L', 'Z'],
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
