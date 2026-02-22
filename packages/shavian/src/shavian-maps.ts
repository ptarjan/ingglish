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
  B: '𐑚',
  CH: '𐑗',
  D: '𐑛',
  DH: '𐑞',
  F: '𐑓',
  G: '𐑜',
  HH: '𐑣',
  JH: '𐑡',
  K: '𐑒',
  L: '𐑤',
  M: '𐑥',
  N: '𐑯',
  NG: '𐑙',
  P: '𐑐',
  R: '𐑮',
  S: '𐑕',
  SH: '𐑖',
  T: '𐑑',
  TH: '𐑔',
  V: '𐑝',
  W: '𐑢',
  Y: '𐑘',
  Z: '𐑟',
  ZH: '𐑠',
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
  // Diphthongs
  AW: '𐑬', // mouth, cow
  AY: '𐑲', // price, my
  EH: '𐑧', // dress, bed
  ER: '𐑻', // nurse, bird (ligature)
  EY: '𐑱', // face, say
  IH: '𐑦', // kit, sit

  IY: '𐑰', // fleece, see
  OW: '𐑴', // goat, go
  OY: '𐑶', // choice, boy
  UH: '𐑫', // foot, put
  UW: '𐑵', // goose, too
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
  AH0: '𐑼', // letter (unstressed AH+R)
  AO: '𐑹', // north/force (AO+R)
  EH: '𐑺', // square (EH+R)
  IH: '𐑽', // near (IH+R)
};

/**
 * Reverse map: Shavian letter → ARPAbet phoneme(s).
 * Single letters map to a single phoneme, ligatures expand to pairs.
 */
export const SHAVIAN_TO_ARPABET_MAP: Record<string, string[]> = {
  // Consonants
  '𐑐': ['P'],
  '𐑑': ['T'],
  '𐑒': ['K'],
  '𐑓': ['F'],
  '𐑔': ['TH'],
  '𐑕': ['S'],
  '𐑖': ['SH'],
  '𐑗': ['CH'],
  '𐑘': ['Y'],
  '𐑙': ['NG'],
  '𐑚': ['B'],
  '𐑛': ['D'],
  '𐑜': ['G'],
  '𐑝': ['V'],
  '𐑞': ['DH'],
  '𐑟': ['Z'],
  '𐑠': ['ZH'],
  '𐑡': ['JH'],
  '𐑢': ['W'],
  '𐑣': ['HH'],
  '𐑤': ['L'],
  '𐑥': ['M'],
  '𐑦': ['IH'],
  '𐑧': ['EH'],

  '𐑨': ['AE'],
  // Schwa
  '𐑩': ['AH'],
  '𐑫': ['UH'],
  // Diphthongs
  '𐑬': ['AW'],
  // Vowels
  '𐑭': ['AA'],
  '𐑮': ['R'],
  '𐑯': ['N'],
  '𐑰': ['IY'],
  '𐑱': ['EY'],
  '𐑲': ['AY'],

  '𐑳': ['AH'],
  '𐑴': ['OW'],
  '𐑵': ['UW'],
  '𐑶': ['OY'],
  '𐑷': ['AO'],

  // R-colored ligatures (expand to vowel + R)
  '𐑸': ['AA', 'R'],

  '𐑹': ['AO', 'R'],
  '𐑺': ['EH', 'R'],
  '𐑻': ['ER'],
  '𐑼': ['AH', 'R'],
  '𐑽': ['IH', 'R'],
};
