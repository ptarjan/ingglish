/**
 * Ingglish to ARPAbet conversion.
 *
 * Used to parse Ingglish spellings back to ARPAbet phonemes
 * for reverse translation (Ingglish -> English).
 */

import {
  INGGLISH_TO_ARPABET_MAP,
  R_COLORED_REVERSE_2CHAR,
  R_COLORED_REVERSE_3CHAR,
} from './ingglish-maps';

// ============================================================================
// ARPAbet Alternatives (handling ambiguous spellings)
// ============================================================================

/**
 * Some Ingglish spellings are ambiguous because the same letters can
 * represent different ARPAbet sequences. For example, "er" could be:
 * - ER (r-colored schwa): "bird", "her"
 * - EH + R (short e + r): "welfare", "better"
 *
 * Only EH + R is valid here because IH + R -> "eer" and AH + R -> "ur"
 *
 * AE/AH ambiguity: unstressed schwa (AH0) maps to 'a', same as AE (cat).
 * Reverse parser gets AE from the map; AH alternative covers schwa words.
 */
// A morpheme-junction consonant/vowel + H spells as a digraph but is really two
// phonemes — mirrors SH→S+HH: "adhere" (D+HH) parses as DH, "althaus" (T+HH) as
// TH, "clotheshorse"/"alzheimer" (Z+HH) as ZH, "aho" (AA+HH) as OW. And "aw"
// greedily parses as AO but at a schwa+glide junction is AH+W ("agawam").
const ARPABET_ALTERNATIVES: Record<string, string[][]> = {
  AE: [['AH']], // "a" could be AE (cat) or AH (schwa: about, the)
  AO: [['AH', 'W']],
  DH: [['D', 'HH']],
  ER: [['EH', 'R']],
  OW: [['AA', 'HH']],
  SH: [['S', 'HH']], // "sh" could be SH (ship) or S+HH (exhume)
  TH: [['T', 'HH']],
  ZH: [['Z', 'HH']],
};

/**
 * Contextual (multi-phoneme) alternatives, tried only when the primary parse
 * fails (so genuine AO / EH+R / IH+R words are unaffected):
 * - AO+AE → AH+W+AH: a schwa+glide junction like "-awal" in "usual"
 *   (Y UW ZH AH0 W AH0 L) renders "...zhawal", which greedily parses as
 *   AO ("aw") + AE ("a").
 * - EH+R → AY+R: the spelling "air" covers both EH+R (chair) and AY+R
 *   (admire, expire, esquire); the parser defaults to EH+R.
 * - IH+R → IY+R: the spelling "eer" covers both IH+R (beer) and IY+R
 *   (here, ear, period — CMU is inconsistent before R); the parser
 *   defaults to IH+R.
 */
const ARPABET_SEQUENCE_ALTERNATIVES: { from: string[]; to: string[] }[] = [
  { from: ['AO', 'AE'], to: ['AH', 'W', 'AH'] },
  { from: ['EH', 'R'], to: ['AY', 'R'] },
  { from: ['IH', 'R'], to: ['IY', 'R'] },
];

// Combinatorial safety valve: a word with n ambiguous vowels has 2^n
// variants, so cap the closure. BFS order means the variants closest to
// the primary parse are always kept; only deep combinations get dropped.
const MAX_ALTERNATIVE_VARIANTS = 256;

/**
 * Generates alternative ARPAbet sequences for ambiguous spellings.
 *
 * Computes the closure of all substitution rules (breadth-first, deduped,
 * capped) so alternatives compose:
 * - mixed subsets: "capital" (K AE1 P AH0 T AH0 L) renders "kapatal", which
 *   parses as K AE P AE T AE L — recovering it needs the first AE kept and
 *   the other two replaced with AH
 * - cross-rule composition: "virus" (V AY1 R AH0 S) renders "vairas", which
 *   needs EH+R→AY+R and AE→AH applied together
 *
 * Variants are ordered by number of substitutions (primary first), so
 * callers that scan in order prefer parses closest to the literal spelling.
 */
export function expandArpabetAlternatives(arpabet: string[]): string[][] {
  const results: string[][] = [arpabet];
  const seen = new Set<string>([arpabet.join(' ')]);

  for (let r = 0; r < results.length && results.length < MAX_ALTERNATIVE_VARIANTS; r++) {
    const current = results[r]!;

    const push = (variant: string[]): void => {
      const key = variant.join(' ');
      if (!seen.has(key) && results.length < MAX_ALTERNATIVE_VARIANTS) {
        seen.add(key);
        results.push(variant);
      }
    };

    // Single-phoneme substitutions (AE→AH, SH→S+HH, ...)
    for (let i = 0; i < current.length; i++) {
      const alternatives = ARPABET_ALTERNATIVES[current[i]!];
      if (alternatives !== undefined) {
        for (const alt of alternatives) {
          push([...current.slice(0, i), ...alt, ...current.slice(i + 1)]);
        }
      }
    }

    // Contextual multi-phoneme substitutions (e.g. AO+AE → AH+W+AH for "-awal").
    for (const { from, to } of ARPABET_SEQUENCE_ALTERNATIVES) {
      for (let i = 0; i + from.length <= current.length; i++) {
        if (from.every((p, j) => current[i + j] === p)) {
          push([...current.slice(0, i), ...to, ...current.slice(i + from.length)]);
        }
      }
    }
  }

  return results;
}

/**
 * Pre-built Sets for O(1) lookup by spelling length.
 * Enables fast prefix matching: check 2-char, then 1-char.
 */
const TWO_CHAR_SPELLINGS = new Set(
  Object.keys(INGGLISH_TO_ARPABET_MAP).filter((s) => s.length === 2)
);
const ONE_CHAR_SPELLINGS = new Set(
  Object.keys(INGGLISH_TO_ARPABET_MAP).filter((s) => s.length === 1)
);

/**
 * Converts an Ingglish spelling to ARPAbet phonemes.
 * Uses index-based parsing to avoid intermediate string allocations.
 *
 * @param ingglish - Ingglish string (e.g., "haloh" for "hello")
 * @returns Array of ARPAbet phonemes (e.g., ["HH", "AH", "L", "OW"]), or null if empty
 */
export function ingglishToArpabet(ingglish: string): null | string[] {
  const result: string[] = [];
  const str = ingglish.toLowerCase();
  const len = str.length;
  let pos = 0;

  while (pos < len) {
    // Check for 3-char R-colored vowels first (air)
    if (pos + 3 <= len) {
      const threeChar = str.slice(pos, pos + 3);
      if (threeChar in R_COLORED_REVERSE_3CHAR) {
        result.push(...R_COLORED_REVERSE_3CHAR[threeChar]!);
        pos += 3;
        continue;
      }
    }

    // Check for 2-char R-colored vowels (ar, or) and digraphs (sh, th)
    if (pos + 2 <= len) {
      const twoChar = str.slice(pos, pos + 2);
      if (twoChar in R_COLORED_REVERSE_2CHAR) {
        result.push(...R_COLORED_REVERSE_2CHAR[twoChar]!);
        pos += 2;
        continue;
      }

      // Try 2-char spelling (e.g., "sh" before "s")
      if (TWO_CHAR_SPELLINGS.has(twoChar)) {
        result.push(INGGLISH_TO_ARPABET_MAP[twoChar]!);
        pos += 2;
        continue;
      }
    }

    // Try 1-char spelling
    const oneChar = str[pos]!;
    if (ONE_CHAR_SPELLINGS.has(oneChar)) {
      result.push(INGGLISH_TO_ARPABET_MAP[oneChar]!);
      pos += 1;
      continue;
    }

    // Skip unknown characters
    pos += 1;
  }

  return result.length > 0 ? result : null;
}
