/**
 * Reverse translation: Ingglish -> English
 *
 * Uses ARPAbet matching to find English words that would produce
 * the given Ingglish spelling. Handles homophones by preferring
 * more common words based on frequency data.
 */
import { getDictionary, normalizeApostrophes } from './translator';
import { sortByFrequency } from './word-frequency';
import { detectCasePattern, applyCasePattern } from './case-utils';
import { ipaToArpabet } from './ipa-to-arpabet';
import { ingglishToArpabet } from './ingglish-to-arpabet';

// ============================================================================
// ARPAbet Alternatives (handling ambiguous spellings)
// ============================================================================

/**
 * Some Ingglish spellings are ambiguous because the same letters can
 * represent different ARPAbet sequences. For example, "er" could be:
 * - ER (r-colored schwa): "bird", "her"
 * - EH + R (short e + r): "welfare", "better"
 *
 * Only EH + R is valid here because IH + R -> "ir" and AH + R -> "ur"
 */
const ARPABET_ALTERNATIVES: Record<string, string[][]> = {
  ER: [['EH', 'R']],
  SH: [['S', 'HH']], // "sh" could be SH (ship) or S+HH (exhume)
};

/**
 * Generates alternative ARPAbet sequences for ambiguous spellings.
 */
function expandArpabetAlternatives(arpabet: string[]): string[][] {
  const results: string[][] = [arpabet];

  for (let i = 0; i < arpabet.length; i++) {
    const alternatives = ARPABET_ALTERNATIVES[arpabet[i]];
    if (alternatives !== undefined) {
      for (const alt of alternatives) {
        const expanded = [...arpabet.slice(0, i), ...alt, ...arpabet.slice(i + 1)];
        results.push(expanded);
      }
    }
  }

  return results;
}

// ============================================================================
// Reverse Dictionary Cache (with lazy sorting for performance)
// ============================================================================

/** Raw reverse dictionary: phoneme sequence -> unsorted English words */
let reverseDictionaryCache: Map<string, string[]> | null = null;

/** Tracks which keys have been sorted (lazy sorting optimization) */
const sortedKeys = new Set<string>();

/**
 * Builds and caches a reverse dictionary: phoneme sequence -> English words.
 * Words are NOT sorted during build - sorting happens lazily on lookup.
 * This avoids O(n * m * log(m)) upfront cost for ~134k dictionary entries.
 */
function buildReverseDictionary(): Map<string, string[]> {
  if (reverseDictionaryCache) {
    return reverseDictionaryCache;
  }

  const dict = getDictionary();
  reverseDictionaryCache = new Map();

  for (const [word, pronunciation] of Object.entries(dict)) {
    const phonemeKey = pronunciation
      .split(' ')
      .map((p) => p.replace(/[012]$/, '')) // Strip stress markers
      .join(' ');

    const words = reverseDictionaryCache.get(phonemeKey) ?? [];
    words.push(word);
    reverseDictionaryCache.set(phonemeKey, words);
  }

  return reverseDictionaryCache;
}

/**
 * Looks up words for a phoneme key, sorting by frequency on first access.
 * Lazy sorting means we only pay the cost for keys actually queried.
 */
function lookupPhonemeKey(key: string): string[] | undefined {
  const reverseDict = buildReverseDictionary();
  const words = reverseDict.get(key);

  if (!words) {
    return undefined;
  }

  // Lazy sort: only sort this key's words on first access
  if (!sortedKeys.has(key)) {
    const sorted = sortByFrequency(words);
    reverseDict.set(key, sorted);
    sortedKeys.add(key);
    return sorted;
  }

  return words;
}

// ============================================================================
// Core Translation Functions
// ============================================================================

/**
 * Looks up English words matching an ARPAbet sequence.
 * Tries all alternative ARPAbet interpretations and combines results.
 */
export function lookupByArpabet(arpabet: string[]): string[] {
  const variants = expandArpabetAlternatives(arpabet);
  const allMatches: string[] = [];
  const seen = new Set<string>();

  for (const variant of variants) {
    const key = variant.join(' ');
    const matches = lookupPhonemeKey(key);
    if (matches) {
      for (const match of matches) {
        if (!seen.has(match)) {
          seen.add(match);
          allMatches.push(match);
        }
      }
    }
  }

  // Re-sort combined results by frequency (only if multiple variants matched)
  return allMatches.length > 0 && variants.length > 1 ? sortByFrequency(allMatches) : allMatches;
}

/**
 * Translates an Ingglish word back to English.
 * Returns possible English words sorted by frequency.
 */
export function reverseTranslateWord(ingglishWord: string): string[] {
  if (!ingglishWord || !/[a-zA-Z]/.test(ingglishWord)) {
    return ingglishWord ? [ingglishWord] : [];
  }

  const casePattern = detectCasePattern(ingglishWord);
  const arpabet = ingglishToArpabet(ingglishWord);

  if (!arpabet) {
    return [ingglishWord];
  }

  const matches = lookupByArpabet(arpabet);

  if (matches.length === 0) {
    return [ingglishWord];
  }

  return matches.map((word) => applyCasePattern(word, casePattern));
}

/**
 * Translates Ingglish text back to English.
 * For homophones, uses the most common word.
 */
export function reverseTranslateText(ingglishText: string): string {
  // Normalize curly apostrophes to straight ones
  const normalizedText = normalizeApostrophes(ingglishText);

  return normalizedText
    .split(/(\b[a-zA-Z']+\b)/)
    .map((token) => {
      if (/^[a-zA-Z']+$/.test(token)) {
        // Handle contractions - keep the apostrophe, translate parts
        if (token.includes("'")) {
          const parts = token.split("'");
          return parts
            .map((p) => {
              if (!p) {
                return '';
              }
              const matches = reverseTranslateWord(p);
              return matches[0] ?? p;
            })
            .join("'");
        }
        const matches = reverseTranslateWord(token);
        return matches[0] ?? token;
      }
      return token;
    })
    .join('');
}

// ============================================================================
// IPA Reverse Translation
// ============================================================================

/**
 * Converts IPA text to ARPAbet (stripping stress markers).
 */
export function ipaToArpabetClean(ipa: string): string[] | null {
  const arpabet = ipaToArpabet(ipa).map((p) => p.replace(/[012]$/, ''));
  return arpabet.length > 0 ? arpabet : null;
}

/**
 * Translates an IPA word back to English.
 * Returns possible English words sorted by frequency.
 */
export function reverseTranslateIPAWord(ipaWord: string): string[] {
  if (!ipaWord || ipaWord.trim().length === 0) {
    return ipaWord ? [ipaWord] : [];
  }

  const arpabet = ipaToArpabetClean(ipaWord);

  if (!arpabet) {
    return [ipaWord];
  }

  const matches = lookupByArpabet(arpabet);

  if (matches.length === 0) {
    return [ipaWord];
  }

  return matches;
}

/**
 * Translates IPA text back to English.
 * For homophones, uses the most common word.
 *
 * IPA text typically uses spaces between words and various brackets/slashes.
 * Example: "/həˈloʊ wɝld/" -> "hello world"
 */
export function reverseTranslateIPAText(ipaText: string): string {
  // Remove IPA brackets/slashes but preserve word boundaries
  const cleanText = ipaText.replace(/^[/[\]]+|[/[\]]+$/g, '').trim();

  // Split on spaces (IPA uses spaces between words)
  const words = cleanText.split(/\s+/);

  return words
    .map((word) => {
      // Skip empty tokens
      if (!word) {
        return '';
      }

      const matches = reverseTranslateIPAWord(word);
      return matches[0] ?? word;
    })
    .join(' ');
}

// ============================================================================
// Language Detection
// ============================================================================

const INGGLISH_PATTERNS = [
  /\buu\b/i, // "uu" is rare in English
  /\bdh/i, // "dh" at word start
  /\bng[aeiou]/i, // "ng" + vowel at start
  /[aeiou]h\b/i, // vowel + "h" at end
];

const ENGLISH_PATTERNS = [
  /tion\b/i, // "-tion" ending
  /ight\b/i, // "-ight" ending
  /ough/i, // "ough" pattern
  /\bthe\b/i, // "the" (would be "dhu" in Ingglish)
  /\bwh/i, // "wh-" words
];

/**
 * Heuristically detects if text is Ingglish vs English.
 */
export function isLikelyIngglish(text: string): boolean {
  const ingglishScore = INGGLISH_PATTERNS.filter((p) => p.test(text)).length;
  const englishScore = ENGLISH_PATTERNS.filter((p) => p.test(text)).length;
  return ingglishScore > englishScore;
}
