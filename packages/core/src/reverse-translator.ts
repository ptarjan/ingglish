/**
 * Reverse translation: Ingglish -> English
 *
 * Uses phoneme matching to find English words that would produce
 * the given Ingglish spelling. Handles homophones by preferring
 * more common words based on frequency data.
 */
import { PHONEME_MAP } from './phoneme-map';
import { getDictionary } from './translator';
import { sortByFrequency } from './word-frequency';
import { detectCasePattern, applyCasePattern } from './case-utils';

// ============================================================================
// Reverse Phoneme Map
// ============================================================================

/** Maps Ingglish spellings back to phonemes */
const REVERSE_PHONEME_MAP: Record<string, string> = {};
for (const [phoneme, spelling] of Object.entries(PHONEME_MAP)) {
  REVERSE_PHONEME_MAP[spelling] = phoneme;
}

/** Spellings sorted by length (match longer patterns first, e.g., "sh" before "s") */
const SPELLINGS_BY_LENGTH = Object.keys(REVERSE_PHONEME_MAP).sort(
  (a, b) => b.length - a.length
);

// ============================================================================
// Phoneme Alternatives (handling ambiguous spellings)
// ============================================================================

/**
 * Some Ingglish spellings are ambiguous because the same letters can
 * represent different phoneme sequences. For example, "er" could be:
 * - ER (r-colored schwa): "bird", "her"
 * - EH + R (short e + r): "welfare", "better"
 */
const PHONEME_ALTERNATIVES: Record<string, string[][]> = {
  ER: [['EH', 'R'], ['IH', 'R'], ['AH', 'R']],
};

/**
 * Generates alternative phoneme sequences for ambiguous spellings.
 */
function expandPhonemeAlternatives(phonemes: string[]): string[][] {
  const results: string[][] = [phonemes];

  for (let i = 0; i < phonemes.length; i++) {
    const alternatives = PHONEME_ALTERNATIVES[phonemes[i]];
    if (alternatives) {
      for (const alt of alternatives) {
        const expanded = [...phonemes.slice(0, i), ...alt, ...phonemes.slice(i + 1)];
        results.push(expanded);
      }
    }
  }

  return results;
}

// ============================================================================
// Reverse Dictionary Cache
// ============================================================================

let reverseDictionaryCache: Map<string, string[]> | null = null;

/**
 * Builds and caches a reverse dictionary: phoneme sequence -> English words.
 * Words are sorted by frequency (most common first).
 */
function getReverseDictionary(): Map<string, string[]> {
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

  // Sort each word list by frequency
  for (const [key, words] of reverseDictionaryCache.entries()) {
    reverseDictionaryCache.set(key, sortByFrequency(words));
  }

  return reverseDictionaryCache;
}

// ============================================================================
// Core Translation Functions
// ============================================================================

/**
 * Parses Ingglish text into phonemes.
 */
export function inglishToPhonemes(inglish: string): string[] | null {
  const phonemes: string[] = [];
  let remaining = inglish.toLowerCase();

  while (remaining.length > 0) {
    let matched = false;

    for (const spelling of SPELLINGS_BY_LENGTH) {
      if (remaining.startsWith(spelling)) {
        phonemes.push(REVERSE_PHONEME_MAP[spelling]);
        remaining = remaining.slice(spelling.length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      remaining = remaining.slice(1); // Skip unknown characters
    }
  }

  return phonemes.length > 0 ? phonemes : null;
}

/**
 * Looks up English words matching a phoneme sequence.
 * Tries alternative phoneme interpretations if the primary doesn't match.
 */
function lookupByPhonemes(phonemes: string[]): string[] {
  const reverseDict = getReverseDictionary();
  const variants = expandPhonemeAlternatives(phonemes);

  for (const variant of variants) {
    const key = variant.join(' ');
    const matches = reverseDict.get(key);
    if (matches && matches.length > 0) {
      return matches;
    }
  }

  return [];
}

/**
 * Translates an Ingglish word back to English.
 * Returns possible English words sorted by frequency.
 */
export function reverseTranslateWord(inglishWord: string): string[] {
  if (!inglishWord || !/[a-zA-Z]/.test(inglishWord)) {
    return inglishWord ? [inglishWord] : [];
  }

  const casePattern = detectCasePattern(inglishWord);
  const phonemes = inglishToPhonemes(inglishWord);

  if (!phonemes) {
    return [inglishWord];
  }

  const matches = lookupByPhonemes(phonemes);

  if (matches.length === 0) {
    return [inglishWord];
  }

  return matches.map((word) => applyCasePattern(word, casePattern));
}

/**
 * Translates Ingglish text back to English.
 * For homophones, uses the most common word.
 */
export function reverseTranslateText(inglishText: string): string {
  return inglishText
    .split(/(\b[a-zA-Z]+\b)/)
    .map((token) => {
      if (/^[a-zA-Z]+$/.test(token)) {
        const matches = reverseTranslateWord(token);
        return matches[0] ?? token;
      }
      return token;
    })
    .join('');
}

// ============================================================================
// Language Detection
// ============================================================================

const INGLISH_PATTERNS = [
  /\buu\b/i,      // "uu" is rare in English
  /\bdh/i,        // "dh" at word start
  /\bng[aeiou]/i, // "ng" + vowel at start
  /[aeiou]h\b/i,  // vowel + "h" at end
];

const ENGLISH_PATTERNS = [
  /tion\b/i,  // "-tion" ending
  /ight\b/i,  // "-ight" ending
  /ough/i,    // "ough" pattern
  /\bthe\b/i, // "the" (would be "dhu" in Ingglish)
  /\bwh/i,    // "wh-" words
];

/**
 * Heuristically detects if text is Ingglish vs English.
 */
export function isLikelyInglish(text: string): boolean {
  const inglishScore = INGLISH_PATTERNS.filter((p) => p.test(text)).length;
  const englishScore = ENGLISH_PATTERNS.filter((p) => p.test(text)).length;
  return inglishScore > englishScore;
}
