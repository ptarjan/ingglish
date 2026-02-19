/**
 * ARPAbet to Ingglish conversion.
 *
 * Converts CMU dictionary phoneme sequences to Ingglish spelling.
 * Ingglish is a phonetic spelling system that uses only standard
 * English letters with no ambiguity.
 */

import { stripStress } from './arpabet';
import { ARPABET_TO_INGGLISH_MAP, R_COLORED_FORWARD } from './ingglish-maps';
import { registerFormat, getFormatHandler } from './format-registry';
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
export function convertArpabetLoop(
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
    const stressOverride = stressOverrides.get(phoneme);
    if (stressOverride !== undefined) {
      result += stressOverride;
      continue;
    }

    result += phonemeMap[base] ?? phoneme.toLowerCase();
  }
  return result;
}

/** Default stress overrides: unstressed schwa AH0 → 'a' */
const DEFAULT_STRESS_OVERRIDES = new Map<string, string>([['AH0', 'a']]);

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
  return convertArpabetLoop(
    arpabet,
    ARPABET_TO_INGGLISH_MAP,
    R_COLORED_FORWARD,
    DEFAULT_STRESS_OVERRIDES
  );
}

// Register default format at module load
registerFormat('ingglish', {
  forward: arpabetToIngglish,
  isLatinScript: true,
  preservesCase: true,
  label: 'Ingglish',
});

/**
 * Converts ARPAbet to the specified output format.
 *
 * @param arpabet Array of ARPAbet symbols
 * @param format Output format (e.g. 'ingglish', 'ipa', 'shavian')
 * @returns Formatted string
 */
export function arpabetToFormat(arpabet: string[], format: OutputFormat = 'ingglish'): string {
  const handler = getFormatHandler(format);
  if (handler?.forward) {
    return handler.forward(arpabet);
  }
  return arpabetToIngglish(arpabet);
}
