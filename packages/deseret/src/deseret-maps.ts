/**
 * ARPAbet to Deseret alphabet mappings.
 *
 * The Deseret alphabet (𐐔𐐯𐑅𐐨𐑉𐐯𐐻) was developed in the 1850s
 * at the University of Deseret (now University of Utah).
 * Unicode range: U+10400–U+1044F (uppercase U+10400–U+10427, lowercase U+10428–U+1044F).
 * We use lowercase throughout.
 */

/**
 * ARPAbet consonants to Deseret letters.
 */
export const DESERET_CONSONANT_MAP: Record<string, string> = {
  B: '𐐺', // U+1043A Bee
  CH: '𐐽', // U+1043D Chee
  D: '𐐼', // U+1043C Dee
  DH: '𐑄', // U+10444 Thee
  F: '𐑁', // U+10441 Ef
  G: '𐑀', // U+10440 Gay
  HH: '𐐸', // U+10438 H
  JH: '𐐾', // U+1043E Jee
  K: '𐐿', // U+1043F Kay
  L: '𐑊', // U+1044A El
  M: '𐑋', // U+1044B Em
  N: '𐑌', // U+1044C En
  NG: '𐑍', // U+1044D Eng
  P: '𐐹', // U+10439 Pee
  R: '𐑉', // U+10449 Er
  S: '𐑅', // U+10445 Es
  SH: '𐑇', // U+10447 Esh
  T: '𐐻', // U+1043B Tee
  TH: '𐑃', // U+10443 Eth
  V: '𐑂', // U+10442 Vee
  W: '𐐶', // U+10436 Wu
  Y: '𐐷', // U+10437 Yee
  Z: '𐑆', // U+10446 Zee
  ZH: '𐑈', // U+10448 Zhee
};

/**
 * ARPAbet vowels to Deseret letters.
 *
 * AH is stress-dependent:
 * - AH0 (unstressed) → 𐐱 (short ah / schwa)
 * - AH1/AH2 (stressed) → 𐐲 (short o / strut)
 *
 * ER maps to two characters:
 * - ER0 → 𐐱𐑉 (schwa + er)
 * - ER1/ER2 → 𐐲𐑉 (strut + er)
 */
export const DESERET_VOWEL_MAP: Record<string, string> = {
  AA: '𐐪', // U+1042A Long A (palm)
  AE: '𐐰', // U+10430 Short A (trap)
  AH: '𐐲', // U+10432 Short O (strut, stressed default)
  AO: '𐐫', // U+1042B Long Ah (thought)
  AW: '𐐵', // U+10435 Ow (mouth)
  // Diphthongs
  AY: '𐐴', // U+10434 Ay (price)
  EH: '𐐯', // U+1042F Short E (dress)
  EY: '𐐩', // U+10429 Long E (face)
  IH: '𐐮', // U+1042E Short I (kit)
  IY: '𐐨', // U+10428 Long I (fleece)
  OW: '𐐬', // U+1042C Long O (goat)

  OY: '𐑎', // U+1044E Oi (choice)
  UH: '𐐳', // U+10433 Short Oo (foot)
  UW: '𐐭', // U+1042D Long Oo (goose)
};

/**
 * Deseret schwa (unstressed AH0).
 */
export const DESERET_SCHWA = '𐐱'; // U+10431 Short Ah

/**
 * Deseret Ew letter for Y+UW sequence.
 */
export const DESERET_EW = '𐑏'; // U+1044F Ew (/juː/)

/**
 * Combined ARPAbet to Deseret map (excluding stress-dependent AH/ER).
 */
export const ARPABET_TO_DESERET_MAP: Record<string, string> = {
  ...DESERET_VOWEL_MAP,
  ...DESERET_CONSONANT_MAP,
};

/**
 * Reverse map: Deseret letter → ARPAbet phoneme(s).
 */
export const DESERET_TO_ARPABET_MAP: Record<string, string[]> = {
  // Long vowels
  '𐐨': ['IY'],
  '𐐩': ['EY'],
  '𐐪': ['AA'],
  '𐐫': ['AO'],
  '𐐬': ['OW'],
  '𐐭': ['UW'],

  // Short vowels
  '𐐮': ['IH'],
  '𐐯': ['EH'],
  '𐐰': ['AE'],
  '𐐱': ['AH'],
  '𐐲': ['AH'],
  '𐐳': ['UH'],

  // Diphthongs
  '𐐴': ['AY'],
  '𐐵': ['AW'],
  // Consonants
  '𐐶': ['W'],

  '𐐷': ['Y'],

  '𐐸': ['HH'],
  '𐐹': ['P'],
  '𐐺': ['B'],
  '𐐻': ['T'],
  '𐐼': ['D'],
  '𐐽': ['CH'],
  '𐐾': ['JH'],
  '𐐿': ['K'],
  '𐑀': ['G'],
  '𐑁': ['F'],
  '𐑂': ['V'],
  '𐑃': ['TH'],
  '𐑄': ['DH'],
  '𐑅': ['S'],
  '𐑆': ['Z'],
  '𐑇': ['SH'],
  '𐑈': ['ZH'],
  '𐑉': ['R'],
  '𐑊': ['L'],
  '𐑋': ['M'],
  '𐑌': ['N'],
  '𐑍': ['NG'],
  '𐑎': ['OY'],
  // Ew (expands to Y + UW)
  '𐑏': ['Y', 'UW'],
};
