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

  abele: ['AH0', 'B', 'IY1', 'L'], // /əˈbil/ — CMU has /ɛ/ for /i/
  abstention: ['AH0', 'B', 'S', 'T', 'EH1', 'N', 'SH', 'AH0', 'N'], // /əbˈstɛnʃən/ — CMU has /tʃ/
  abstentions: ['AH0', 'B', 'S', 'T', 'EH1', 'N', 'SH', 'AH0', 'N', 'Z'], // /əbˈstɛnʃənz/ — CMU has /tʃ/
  actuator: ['AE1', 'K', 'CH', 'UW0', 'EY2', 'T', 'ER0'], // /ˈæktʃuˌeɪtɝ/ — CMU has /tj/
  actuators: ['AE1', 'K', 'CH', 'UW0', 'EY2', 'T', 'ER0', 'Z'], // /ˈæktʃuˌeɪtɝz/ — CMU has /tj/
  africa: ['AE1', 'F', 'R', 'IH0', 'K', 'AH0'], // /ˈæfrɪkə/ — CMU has /ə/ for /ɪ/ and /ɑ/ for /ə/
  alienate: ['EY1', 'L', 'IY0', 'AH0', 'N', 'EY2', 'T'], // /ˈeɪliəˌneɪt/ — CMU has /j/ for /i/
  // CMU has /s/ instead of /ʃ/ in -ciate/-ciation suffix
  associate: ['AH0', 'S', 'OW1', 'SH', 'IY0', 'AH0', 'T'], // /əˈsoʊʃiˌət/ — CMU has /s/
  associated: ['AH0', 'S', 'OW1', 'SH', 'IY0', 'EY2', 'T', 'IH0', 'D'], // /əˈsoʊʃiˌeɪtɪd/ — CMU has /s/
  associates: ['AH0', 'S', 'OW1', 'SH', 'IY0', 'AH0', 'T', 'S'], // /əˈsoʊʃiˌəts/ — CMU has /s/

  associating: ['AH0', 'S', 'OW1', 'SH', 'IY0', 'EY2', 'T', 'IH0', 'NG'], // /əˈsoʊʃiˌeɪtɪŋ/ — CMU has /s/
  association: ['AH0', 'S', 'OW2', 'SH', 'IY0', 'EY1', 'SH', 'AH0', 'N'], // /əˌsoʊʃiˈeɪʃən/ — CMU has /s/
  associations: ['AH0', 'S', 'OW2', 'SH', 'IY0', 'EY1', 'SH', 'AH0', 'N', 'Z'], // /əˌsoʊʃiˈeɪʃənz/ — CMU has /s/
  // Tech terms
  async: ['EY1', 'S', 'IH0', 'NG', 'K'], // /ˈeɪsɪŋk/
  blog: ['B', 'L', 'AO1', 'G'], // /blɔɡ/
  bocce: ['B', 'AA1', 'CH', 'IY0'], // /ˈbɑtʃi/ — CMU has /oʊ/ for /ɑ/
  // Foreign loanwords
  brulee: ['B', 'R', 'UW0', 'L', 'EY1'], // /bruˈleɪ/

  buffet: ['B', 'AH0', 'F', 'EY1'], // /bʌˈfeɪ/ — CMU has verb "to strike", should be noun (food)
  ceaselessly: ['S', 'IY1', 'S', 'L', 'AH0', 'S', 'L', 'IY0'], // /ˈsisləsli/ — CMU has /z/
  // Irregular English words
  chamois: ['SH', 'AE1', 'M', 'IY0'], // /ˈʃæmi/
  chatgpt: ['CH', 'AE1', 'T', 'JH', 'IY1', 'P', 'IY1', 'T', 'IY1'], // /tʃæt dʒi pi ti/
  cholmondeley: ['CH', 'AH1', 'M', 'L', 'IY0'], // /ˈtʃʌmli/
  circumvention: ['S', 'ER2', 'K', 'AH0', 'M', 'V', 'EH1', 'N', 'SH', 'AH0', 'N'], // /ˌsɝkəmˈvɛnʃən/ — CMU has /tʃ/
  close: ['K', 'L', 'OW1', 'Z'], // /kloʊz/ — CMU default is adjective /kloʊs/

  conscientiously: ['K', 'AA2', 'N', 'SH', 'IY0', 'EH1', 'N', 'SH', 'AH0', 'S', 'L', 'IY0'], // /ˌkɑnʃiˈɛnʃəsli/ — CMU has /tʃ/
  contravention: ['K', 'AA2', 'N', 'T', 'R', 'AH0', 'V', 'EH1', 'N', 'SH', 'AH0', 'N'], // /ˌkɑntrəˈvɛnʃən/ — CMU has /tʃ/
  convulsant: ['K', 'AH0', 'N', 'V', 'AH1', 'L', 'S', 'AH0', 'N', 'T'], // /kənˈvʌlsənt/ — CMU missing /n/
  // Inconsistent vowel in derived form
  coughed: ['K', 'AA1', 'F', 'T'], // /kɑft/ — CMU has /ɔ/ (AO), should match cough's /ɑ/ (AA)
  coughs: ['K', 'AA1', 'F', 'S'], // /kɑfs/ — CMU has /ɔ/ (AO), should match cough's /ɑ/ (AA)
  cuckoo: ['K', 'UW1', 'K', 'UW0'], // /ˈkuku/ — CMU has /ʌ/ for first vowel
  // Wrong vowel
  dedicate: ['D', 'EH1', 'D', 'IH0', 'K', 'EY2', 'T'], // /ˈdɛdɪˌkeɪt/ — CMU has /ə/ for /ɪ/
  dedicated: ['D', 'EH1', 'D', 'IH0', 'K', 'EY0', 'T', 'IH0', 'D'], // /ˈdɛdɪkeɪtɪd/ — CMU has /ə/ for /ɪ/
  dedication: ['D', 'EH2', 'D', 'IH0', 'K', 'EY1', 'SH', 'AH0', 'N'], // /ˌdɛdɪˈkeɪʃən/ — CMU has /ə/ for /ɪ/
  // Wrong consonant in derived form
  deliciously: ['D', 'IH0', 'L', 'IH1', 'SH', 'AH0', 'S', 'L', 'IY0'], // /dɪˈlɪʃəsli/ — CMU has /ʃ/ for final /s/
  devs: ['D', 'EH1', 'V', 'Z'], // /dɛvz/
  // Wrong syllable count
  doer: ['D', 'UW1', 'ER0'], // /ˈduɝ/ — CMU has 1 syllable (D UW1 R), should be 2 like doers

  doppelganger: ['D', 'AA1', 'P', 'AH0', 'L', 'G', 'AE2', 'NG', 'ER0'], // /ˈdɑpəlˌɡæŋɝ/
  drachm: ['D', 'R', 'AE1', 'M'], // /dræm/ — silent ch

  // Spurious /j/ glide (British /juː/ where AmE uses /uː/)
  dudes: ['D', 'UW1', 'D', 'Z'], // /duːdz/ — CMU has /dju/, should match dude's /du/
  duplicates: ['D', 'UW1', 'P', 'L', 'AH0', 'K', 'EY2', 'T', 'S'], // /ˈdupləˌkeɪts/ — CMU has /dju/

  duplication: ['D', 'UW2', 'P', 'L', 'AH0', 'K', 'EY1', 'SH', 'AH0', 'N'], // /ˌdupləˈkeɪʃən/ — CMU has /dju/
  emoji: ['IH0', 'M', 'OW1', 'JH', 'IY0'], // /ɪˈmoʊdʒi/
  engenders: ['EH0', 'N', 'JH', 'EH1', 'N', 'D', 'ER0', 'Z'], // /ɛnˈdʒɛndɝz/ — CMU has /ŋɡ/
  excruciatingly: [
    'EH2',
    'K',
    'S',
    'K',
    'R',
    'UW1',
    'SH',
    'IY0',
    'EY2',
    'T',
    'IH0',
    'NG',
    'L',
    'IY0',
  ], // /ɪkˈskruʃiˌeɪtɪŋli/ — CMU has /s/ (excruciating is correct)
  exposé: ['EH2', 'K', 'S', 'P', 'OW0', 'Z', 'EY1'], // /ˌɛkspoʊˈzeɪ/ — French noun (report), not verb "to expose"
  fiancee: ['F', 'IY0', 'AA0', 'N', 'S', 'EY1'], // /fiɑnˈseɪ/ — CMU has wrong final syllable
  finagle: ['F', 'IH0', 'N', 'EY1', 'G', 'AH0', 'L'], // /fɪˈneɪɡəl/ — CMU has /ə/ for /eɪ/, wrong stress
  flambe: ['F', 'L', 'AA0', 'M', 'B', 'EY1'], // /flɑmˈbeɪ/

  // Missing phoneme
  forgings: ['F', 'AO1', 'R', 'JH', 'IH0', 'NG', 'Z'], // /ˈfɔrdʒɪŋz/ — CMU missing /r/

  fraudulently: ['F', 'R', 'AO1', 'JH', 'AH0', 'L', 'AH0', 'N', 'T', 'L', 'IY0'], // /ˈfrɔdʒələntli/ — CMU has /d/

  // ---------------------------------------------------------------------------
  // CMU corrections — wrong vowel or glide
  // ---------------------------------------------------------------------------

  // Days of the week: CMU v1 has /i/ but standard AmE uses /eɪ/
  friday: ['F', 'R', 'AY1', 'D', 'EY2'], // /ˈfraɪˌdeɪ/
  gestalt: ['G', 'AH0', 'SH', 'T', 'AA1', 'L', 'T'], // /ɡəˈʃtɑlt/
  git: ['G', 'IH1', 'T'], // /ɡɪt/
  github: ['G', 'IH1', 'T', 'HH', 'AH1', 'B'], // /ˈɡɪtˌhʌb/
  grandma: ['G', 'R', 'AE1', 'N', 'M', 'AA2'], // /ˈɡrænˌmɑ/ — CMU has spurious /d/
  haphazardly: ['HH', 'AE0', 'P', 'HH', 'AE1', 'Z', 'ER0', 'D', 'L', 'IY0'], // /hæpˈhæzɝdli/ — CMU has /f/

  headquartered: ['HH', 'EH1', 'D', 'K', 'W', 'AO2', 'R', 'T', 'ER0', 'D'], // /ˈhɛdˌkwɔrtɝd/ — CMU missing /w/
  hors: ['AO1', 'R'], // /ɔr/ — CMU wrong; French: silent h and s (hors d'oeuvres)

  immature: ['IH2', 'M', 'AH0', 'CH', 'UH1', 'R'], // /ˌɪməˈtʃʊr/ — CMU has /tj/ (British), should match mature's /tʃ/
  inattention: ['IH2', 'N', 'AH0', 'T', 'EH1', 'N', 'SH', 'AH0', 'N'], // /ˌɪnəˈtɛnʃən/ — CMU has /tʃ/
  // N→NG + additional vowel fix (N→NG alone handled by normalizeVelarNasal)
  inconclusively: ['IH2', 'NG', 'K', 'AH0', 'NG', 'K', 'L', 'UW1', 'S', 'IH0', 'V', 'L', 'IY0'], // /ˌɪŋkəŋˈklusɪvli/ — CMU has /nk/
  // CMU has /tʃ/ instead of /ʃ/ in -tion/-sion suffix after N
  intention: ['IH0', 'N', 'T', 'EH1', 'N', 'SH', 'AH0', 'N'], // /ɪnˈtɛnʃən/ — CMU has /tʃ/
  intentions: ['IH0', 'N', 'T', 'EH1', 'N', 'SH', 'AH0', 'N', 'Z'], // /ɪnˈtɛnʃənz/ — CMU has /tʃ/
  islington: ['IH1', 'Z', 'L', 'IH0', 'NG', 'T', 'AH0', 'N'], // /ˈɪzlɪŋtən/
  lead: ['L', 'IY1', 'D'], // /liːd/ — CMU default is metal /lɛd/
  legalese: ['L', 'IY2', 'G', 'AH0', 'L', 'IY1', 'Z'], // /ˌliɡəˈliz/ — CMU has /ɛ/, /s/, wrong stress
  legit: ['L', 'AH0', 'JH', 'IH1', 'T'], // /ləˈdʒɪt/ — CMU has /ɛ/ and wrong stress
  leisure: ['L', 'IY1', 'ZH', 'ER0'], // /ˈliʒɝ/ — CMU has British /ɛ/, AmE is /i/
  leniently: ['L', 'IY1', 'N', 'IY0', 'AH0', 'N', 'T', 'L', 'IY0'], // /ˈliniəntli/ — CMU has /j/ for /i/
  live: ['L', 'IH1', 'V'], // /lɪv/ — CMU default is adjective /laɪv/
  localhost: ['L', 'OW1', 'K', 'AH0', 'L', 'HH', 'OW2', 'S', 'T'], // /ˈloʊkəlˌhoʊst/
  manana: ['M', 'AE0', 'N', 'Y', 'AA1', 'N', 'AH0'], // /mænˈjɑnə/
  mansions: ['M', 'AE1', 'N', 'SH', 'AH0', 'N', 'Z'], // /ˈmænʃənz/ — CMU has /tʃ/ (singular is correct)
  matured: ['M', 'AH0', 'CH', 'UH1', 'R', 'D'], // /məˈtʃʊrd/ — CMU has /tj/ (British), should match mature's /tʃ/
  meme: ['M', 'IY1', 'M'], // /mim/
  monday: ['M', 'AH1', 'N', 'D', 'EY2'], // /ˈmʌnˌdeɪ/
  negligee: ['N', 'EH1', 'G', 'L', 'AH0', 'ZH', 'EY2'], // /ˈnɛɡləˌʒeɪ/

  // ---------------------------------------------------------------------------
  // CMU corrections — wrong word sense or incomplete entry
  // ---------------------------------------------------------------------------

  nemo: ['N', 'IY1', 'M', 'OW0'], // /ˈnimoʊ/ — CMU has /ɛ/ for /i/
  npm: ['EH1', 'N', 'P', 'IY1', 'EH1', 'M'], // /ɛn pi ɛm/
  oauth: ['OW1', 'AO1', 'TH'], // /oʊɔθ/
  obsequies: ['AA1', 'B', 'S', 'IH0', 'K', 'W', 'IY0', 'Z'], // /ˈɑbsɪkwiz/

  // ---------------------------------------------------------------------------
  // CMU corrections — variant ordering (v1 wrong for standard AmE)
  // ---------------------------------------------------------------------------

  oppugnant: ['AH0', 'P', 'AH1', 'G', 'N', 'AH0', 'N', 'T'], // /əˈpʌɡnənt/
  oppugners: ['AH0', 'P', 'Y', 'UW1', 'N', 'ER0', 'Z'], // /əˈpjunɝz/ — silent g
  ow: ['AW1'], // /aʊ/ — CMU has /oʊ/
  padre: ['P', 'AA1', 'D', 'R', 'EY0'], // /ˈpɑdreɪ/ — CMU has /æ/ for /ɑ/
  patisserie: ['P', 'AH0', 'T', 'IH1', 'S', 'ER0', 'IY0'], // /pəˈtɪsɝi/

  phaeton: ['F', 'EY1', 'IH0', 'T', 'AH0', 'N'], // /ˈfeɪɪtən/
  pinata: ['P', 'IH0', 'N', 'Y', 'AA1', 'T', 'AH0'], // /pɪnˈjɑtə/
  piquet: ['P', 'IH0', 'K', 'EY1'], // /pɪˈkeɪ/
  podcast: ['P', 'AA1', 'D', 'K', 'AE2', 'S', 'T'], // /ˈpɑdˌkæst/
  potshots: ['P', 'AA1', 'SH', 'AA2', 'T', 'S'], // /ˈpɑtˌʃɑts/ — CMU has /tʃ/, should match potshot's /ʃ/
  president: ['P', 'R', 'EH1', 'Z', 'IH0', 'D', 'AH0', 'N', 'T'], // /ˈprɛzɪdənt/ — CMU has /ə/ for /ɪ/ and /ɛ/ for /ə/
  // Voicing errors (/s/↔/z/, /θ/↔/ð/)
  presidentially: ['P', 'R', 'EH2', 'Z', 'IH0', 'D', 'EH1', 'N', 'SH', 'AH0', 'L', 'IY0'], // /ˌprɛzɪˈdɛnʃəli/ — CMU has /s/

  privatize: ['P', 'R', 'AY1', 'V', 'AH0', 'T', 'AY2', 'Z'], // /ˈpraɪvəˌtaɪz/ — CMU has /ɪ/ for /aɪ/, should match private
  // Silent letter pronounced
  psalm: ['S', 'AA1', 'M'], // /sɑm/ — CMU has /l/, but L is silent in psalm

  // ---------------------------------------------------------------------------
  // Additions — words not in CMU dictionary
  // ---------------------------------------------------------------------------

  psalms: ['S', 'AA1', 'M', 'Z'], // /sɑmz/ — CMU has /l/, but L is silent in psalm
  puisne: ['P', 'Y', 'UW1', 'N', 'IY0'], // /ˈpjuni/

  // Homographs: CMU default is the less common sense
  read: ['R', 'IY1', 'D'], // /riːd/ — CMU default is past tense /rɛd/
  record: ['R', 'EH1', 'K', 'ER0', 'D'], // /ˈrɛkɝd/ — CMU default is verb /rɪˈkɔrd/
  rededicate: ['R', 'IY2', 'D', 'EH1', 'D', 'IH0', 'K', 'EY2', 'T'], // /ˌriˈdɛdɪˌkeɪt/ — CMU has /ə/ for /ɪ/
  rededication: ['R', 'IY0', 'D', 'EH2', 'D', 'IH0', 'K', 'EY1', 'SH', 'AH0', 'N'], // /riˌdɛdɪˈkeɪʃən/ — CMU has /ə/ for /ɪ/
  reschedulings: ['R', 'IY0', 'S', 'K', 'EH1', 'JH', 'UW0', 'L', 'IH0', 'NG', 'Z'], // /riˈskɛdʒulɪŋz/ — CMU has /ʃ/ (British)
  resolutely: ['R', 'EH1', 'Z', 'AH0', 'L', 'UW2', 'T', 'L', 'IY0'], // /ˈrɛzəˌlutli/ — CMU has /s/
  // Accented homographs: diacritics signal a different word than CMU's default
  résumé: ['R', 'EH1', 'Z', 'AH0', 'M', 'EY2'], // /ˈrɛzəˌmeɪ/ — French noun (CV), not verb "to resume"
  revaluations: ['R', 'IY0', 'V', 'AE2', 'L', 'Y', 'UW0', 'EY1', 'SH', 'AH0', 'N', 'Z'], // /riˌvæljueɪʃənz/ — CMU has extra /ɪ/
  roommate: ['R', 'UW1', 'M', 'M', 'EY2', 'T'], // /ˈrumˌmeɪt/ — CMU missing geminate /mm/
  roommates: ['R', 'UW1', 'M', 'M', 'EY2', 'T', 'S'], // /ˈrumˌmeɪts/ — CMU missing geminate /mm/
  saturday: ['S', 'AE1', 'T', 'ER0', 'D', 'EY2'], // /ˈsætɝˌdeɪ/
  soupcon: ['S', 'UW0', 'P', 'S', 'AA1', 'N'], // /supˈsɑn/
  streatham: ['S', 'T', 'R', 'EH1', 'T', 'AH0', 'M'], // /ˈstrɛtəm/
  sudo: ['S', 'UW1', 'D', 'OW0'], // /ˈsudoʊ/

  temptation: ['T', 'EH0', 'M', 'P', 'T', 'EY1', 'SH', 'AH0', 'N'], // /tɛmpˈteɪʃən/ — CMU missing /p/
  temptations: ['T', 'EH0', 'M', 'P', 'T', 'EY1', 'SH', 'AH0', 'N', 'Z'], // /tɛmpˈteɪʃənz/ — CMU missing /p/
  tensions: ['T', 'EH1', 'N', 'SH', 'AH0', 'N', 'Z'], // /ˈtɛnʃənz/ — CMU has /tʃ/ (singular is correct)
  terpsichore: ['T', 'ER0', 'P', 'S', 'IH1', 'K', 'ER0', 'IY0'], // /tɝpˈsɪkɝi/
  // Missing contracted "is" — "this'" = "this is", needs epenthetic /əz/ since base ends in /s/
  "this'": ['DH', 'IH1', 'S', 'AH0', 'Z'], // /ðɪsəz/ — CMU has /ðɪs/ (same as "this", missing "is")
  thyme: ['T', 'AY1', 'M'], // /taɪm/ — CMU has /θ/, but h is silent
  touche: ['T', 'UW0', 'SH', 'EY1'], // /tuˈʃeɪ/ — CMU missing final syllable
  tuesday: ['T', 'UW1', 'Z', 'D', 'EY2'], // /ˈtuzˌdeɪ/
  tuition: ['T', 'UW0', 'IH1', 'SH', 'AH0', 'N'], // /tuˈɪʃən/ — CMU has /tju/

  unknowns: ['AH0', 'N', 'N', 'OW1', 'N', 'Z'], // /ənˈnoʊnz/ — CMU missing second /n/
  use: ['Y', 'UW1', 'Z'], // /juːz/ — CMU default is noun /juːs/
  valium: ['V', 'AE1', 'L', 'IY0', 'AH0', 'M'], // /ˈvæliəm/ — CMU has /eɪ/ for /æ/
  victual: ['V', 'IH1', 'T', 'AH0', 'L'], // /ˈvɪtəl/ — silent c
  victuals: ['V', 'IH1', 'T', 'AH0', 'L', 'Z'], // /ˈvɪtəlz/ — silent c
  vlog: ['V', 'L', 'AO1', 'G'], // /vlɔɡ/
  // Abbreviations
  vs: ['V', 'ER1', 'S', 'AH0', 'S'], // /ˈvɝsəs/
  webpack: ['W', 'EH1', 'B', 'P', 'AE1', 'K'], // /ˈwɛbˌpæk/
  wednesday: ['W', 'EH1', 'N', 'Z', 'D', 'EY2'], // /ˈwɛnzˌdeɪ/
  'well-doer': ['W', 'EH1', 'L', 'D', 'UW1', 'ER0'], // /ˈwɛlˌduɝ/ — CMU has 1-syllable doer
  wind: ['W', 'IH1', 'N', 'D'], // /wɪnd/ — CMU default is verb /waɪnd/
  withdrawals: ['W', 'IH0', 'DH', 'D', 'R', 'AO1', 'AH0', 'L', 'Z'], // /wɪðˈdrɔəlz/ — CMU has /θ/
  withdrawing: ['W', 'IH0', 'DH', 'D', 'R', 'AO1', 'IH0', 'NG'], // /wɪðˈdrɔɪŋ/ — CMU has /θ/
  withdrawn: ['W', 'IH0', 'DH', 'D', 'R', 'AO1', 'N'], // /wɪðˈdrɔn/ — CMU has /θ/
};

// Private Map for fast, prototype-safe lookup (avoids hasOwnProperty per call)
const CUSTOM_MAP = new Map<string, string[]>(Object.entries(CUSTOM_PRONUNCIATIONS));

/**
 * Gets custom pronunciation for a word.
 * @param word The word to look up (should be lowercase for best performance)
 */
export function getCustomPronunciation(word: string): string[] | undefined {
  return CUSTOM_MAP.get(word);
}

/**
 * Checks if a word has a custom pronunciation.
 * @param word The word to look up (should be lowercase for best performance)
 */
export function hasCustomPronunciation(word: string): boolean {
  return CUSTOM_MAP.has(word);
}
