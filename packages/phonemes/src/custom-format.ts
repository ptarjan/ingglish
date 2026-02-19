/**
 * Custom format converter builder.
 *
 * Creates ARPAbet-to-spelling converters using user-defined phoneme mappings.
 * Mirrors arpabetToIngglish() logic but uses merged custom mappings.
 */

import { ARPABET_TO_INGGLISH_MAP, R_COLORED_FORWARD } from './ingglish-maps';
import { convertArpabetLoop } from './to-ingglish';

/**
 * Configuration for a custom phoneme-to-spelling mapping.
 * Only diffs from the default Ingglish mapping need to be specified.
 */
export interface CustomMappingConfig {
  /** Overrides of ARPABET_TO_INGGLISH_MAP. Includes AH0 as a separate key. */
  phonemeMap: Record<string, string>;
  /** Overrides of R_COLORED_FORWARD prefixes (keyed by base vowel, e.g. 'AA'). */
  rColoredPrefixes: Record<string, string>;
}

/**
 * Creates a forward converter function from a custom mapping config.
 *
 * The converter checks phonemes in this order:
 * 1. Exact phoneme with stress digit (e.g., AH0, EY0) in phonemeMap
 * 2. Stress-stripped base (e.g., AH, EY) in phonemeMap
 * 3. Default ARPABET_TO_INGGLISH_MAP
 * 4. Lowercase phoneme as fallback
 */
export function createCustomConverter(config: CustomMappingConfig): (arpabet: string[]) => string {
  // Merge defaults with overrides
  const mergedMap: Record<string, string> = { ...ARPABET_TO_INGGLISH_MAP, ...config.phonemeMap };
  const mergedRColored = new Map(R_COLORED_FORWARD);
  for (const [key, value] of Object.entries(config.rColoredPrefixes)) {
    mergedRColored.set(key, value);
  }

  // Build stress-specific overrides (entries where key ends with 0/1/2)
  // Include AH0 → 'a' as default (matching arpabetToIngglish behavior)
  const stressOverrides = new Map<string, string>([['AH0', 'a']]);
  for (const [key, value] of Object.entries(config.phonemeMap)) {
    const lastChar = key.charCodeAt(key.length - 1);
    if (lastChar >= 48 && lastChar <= 50) {
      stressOverrides.set(key, value);
    }
  }

  return (arpabet: string[]): string =>
    convertArpabetLoop(arpabet, mergedMap, mergedRColored, stressOverrides);
}
