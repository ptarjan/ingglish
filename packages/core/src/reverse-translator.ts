import { PHONEME_MAP } from './phoneme-map';
import { getDictionary } from './translator';
import wordFrequencies from 'subtlex-word-frequencies';

// Build word frequency map for O(1) lookups
// Maps lowercase word -> frequency count (higher = more common)
const WORD_FREQUENCY: Map<string, number> = new Map();
for (const entry of wordFrequencies) {
  // Store lowercase for case-insensitive matching
  WORD_FREQUENCY.set(entry.word.toLowerCase(), entry.count);
}

// Build reverse map: Ingglish spelling -> phoneme
const REVERSE_PHONEME_MAP: Record<string, string> = {};
for (const [phoneme, spelling] of Object.entries(PHONEME_MAP)) {
  REVERSE_PHONEME_MAP[spelling] = phoneme;
}

// Sort by length descending so we match longer spellings first (e.g., "sh" before "s")
const SPELLINGS_BY_LENGTH = Object.keys(REVERSE_PHONEME_MAP).sort((a, b) => b.length - a.length);

// Cache for reverse dictionary lookup (phoneme string -> English words)
let reverseDictionary: Map<string, string[]> | null = null;

/**
 * Scores a word by frequency - lower score is better (more common).
 * Uses SUBTLEX word frequency data from movie subtitles corpus.
 */
function getWordScore(word: string): number {
  const lower = word.toLowerCase();
  const frequency = WORD_FREQUENCY.get(lower);

  if (frequency !== undefined) {
    // Use negative frequency so higher frequency = lower (better) score
    return -frequency;
  }

  // Words not in frequency list get a high score (less preferred)
  // Penalize words with numbers
  if (/[0-9]/.test(word)) {
    return 1_000_000 + word.length;
  }

  // Unknown words: penalize by length (shorter usually more common)
  return 100_000 + word.length;
}

/**
 * Builds a reverse dictionary mapping phoneme sequences to English words.
 * Words are sorted by frequency (most common first).
 */
function buildReverseDictionary(): Map<string, string[]> {
  if (reverseDictionary) {
    return reverseDictionary;
  }

  const dict = getDictionary();
  reverseDictionary = new Map();

  for (const [word, pronunciation] of Object.entries(dict)) {
    // Strip stress markers and join phonemes
    const phonemeKey = pronunciation
      .split(' ')
      .map((p) => p.replace(/[012]$/, ''))
      .join(' ');

    const existing = reverseDictionary.get(phonemeKey) || [];
    existing.push(word);
    reverseDictionary.set(phonemeKey, existing);
  }

  // Sort each word list by frequency (most common first)
  for (const [key, words] of reverseDictionary.entries()) {
    words.sort((a, b) => getWordScore(a) - getWordScore(b));
    reverseDictionary.set(key, words);
  }

  return reverseDictionary;
}

/**
 * Parses Ingglish text into phoneme sequences.
 * Returns an array of phonemes, or null if parsing fails.
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
      // Unknown character - skip it (could be punctuation)
      remaining = remaining.slice(1);
    }
  }

  return phonemes.length > 0 ? phonemes : null;
}

/**
 * Translates an Ingglish word back to English.
 * Returns an array of possible English words (for homophones).
 */
export function reverseTranslateWord(inglishWord: string): string[] {
  if (!inglishWord || inglishWord.length === 0) {
    return [];
  }

  // Check if word has any letters
  if (!/[a-zA-Z]/.test(inglishWord)) {
    return [inglishWord];
  }

  // Preserve case pattern
  const isAllCaps = inglishWord.length > 1 && inglishWord === inglishWord.toUpperCase();
  const isCapitalized =
    inglishWord.length > 1 &&
    /^[A-Z]/.test(inglishWord) &&
    inglishWord.slice(1) === inglishWord.slice(1).toLowerCase();

  const phonemes = inglishToPhonemes(inglishWord);
  if (!phonemes) {
    return [inglishWord];
  }

  const reverseDict = buildReverseDictionary();
  const phonemeKey = phonemes.join(' ');
  const matches = reverseDict.get(phonemeKey) || [];

  if (matches.length === 0) {
    return [inglishWord]; // Return original if no match
  }

  // Apply original case pattern
  return matches.map((word) => {
    if (isAllCaps) {
      return word.toUpperCase();
    } else if (isCapitalized) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  });
}

/**
 * Translates Ingglish text back to English.
 * For homophones, uses the first match.
 */
export function reverseTranslateText(inglishText: string): string {
  // Split into tokens (words and non-words)
  const tokens = inglishText.split(/(\b[a-zA-Z]+\b)/);

  return tokens
    .map((token) => {
      if (/^[a-zA-Z]+$/.test(token)) {
        const matches = reverseTranslateWord(token);
        return matches[0] || token;
      }
      return token;
    })
    .join('');
}

/**
 * Detects if text is likely Ingglish based on character patterns.
 * Ingglish uses specific letter combinations that are rare in English.
 */
export function isLikelyInglish(text: string): boolean {
  // Common Ingglish patterns that are rare in English
  const inglishPatterns = [
    /\buu\b/i, // "uu" is very rare in English
    /\bdh/i, // "dh" at start is rare in English
    /\bng[aeiou]/i, // "ng" followed by vowel at start
    /[aeiou]h\b/i, // vowel + "h" at end (like "ah", "oh")
  ];

  // Common English patterns
  const englishPatterns = [
    /tion\b/i, // "-tion" ending
    /ight\b/i, // "-ight" ending
    /ough/i, // "ough" pattern
    /\bthe\b/i, // "the" (would be "dhu" in Ingglish)
    /\bwh/i, // "wh-" words
  ];

  let inglishScore = 0;
  let englishScore = 0;

  for (const pattern of inglishPatterns) {
    if (pattern.test(text)) inglishScore++;
  }

  for (const pattern of englishPatterns) {
    if (pattern.test(text)) englishScore++;
  }

  return inglishScore > englishScore;
}
