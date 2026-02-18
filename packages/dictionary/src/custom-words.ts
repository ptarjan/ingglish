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

  // CMU has /tʃ/ instead of /ʃ/ in -tion/-sion suffix after N
  intention: ['IH0', 'N', 'T', 'EH1', 'N', 'SH', 'AH0', 'N'], // /ɪnˈtɛnʃən/ — CMU has /tʃ/
  intentions: ['IH0', 'N', 'T', 'EH1', 'N', 'SH', 'AH0', 'N', 'Z'], // /ɪnˈtɛnʃənz/ — CMU has /tʃ/
  tensions: ['T', 'EH1', 'N', 'SH', 'AH0', 'N', 'Z'], // /ˈtɛnʃənz/ — CMU has /tʃ/ (singular is correct)
  mansions: ['M', 'AE1', 'N', 'SH', 'AH0', 'N', 'Z'], // /ˈmænʃənz/ — CMU has /tʃ/ (singular is correct)
  abstention: ['AH0', 'B', 'S', 'T', 'EH1', 'N', 'SH', 'AH0', 'N'], // /əbˈstɛnʃən/ — CMU has /tʃ/
  abstentions: ['AH0', 'B', 'S', 'T', 'EH1', 'N', 'SH', 'AH0', 'N', 'Z'], // /əbˈstɛnʃənz/ — CMU has /tʃ/
  contravention: ['K', 'AA2', 'N', 'T', 'R', 'AH0', 'V', 'EH1', 'N', 'SH', 'AH0', 'N'], // /ˌkɑntrəˈvɛnʃən/ — CMU has /tʃ/
  inattention: ['IH2', 'N', 'AH0', 'T', 'EH1', 'N', 'SH', 'AH0', 'N'], // /ˌɪnəˈtɛnʃən/ — CMU has /tʃ/
  circumvention: ['S', 'ER2', 'K', 'AH0', 'M', 'V', 'EH1', 'N', 'SH', 'AH0', 'N'], // /ˌsɝkəmˈvɛnʃən/ — CMU has /tʃ/
  conscientiously: ['K', 'AA2', 'N', 'SH', 'IY0', 'EH1', 'N', 'SH', 'AH0', 'S', 'L', 'IY0'], // /ˌkɑnʃiˈɛnʃəsli/ — CMU has /tʃ/

  // Voicing errors (/s/↔/z/, /θ/↔/ð/)
  presidentially: ['P', 'R', 'EH2', 'Z', 'IH0', 'D', 'EH1', 'N', 'SH', 'AH0', 'L', 'IY0'], // /ˌprɛzɪˈdɛnʃəli/ — CMU has /s/
  resolutely: ['R', 'EH1', 'Z', 'AH0', 'L', 'UW2', 'T', 'L', 'IY0'], // /ˈrɛzəˌlutli/ — CMU has /s/
  ceaselessly: ['S', 'IY1', 'S', 'L', 'AH0', 'S', 'L', 'IY0'], // /ˈsisləsli/ — CMU has /z/
  reschedulings: ['R', 'IY0', 'S', 'K', 'EH1', 'JH', 'UW0', 'L', 'IH0', 'NG', 'Z'], // /riˈskɛdʒulɪŋz/ — CMU has /ʃ/ (British)
  withdrawals: ['W', 'IH0', 'DH', 'D', 'R', 'AO1', 'AH0', 'L', 'Z'], // /wɪðˈdrɔəlz/ — CMU has /θ/

  // Wrong consonant
  fraudulently: ['F', 'R', 'AO1', 'JH', 'AH0', 'L', 'AH0', 'N', 'T', 'L', 'IY0'], // /ˈfrɔdʒələntli/ — CMU has /d/
  haphazardly: ['HH', 'AE0', 'P', 'HH', 'AE1', 'Z', 'ER0', 'D', 'L', 'IY0'], // /hæpˈhæzɝdli/ — CMU has /f/
  engenders: ['EH0', 'N', 'JH', 'EH1', 'N', 'D', 'ER0', 'Z'], // /ɛnˈdʒɛndɝz/ — CMU has /ŋɡ/
  thyme: ['T', 'AY1', 'M'], // /taɪm/ — CMU has /θ/, but h is silent
  grandma: ['G', 'R', 'AE1', 'N', 'M', 'AA2'], // /ˈɡrænˌmɑ/ — CMU has spurious /d/
  actuator: ['AE1', 'K', 'CH', 'UW0', 'EY2', 'T', 'ER0'], // /ˈæktʃuˌeɪtɝ/ — CMU has /tj/
  actuators: ['AE1', 'K', 'CH', 'UW0', 'EY2', 'T', 'ER0', 'Z'], // /ˈæktʃuˌeɪtɝz/ — CMU has /tj/

  // Missing phoneme
  forgings: ['F', 'AO1', 'R', 'JH', 'IH0', 'NG', 'Z'], // /ˈfɔrdʒɪŋz/ — CMU missing /r/
  headquartered: ['HH', 'EH1', 'D', 'K', 'W', 'AO2', 'R', 'T', 'ER0', 'D'], // /ˈhɛdˌkwɔrtɝd/ — CMU missing /w/
  unknowns: ['AH0', 'N', 'N', 'OW1', 'N', 'Z'], // /ənˈnoʊnz/ — CMU missing second /n/
  convulsant: ['K', 'AH0', 'N', 'V', 'AH1', 'L', 'S', 'AH0', 'N', 'T'], // /kənˈvʌlsənt/ — CMU missing /n/
  temptation: ['T', 'EH0', 'M', 'P', 'T', 'EY1', 'SH', 'AH0', 'N'], // /tɛmpˈteɪʃən/ — CMU missing /p/
  temptations: ['T', 'EH0', 'M', 'P', 'T', 'EY1', 'SH', 'AH0', 'N', 'Z'], // /tɛmpˈteɪʃənz/ — CMU missing /p/
  roommate: ['R', 'UW1', 'M', 'M', 'EY2', 'T'], // /ˈrumˌmeɪt/ — CMU missing geminate /mm/
  roommates: ['R', 'UW1', 'M', 'M', 'EY2', 'T', 'S'], // /ˈrumˌmeɪts/ — CMU missing geminate /mm/

  // N→NG + additional vowel fix (N→NG alone handled by normalizeVelarNasal)
  inconclusively: ['IH2', 'NG', 'K', 'AH0', 'NG', 'K', 'L', 'UW1', 'S', 'IH0', 'V', 'L', 'IY0'], // /ˌɪŋkəŋˈklusɪvli/ — CMU has /nk/

  // ---------------------------------------------------------------------------
  // CMU corrections — wrong vowel or glide
  // ---------------------------------------------------------------------------

  // Spurious /j/ glide (British /juː/ where AmE uses /uː/)
  duplication: ['D', 'UW2', 'P', 'L', 'AH0', 'K', 'EY1', 'SH', 'AH0', 'N'], // /ˌdupləˈkeɪʃən/ — CMU has /dju/
  duplicates: ['D', 'UW1', 'P', 'L', 'AH0', 'K', 'EY2', 'T', 'S'], // /ˈdupləˌkeɪts/ — CMU has /dju/
  tuition: ['T', 'UW0', 'IH1', 'SH', 'AH0', 'N'], // /tuˈɪʃən/ — CMU has /tju/
  alienate: ['EY1', 'L', 'IY0', 'AH0', 'N', 'EY2', 'T'], // /ˈeɪliəˌneɪt/ — CMU has /j/ for /i/
  leniently: ['L', 'IY1', 'N', 'IY0', 'AH0', 'N', 'T', 'L', 'IY0'], // /ˈliniəntli/ — CMU has /j/ for /i/

  // Wrong vowel
  president: ['P', 'R', 'EH1', 'Z', 'IH0', 'D', 'AH0', 'N', 'T'], // /ˈprɛzɪdənt/ — CMU has /ə/ for /ɪ/ and /ɛ/ for /ə/
  cuckoo: ['K', 'UW1', 'K', 'UW0'], // /ˈkuku/ — CMU has /ʌ/ for first vowel
  finagle: ['F', 'IH0', 'N', 'EY1', 'G', 'AH0', 'L'], // /fɪˈneɪɡəl/ — CMU has /ə/ for /eɪ/, wrong stress
  nemo: ['N', 'IY1', 'M', 'OW0'], // /ˈnimoʊ/ — CMU has /ɛ/ for /i/
  valium: ['V', 'AE1', 'L', 'IY0', 'AH0', 'M'], // /ˈvæliəm/ — CMU has /eɪ/ for /æ/
  legit: ['L', 'AH0', 'JH', 'IH1', 'T'], // /ləˈdʒɪt/ — CMU has /ɛ/ and wrong stress
  legalese: ['L', 'IY2', 'G', 'AH0', 'L', 'IY1', 'Z'], // /ˌliɡəˈliz/ — CMU has /ɛ/, /s/, wrong stress
  bocce: ['B', 'AA1', 'CH', 'IY0'], // /ˈbɑtʃi/ — CMU has /oʊ/ for /ɑ/
  padre: ['P', 'AA1', 'D', 'R', 'EY0'], // /ˈpɑdreɪ/ — CMU has /æ/ for /ɑ/
  africa: ['AE1', 'F', 'R', 'IH0', 'K', 'AH0'], // /ˈæfrɪkə/ — CMU has /ə/ for /ɪ/ and /ɑ/ for /ə/
  abele: ['AH0', 'B', 'IY1', 'L'], // /əˈbil/ — CMU has /ɛ/ for /i/
  revaluations: ['R', 'IY0', 'V', 'AE2', 'L', 'Y', 'UW0', 'EY1', 'SH', 'AH0', 'N', 'Z'], // /riˌvæljueɪʃənz/ — CMU has extra /ɪ/
  ow: ['AW1'], // /aʊ/ — CMU has /oʊ/

  // ---------------------------------------------------------------------------
  // CMU corrections — wrong word sense or incomplete entry
  // ---------------------------------------------------------------------------

  buffet: ['B', 'AH0', 'F', 'EY1'], // /bʌˈfeɪ/ — CMU has verb "to strike", should be noun (food)
  fiancee: ['F', 'IY0', 'AA0', 'N', 'S', 'EY1'], // /fiɑnˈseɪ/ — CMU has wrong final syllable
  hors: ['AO1', 'R'], // /ɔr/ — CMU wrong; French: silent h and s (hors d'oeuvres)
  touche: ['T', 'UW0', 'SH', 'EY1'], // /tuˈʃeɪ/ — CMU missing final syllable

  // ---------------------------------------------------------------------------
  // CMU corrections — variant ordering (v1 wrong for standard AmE)
  // ---------------------------------------------------------------------------

  // Days of the week: CMU v1 has /i/ but standard AmE uses /eɪ/
  friday: ['F', 'R', 'AY1', 'D', 'EY2'], // /ˈfraɪˌdeɪ/
  monday: ['M', 'AH1', 'N', 'D', 'EY2'], // /ˈmʌnˌdeɪ/
  saturday: ['S', 'AE1', 'T', 'ER0', 'D', 'EY2'], // /ˈsætɝˌdeɪ/
  tuesday: ['T', 'UW1', 'Z', 'D', 'EY2'], // /ˈtuzˌdeɪ/
  wednesday: ['W', 'EH1', 'N', 'Z', 'D', 'EY2'], // /ˈwɛnzˌdeɪ/

  // Accented homographs: diacritics signal a different word than CMU's default
  résumé: ['R', 'EH1', 'Z', 'AH0', 'M', 'EY2'], // /ˈrɛzəˌmeɪ/ — French noun (CV), not verb "to resume"
  exposé: ['EH2', 'K', 'S', 'P', 'OW0', 'Z', 'EY1'], // /ˌɛkspoʊˈzeɪ/ — French noun (report), not verb "to expose"

  // ---------------------------------------------------------------------------
  // Additions — words not in CMU dictionary
  // ---------------------------------------------------------------------------

  // Abbreviations
  vs: ['V', 'ER1', 'S', 'AH0', 'S'], // /ˈvɝsəs/
  devs: ['D', 'EH1', 'V', 'Z'], // /dɛvz/

  // Tech terms
  async: ['EY1', 'S', 'IH0', 'NG', 'K'], // /ˈeɪsɪŋk/
  blog: ['B', 'L', 'AO1', 'G'], // /blɔɡ/
  chatgpt: ['CH', 'AE1', 'T', 'JH', 'IY1', 'P', 'IY1', 'T', 'IY1'], // /tʃæt dʒi pi ti/
  emoji: ['IH0', 'M', 'OW1', 'JH', 'IY0'], // /ɪˈmoʊdʒi/
  git: ['G', 'IH1', 'T'], // /ɡɪt/
  github: ['G', 'IH1', 'T', 'HH', 'AH1', 'B'], // /ˈɡɪtˌhʌb/
  localhost: ['L', 'OW1', 'K', 'AH0', 'L', 'HH', 'OW2', 'S', 'T'], // /ˈloʊkəlˌhoʊst/
  meme: ['M', 'IY1', 'M'], // /mim/
  npm: ['EH1', 'N', 'P', 'IY1', 'EH1', 'M'], // /ɛn pi ɛm/
  oauth: ['OW1', 'AO1', 'TH'], // /oʊɔθ/
  podcast: ['P', 'AA1', 'D', 'K', 'AE2', 'S', 'T'], // /ˈpɑdˌkæst/
  sudo: ['S', 'UW1', 'D', 'OW0'], // /ˈsudoʊ/
  vlog: ['V', 'L', 'AO1', 'G'], // /vlɔɡ/
  webpack: ['W', 'EH1', 'B', 'P', 'AE1', 'K'], // /ˈwɛbˌpæk/

  // Foreign loanwords
  brulee: ['B', 'R', 'UW0', 'L', 'EY1'], // /bruˈleɪ/
  doppelganger: ['D', 'AA1', 'P', 'AH0', 'L', 'G', 'AE2', 'NG', 'ER0'], // /ˈdɑpəlˌɡæŋɝ/
  flambe: ['F', 'L', 'AA0', 'M', 'B', 'EY1'], // /flɑmˈbeɪ/
  gestalt: ['G', 'AH0', 'SH', 'T', 'AA1', 'L', 'T'], // /ɡəˈʃtɑlt/
  manana: ['M', 'AE0', 'N', 'Y', 'AA1', 'N', 'AH0'], // /mænˈjɑnə/
  negligee: ['N', 'EH1', 'G', 'L', 'AH0', 'ZH', 'EY2'], // /ˈnɛɡləˌʒeɪ/
  patisserie: ['P', 'AH0', 'T', 'IH1', 'S', 'ER0', 'IY0'], // /pəˈtɪsɝi/
  pinata: ['P', 'IH0', 'N', 'Y', 'AA1', 'T', 'AH0'], // /pɪnˈjɑtə/
  soupcon: ['S', 'UW1', 'P', 'S', 'AA0', 'N'], // /ˈsupsɑn/

  // Irregular English words
  chamois: ['SH', 'AE1', 'M', 'IY0'], // /ˈʃæmi/
  cholmondeley: ['CH', 'AH1', 'M', 'L', 'IY0'], // /ˈtʃʌmli/
  drachm: ['D', 'R', 'AE1', 'M'], // /dræm/ — silent ch
  islington: ['IH1', 'Z', 'L', 'IH0', 'NG', 'T', 'AH0', 'N'], // /ˈɪzlɪŋtən/
  obsequies: ['AA1', 'B', 'S', 'IH0', 'K', 'W', 'IY0', 'Z'], // /ˈɑbsɪkwiz/
  oppugnant: ['AH0', 'P', 'AH1', 'G', 'N', 'AH0', 'N', 'T'], // /əˈpʌɡnənt/
  oppugners: ['AH0', 'P', 'Y', 'UW1', 'N', 'ER0', 'Z'], // /əˈpjunɝz/ — silent g
  phaeton: ['F', 'EY1', 'IH0', 'T', 'AH0', 'N'], // /ˈfeɪɪtən/
  piquet: ['P', 'IH0', 'K', 'EY1'], // /pɪˈkeɪ/
  puisne: ['P', 'Y', 'UW1', 'N', 'IY0'], // /ˈpjuni/
  streatham: ['S', 'T', 'R', 'EH1', 'T', 'AH0', 'M'], // /ˈstrɛtəm/
  terpsichore: ['T', 'ER0', 'P', 'S', 'IH1', 'K', 'ER0', 'IY0'], // /tɝpˈsɪkɝi/
  victual: ['V', 'IH1', 'T', 'AH0', 'L'], // /ˈvɪtəl/ — silent c
  victuals: ['V', 'IH1', 'T', 'AH0', 'L', 'Z'], // /ˈvɪtəlz/ — silent c
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
