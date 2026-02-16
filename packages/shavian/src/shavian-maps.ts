/**
 * ARPAbet to Shavian alphabet mappings.
 *
 * The Shavian alphabet (𐑖𐑱𐑝𐑾𐑯) is an alternative script for English
 * designed by Ronald Kingsley Read for George Bernard Shaw.
 * Unicode range: U+10450–U+1047F.
 */

/**
 * ARPAbet consonants to Shavian letters.
 */
export const SHAVIAN_CONSONANT_MAP: Record<string, string> = {
  P: '𐑐',
  B: '𐑚',
  T: '𐑑',
  D: '𐑛',
  K: '𐑒',
  G: '𐑜',
  F: '𐑓',
  V: '𐑝',
  TH: '𐑔',
  DH: '𐑞',
  S: '𐑕',
  Z: '𐑟',
  SH: '𐑖',
  ZH: '𐑠',
  CH: '𐑗',
  JH: '𐑡',
  M: '𐑥',
  N: '𐑯',
  NG: '𐑙',
  L: '𐑤',
  R: '𐑮',
  W: '𐑢',
  Y: '𐑘',
  HH: '𐑣',
};

/**
 * ARPAbet vowels to Shavian letters.
 *
 * Note: AH is stress-dependent:
 * - AH0 (unstressed) → 𐑩 (schwa / ADO)
 * - AH1/AH2 (stressed) → 𐑳 (strut / UP)
 *
 * ER uses the ligature 𐑻 (nurse / EARL).
 */
export const SHAVIAN_VOWEL_MAP: Record<string, string> = {
  AA: '𐑭', // palm, father
  AE: '𐑨', // trap, cat
  AH: '𐑳', // strut, cup (stressed default)
  AO: '𐑷', // thought, law
  EH: '𐑧', // dress, bed
  ER: '𐑻', // nurse, bird (ligature)
  IH: '𐑦', // kit, sit
  IY: '𐑰', // fleece, see
  UH: '𐑫', // foot, put
  UW: '𐑵', // goose, too

  // Diphthongs
  AW: '𐑬', // mouth, cow
  AY: '𐑲', // price, my
  EY: '𐑱', // face, say
  OW: '𐑴', // goat, go
  OY: '𐑶', // choice, boy
};

/**
 * Combined ARPAbet to Shavian map.
 */
export const ARPABET_TO_SHAVIAN_MAP: Record<string, string> = {
  ...SHAVIAN_VOWEL_MAP,
  ...SHAVIAN_CONSONANT_MAP,
};

/**
 * Shavian schwa (unstressed AH0).
 */
export const SHAVIAN_SCHWA = '𐑩';

/**
 * R-colored vowel ligatures: VOWEL+R → single Shavian letter.
 * These are used when a vowel is followed by R in the ARPAbet sequence.
 */
export const SHAVIAN_R_COLORED: Record<string, string> = {
  AA: '𐑸', // start (AA+R)
  AO: '𐑹', // north/force (AO+R)
  EH: '𐑺', // square (EH+R)
  AH0: '𐑼', // letter (unstressed AH+R)
  IH: '𐑽', // near (IH+R)
};

/**
 * Reverse map: Shavian letter → ARPAbet phoneme(s).
 * Single letters map to a single phoneme, ligatures expand to pairs.
 */
export const SHAVIAN_TO_ARPABET_MAP: Record<string, string[]> = {
  // Consonants
  '𐑐': ['P'],
  '𐑚': ['B'],
  '𐑑': ['T'],
  '𐑛': ['D'],
  '𐑒': ['K'],
  '𐑜': ['G'],
  '𐑓': ['F'],
  '𐑝': ['V'],
  '𐑔': ['TH'],
  '𐑞': ['DH'],
  '𐑕': ['S'],
  '𐑟': ['Z'],
  '𐑖': ['SH'],
  '𐑠': ['ZH'],
  '𐑗': ['CH'],
  '𐑡': ['JH'],
  '𐑥': ['M'],
  '𐑯': ['N'],
  '𐑙': ['NG'],
  '𐑤': ['L'],
  '𐑮': ['R'],
  '𐑢': ['W'],
  '𐑘': ['Y'],
  '𐑣': ['HH'],

  // Vowels
  '𐑭': ['AA'],
  '𐑨': ['AE'],
  '𐑳': ['AH'],
  '𐑷': ['AO'],
  '𐑧': ['EH'],
  '𐑻': ['ER'],
  '𐑦': ['IH'],
  '𐑰': ['IY'],
  '𐑫': ['UH'],
  '𐑵': ['UW'],

  // Diphthongs
  '𐑬': ['AW'],
  '𐑲': ['AY'],
  '𐑱': ['EY'],
  '𐑴': ['OW'],
  '𐑶': ['OY'],

  // Schwa
  '𐑩': ['AH'],

  // R-colored ligatures (expand to vowel + R)
  '𐑸': ['AA', 'R'],
  '𐑹': ['AO', 'R'],
  '𐑺': ['EH', 'R'],
  '𐑼': ['AH', 'R'],
  '𐑽': ['IH', 'R'],
};
