/**
 * Acronym and initialism handling.
 *
 * Handles words that should be spelled out letter-by-letter
 * (e.g., URL -> "you-are-ell") vs acronyms pronounced as words
 * (e.g., NASA -> "nasa").
 */

import { arpabetToFormat } from '../convert/to-ingglish';
import { INITIALISM_EXPANSIONS } from '../translate/initialisms';
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
 * Known initialisms - derived from INITIALISM_EXPANSIONS for consistency.
 * These are pronounced as individual letters, NOT as words.
 *
 * Excludes acronyms pronounced as words like:
 * - RAM (ram), ROM (rom), GIF (gif/jif), JPEG (jay-peg)
 * - JSON (jason), SQL (sequel), NASA, NATO, SCUBA, LASER
 */
export const KNOWN_INITIALISMS = new Set(Object.keys(INITIALISM_EXPANSIONS));

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
