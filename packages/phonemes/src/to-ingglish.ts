/**
 * ARPAbet to Ingglish conversion.
 *
 * Converts CMU dictionary phoneme sequences to Ingglish spelling.
 * Ingglish is a phonetic spelling system that uses only standard
 * English letters with no ambiguity.
 */

import { stripStress } from './arpabet';
import { registerFormat, getFormatHandler } from './format-registry';
import { ARPABET_TO_INGGLISH_MAP, R_COLORED_FORWARD } from './ingglish-maps';
import type { OutputFormat } from './types';

/**
 * Converts a single ARPAbet phoneme to Ingglish spelling.
 *
 * @param phoneme ARPAbet phoneme (e.g., "AH0", "EY1", "B")
 * @returns Ingglish spelling (e.g., "a", "ay", "b")
 */
export function arpabetPhonemeToIngglish(phoneme: string): string {
  // Unstressed schwa AH0 → 'a' (stressed /ʌ/ AH1/AH2 → 'u' via map)
  if (phoneme === 'AH0') {
    return 'a';
  }
  const base = stripStress(phoneme);
  return ARPABET_TO_INGGLISH_MAP[base] ?? phoneme.toLowerCase();
}

/**
 * Core conversion loop shared by arpabetToIngglish and custom format converters.
 *
 * Checks phonemes in this order:
 * 1. R-colored vowel prefix (if next phoneme is R)
 * 2. Exact phoneme with stress digit (AH0, EY0) via stressOverrides
 * 3. Stress-stripped base via phonemeMap
 * 4. Lowercase phoneme as fallback
 *
 * @param arpabet Array of ARPAbet symbols
 * @param phonemeMap Base phoneme → spelling map (stress-stripped keys)
 * @param rColoredMap Vowel base → R-colored prefix map
 * @param stressOverrides Exact phoneme (with stress digit) → spelling overrides
 * @returns Converted string
 */
export function convertArpabet(
  arpabet: string[],
  phonemeMap: Record<string, string>,
  rColoredMap: Map<string, string>,
  stressOverrides: Map<string, string>
): string {
  let result = '';
  const len = arpabet.length;

  for (let i = 0; i < len; i++) {
    const phoneme = arpabet[i]!;
    const base = stripStress(phoneme);

    // R-colored vowel check: only if next phoneme is R
    if (i + 1 < len && arpabet[i + 1] === 'R') {
      const rPrefix = rColoredMap.get(base);
      if (rPrefix !== undefined) {
        result += rPrefix; // R will add 'r' next iteration
        continue;
      }
    }

    // Check exact phoneme with stress (AH0, EY0, etc.)
    const chunk = stressOverrides.get(phoneme) ?? phonemeMap[base] ?? phoneme.toLowerCase();

    result = appendWithSeparator(result, chunk);
  }
  return result;
}

/**
 * Append a chunk to the result, inserting a hyphen if the junction would
 * create 3+ identical consecutive letters (e.g. "ee"+"e" → "ee-e").
 */
function appendWithSeparator(result: string, chunk: string): string {
  if (result.length > 0 && chunk.length > 0) {
    const lastChar = result.at(-1)!;
    if (chunk.startsWith(lastChar)) {
      // Count trailing run of lastChar in result
      let runLen = 0;
      for (let j = result.length - 1; j >= 0 && result[j] === lastChar; j--) {
        runLen++;
      }
      // Count leading run of lastChar in chunk
      let chunkRun = 0;
      for (let j = 0; j < chunk.length && chunk[j] === lastChar; j++) {
        chunkRun++;
      }
      // Would create 3+ of the same letter in a row
      if (runLen + chunkRun >= 3) {
        return result + '-' + chunk;
      }
    }
  }
  return result + chunk;
}

// Pre-combined lookup: phoneme (with or without stress digit) → ingglish spelling.
// Eliminates per-phoneme stripStress() + stressOverrides.get() calls.
// Also used by to-pronunciation.ts for guide format.
export const INGGLISH_FULL_MAP: Record<string, string> = {};
for (const [base, spelling] of Object.entries(ARPABET_TO_INGGLISH_MAP)) {
  INGGLISH_FULL_MAP[base] = spelling;
  INGGLISH_FULL_MAP[base + '0'] = spelling;
  INGGLISH_FULL_MAP[base + '1'] = spelling;
  INGGLISH_FULL_MAP[base + '2'] = spelling;
}
INGGLISH_FULL_MAP.AH0 = 'a'; // Override: unstressed schwa

/**
 * Converts an array of ARPAbet phonemes to Ingglish spelling.
 * Uses direct loop + string concat (benchmarked 60% faster than map+join).
 *
 * R-colored vowels: AA+R → 'ar', AO+R → 'or', IH+R → 'eer' (more intuitive than 'or'/'awr'/'ir')
 *
 * @param arpabet Array of ARPAbet symbols (e.g., ["HH", "AH0", "L", "OW1"])
 * @returns Ingglish spelling (e.g., "haloh")
 */
export function arpabetToIngglish(arpabet: string[]): string {
  let result = '';
  const len = arpabet.length;
  for (let i = 0; i < len; i++) {
    const phoneme = arpabet[i]!;
    // R-colored vowel check: only if next phoneme is R
    if (i + 1 < len && arpabet[i + 1] === 'R') {
      const base = stripStress(phoneme);
      const rPrefix = R_COLORED_FORWARD.get(base);
      if (rPrefix !== undefined) {
        result += rPrefix;
        continue;
      }
    }
    const chunk = INGGLISH_FULL_MAP[phoneme] ?? phoneme.toLowerCase();
    result = appendWithSeparator(result, chunk);
  }
  return result;
}

// Register default format at module load
registerFormat('ingglish', {
  forward: arpabetToIngglish,
  isLatinScript: true,
  label: 'Ingglish',
  preservesCase: true,
});

// Shared constants for the no-R-coloring path (foreign text)
const EMPTY_R_COLORED = new Map<string, string>();
const INGGLISH_STRESS_OVERRIDES = new Map<string, string>([['AH0', 'a']]);

export interface FormatOptions {
  /** Disable English R-coloring rules (vowel+R fusion). Use for foreign text. */
  disableRColoring?: boolean;
}

/**
 * Universal pipeline exit point: converts the ARPAbet IR to any output format.
 *
 * Every translation path (dictionary, fallback, G2P) produces an ARPAbet
 * `string[]` and calls this function to get the final user-facing string.
 *
 * @param arpabet Array of ARPAbet symbols (the IR)
 * @param format Output format (e.g. 'ingglish', 'ipa', 'shavian')
 * @param options Conversion options (e.g. disable R-coloring for foreign text)
 * @returns Formatted string
 */
export function arpabetToFormat(
  arpabet: string[],
  format: OutputFormat = 'ingglish',
  options?: FormatOptions
): string {
  // Fast path: skip registry lookup for the default format (99% of calls)
  if (format === 'ingglish') {
    if (options?.disableRColoring === true) {
      return convertArpabet(
        arpabet,
        ARPABET_TO_INGGLISH_MAP,
        EMPTY_R_COLORED,
        INGGLISH_STRESS_OVERRIDES
      );
    }
    return arpabetToIngglish(arpabet);
  }
  const handler = getFormatHandler(format);
  if (handler?.forward) {
    return handler.forward(arpabet, options);
  }
  return arpabetToIngglish(arpabet);
}
