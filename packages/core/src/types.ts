/**
 * Shared types for @ingglish/core
 */

/**
 * Output format for translations.
 * - 'ingglish': Phonetic English spelling (e.g., "Hulo werld")
 * - 'ipa': International Phonetic Alphabet (e.g., "/həlˈoʊ wˈɝld/")
 */
export type OutputFormat = 'ingglish' | 'ipa';

/**
 * The CMU Pronouncing Dictionary type.
 * Maps lowercase words to their ARPAbet phoneme arrays.
 *
 * @example
 * {
 *   "hello": ["HH", "AH0", "L", "OW1"],
 *   "world": ["W", "ER1", "L", "D"]
 * }
 */
export type CMUDictionary = Record<string, string[]>;

/**
 * The reverse CMU dictionary type.
 * Maps phoneme sequences (stress-stripped) to words sorted by frequency.
 *
 * @example
 * {
 *   "HH AH L OW": ["hello"],
 *   "T UW": ["to", "too", "two"]
 * }
 */
export type ReverseDictionary = Record<string, string[]>;
