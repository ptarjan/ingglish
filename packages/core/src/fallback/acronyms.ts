/**
 * Acronym and initialism handling.
 *
 * Handles words that should be spelled out letter-by-letter
 * (e.g., URL -> "you-are-ell") vs acronyms pronounced as words
 * (e.g., NASA -> "nasa").
 */

import { arpabetToFormat } from '../convert/to-ingglish';
import type { OutputFormat } from '../types';

/**
 * Phonemes for individual letters (for spelling out acronyms).
 * Based on how native English speakers pronounce alphabet letters.
 */
export const LETTER_PHONEMES: Record<string, string[]> = {
  a: ['EY1'],
  b: ['B', 'IY1'],
  c: ['S', 'IY1'],
  d: ['D', 'IY1'],
  e: ['IY1'],
  f: ['EH1', 'F'],
  g: ['JH', 'IY1'],
  h: ['EY1', 'CH'],
  i: ['AY1'],
  j: ['JH', 'EY1'],
  k: ['K', 'EY1'],
  l: ['EH1', 'L'],
  m: ['EH1', 'M'],
  n: ['EH1', 'N'],
  o: ['OW1'],
  p: ['P', 'IY1'],
  q: ['K', 'Y', 'UW1'],
  r: ['AA1', 'R'],
  s: ['EH1', 'S'],
  t: ['T', 'IY1'],
  u: ['Y', 'UW1'],
  v: ['V', 'IY1'],
  w: ['D', 'AH1', 'B', 'AH0', 'L', 'Y', 'UW0'],
  x: ['EH1', 'K', 'S'],
  y: ['W', 'AY1'],
  z: ['Z', 'IY1'],
};

/**
 * Initialisms that should be spelled out letter-by-letter.
 * These are pronounced as individual letters, NOT as words.
 *
 * Excludes acronyms pronounced as words like:
 * - RAM (ram), ROM (rom), GIF (gif/jif), JPEG (jay-peg)
 * - JSON (jason), SQL (sequel), NASA, NATO, SCUBA, LASER
 *
 * Lowercase for case-insensitive matching.
 */
export const KNOWN_INITIALISMS = new Set([
  // Tech
  'url', // you-are-ell
  'html', // aych-tee-em-ell
  'css', // see-ess-ess
  'api', // ay-pee-eye
  'http', // aych-tee-tee-pee
  'https', // aych-tee-tee-pee-ess
  'xml', // ex-em-ell
  'php', // pee-aych-pee
  'usb', // you-ess-bee
  'cpu', // see-pee-you
  'gpu', // jee-pee-you
  'ssd', // ess-ess-dee
  'hdd', // aych-dee-dee
  'pdf', // pee-dee-eff
  'svg', // ess-vee-jee
  'ui', // you-eye
  'ux', // you-ex
  'ai', // ay-eye (as in "A.I.", not the word "ai")

  // Business/titles
  'ceo', // see-ee-oh
  'cfo', // see-eff-oh
  'cto', // see-tee-oh
  'vp', // vee-pee
  'hr', // aych-are
  'pr', // pee-are

  // General
  'id', // eye-dee
  'tv', // tee-vee
  'pc', // pee-see
  'dj', // dee-jay
  'mc', // em-see
  'atm', // ay-tee-em
  'gps', // jee-pee-ess
  'fbi', // eff-bee-eye
  'cia', // see-eye-ay
  'dna', // dee-en-ay
  'rna', // are-en-ay
  'faq', // eff-ay-kyoo
  'diy', // dee-eye-why
  'eta', // ee-tee-ay
  'mph', // em-pee-aych
  'rpm', // are-pee-em
  'ac', // ay-see
  'dc', // dee-see
]);

/**
 * Checks if a word should be spelled out as individual letters (initialism).
 * Only returns true for known initialisms - unknown uppercase words are NOT
 * automatically treated as initialisms since they might be acronyms pronounced
 * as words (like NASA, GIF, etc).
 */
export function isInitialism(word: string): boolean {
  const lower = word.toLowerCase();
  return KNOWN_INITIALISMS.has(lower);
}

/**
 * Translates a word by spelling out each letter.
 * Used for acronyms like URL, HTML, API.
 */
export function translateAsAcronym(word: string, format: OutputFormat = 'ingglish'): string {
  const arpabet: string[] = [];
  for (const char of word.toLowerCase()) {
    const letterArpabet = LETTER_PHONEMES[char];
    if (letterArpabet !== undefined) {
      arpabet.push(...letterArpabet);
    }
  }
  return arpabetToFormat(arpabet, format);
}
