import { PHONEME_MAP } from './phoneme-map';
import { getDictionary } from './translator';

// Common English words - used to prefer more frequent words for homophones
// Based on frequency lists, these are among the most common words
const COMMON_WORDS = new Set([
  // Articles & determiners
  'the', 'a', 'an', 'this', 'that', 'these', 'those', 'some', 'any', 'no',
  // Pronouns
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
  'who', 'what', 'which', 'where', 'when', 'why', 'how',
  // Common verbs
  'be', 'is', 'are', 'was', 'were', 'been', 'being', 'am',
  'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'done',
  'say', 'said', 'go', 'goes', 'went', 'gone', 'going',
  'get', 'got', 'getting', 'make', 'made', 'making',
  'know', 'knew', 'known', 'think', 'thought', 'see', 'saw', 'seen',
  'come', 'came', 'coming', 'take', 'took', 'taken', 'taking',
  'want', 'use', 'find', 'give', 'tell', 'work', 'call', 'try', 'ask', 'need', 'feel',
  'become', 'leave', 'put', 'mean', 'keep', 'let', 'begin', 'seem', 'help', 'show',
  'hear', 'play', 'run', 'move', 'live', 'believe', 'hold', 'bring', 'happen',
  'write', 'provide', 'sit', 'stand', 'lose', 'pay', 'meet', 'include', 'continue',
  'set', 'learn', 'change', 'lead', 'understand', 'watch', 'follow', 'stop', 'create',
  'speak', 'read', 'allow', 'add', 'spend', 'grow', 'open', 'walk', 'win', 'offer',
  'remember', 'love', 'consider', 'appear', 'buy', 'wait', 'serve', 'die', 'send', 'expect',
  // Prepositions & conjunctions
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'up', 'about', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again',
  'and', 'but', 'or', 'if', 'because', 'as', 'until', 'while', 'although', 'though',
  'so', 'than', 'too', 'very', 'just', 'only', 'also', 'now', 'then', 'here', 'there',
  // Common nouns
  'time', 'year', 'people', 'way', 'day', 'man', 'woman', 'child', 'world', 'life',
  'hand', 'part', 'place', 'case', 'week', 'company', 'system', 'program', 'question',
  'work', 'government', 'number', 'night', 'point', 'home', 'water', 'room', 'mother',
  'area', 'money', 'story', 'fact', 'month', 'lot', 'right', 'study', 'book', 'eye',
  'job', 'word', 'business', 'issue', 'side', 'kind', 'head', 'house', 'service', 'friend',
  'father', 'power', 'hour', 'game', 'line', 'end', 'member', 'law', 'car', 'city',
  'community', 'name', 'president', 'team', 'minute', 'idea', 'kid', 'body', 'information',
  'back', 'parent', 'face', 'others', 'level', 'office', 'door', 'health', 'person', 'art',
  // Common adjectives
  'good', 'new', 'first', 'last', 'long', 'great', 'little', 'own', 'other', 'old',
  'right', 'big', 'high', 'different', 'small', 'large', 'next', 'early', 'young', 'important',
  'few', 'public', 'bad', 'same', 'able', 'best', 'better', 'sure', 'free', 'true',
  // Common adverbs
  'not', 'more', 'when', 'still', 'well', 'back', 'even', 'most', 'much',
  // Numbers
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'first', 'second', 'third',
  // Other common words
  'all', 'each', 'every', 'both', 'many', 'most', 'such', 'over', 'own', 'same',
  'yes', 'no', 'like', 'would', 'could', 'should', 'may', 'might', 'must', 'will',
  'can', 'shall', 'being', 'been',
  // More common words (from sample text and frequent usage)
  'quick', 'brown', 'fox', 'jumps', 'lazy', 'dog', 'sentence', 'contains', 'letter',
  'alphabet', 'though', 'through', 'spelled', 'sound', 'different', 'english', 'spelling',
  'difficult', 'learn', 'because', 'exceptions', 'words', 'exactly', 'needed',
]);

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
 * Scores a word by commonality - lower is better (more common).
 */
function getWordScore(word: string): number {
  const lower = word.toLowerCase();
  // Common words get score 0 (best)
  if (COMMON_WORDS.has(lower)) {
    return 0;
  }
  // Prefer shorter words (often more common)
  // Also penalize words with numbers or unusual characters
  if (/[0-9]/.test(word)) {
    return 1000 + word.length;
  }
  return 100 + word.length;
}

/**
 * Builds a reverse dictionary mapping phoneme sequences to English words.
 * Words are sorted by commonality (most common first).
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

  // Sort each word list by commonality
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
