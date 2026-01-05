import { phonemesToInglish } from './phoneme-map';
import { translateUnknown } from './unknown-words';

// Type for the CMU dictionary - it's a simple object mapping words to pronunciations
type CMUDictionary = Record<string, string>;

// The dictionary will be loaded once and cached
let dictionary: CMUDictionary | null = null;
let dictionaryPromise: Promise<CMUDictionary> | null = null;

/**
 * Loads the CMU Pronouncing Dictionary.
 * The dictionary is cached after first load.
 */
export async function loadDictionary(): Promise<CMUDictionary> {
  if (dictionary) {
    return dictionary;
  }

  if (dictionaryPromise) {
    return dictionaryPromise;
  }

  dictionaryPromise = import('cmu-pronouncing-dictionary')
    .then((module: { default: CMUDictionary }) => {
      dictionary = module.default;
      return dictionary;
    })
    .catch((error: unknown) => {
      dictionaryPromise = null; // Reset so retry is possible
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load CMU dictionary: ${message}`);
    });

  return dictionaryPromise;
}

/**
 * Gets the dictionary synchronously.
 * Throws if dictionary hasn't been loaded yet.
 */
export function getDictionary(): CMUDictionary {
  if (!dictionary) {
    throw new Error('Dictionary not loaded. Call loadDictionary() first.');
  }
  return dictionary;
}

/**
 * Checks if the dictionary is loaded.
 */
export function isDictionaryLoaded(): boolean {
  return dictionary !== null;
}

/**
 * Looks up a word in the CMU dictionary.
 * @param word The word to look up (case insensitive)
 * @returns Array of phonemes, or null if not found
 */
export function lookupPronunciation(word: string): string[] | null {
  const dict = getDictionary();
  const pronunciation = dict[word.toLowerCase()];
  if (!pronunciation) {
    return null;
  }
  return pronunciation.split(' ');
}

/**
 * Translates a single word to Inglish spelling.
 * @param word The English word to translate
 * @returns The Inglish spelling, or the original word if not found
 */
export function translateWord(word: string): string {
  // Handle empty strings
  if (!word || word.length === 0) {
    return word;
  }

  // Check if word has any letters to translate
  if (!/[a-zA-Z]/.test(word)) {
    return word;
  }

  // Preserve case pattern
  // Require length > 1 for all-caps to avoid treating single letters like "I" as acronyms
  const isAllCaps = word.length > 1 && word === word.toUpperCase() && /[A-Z]/.test(word);
  const isCapitalized =
    word.length > 1 && /^[A-Z]/.test(word) && word.slice(1) === word.slice(1).toLowerCase();

  const phonemes = lookupPronunciation(word);

  if (!phonemes) {
    // Word not found in dictionary - try fallback strategies
    const fallbackResult = translateUnknown(word);

    // Return original if fallback failed
    if (!fallbackResult || fallbackResult.length === 0) {
      return word;
    }

    // Apply original case pattern to fallback result
    if (isAllCaps) {
      return fallbackResult.toUpperCase();
    } else if (isCapitalized) {
      return fallbackResult.charAt(0).toUpperCase() + fallbackResult.slice(1);
    }
    return fallbackResult;
  }

  let result = phonemesToInglish(phonemes);

  // Apply original case pattern
  if (isAllCaps) {
    result = result.toUpperCase();
  } else if (isCapitalized) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  return result;
}

/**
 * Translates text containing multiple words to Inglish.
 * Preserves punctuation, whitespace, and non-word characters.
 * @param text The English text to translate
 * @returns The text with all words translated to Inglish
 */
export function translateText(text: string): string {
  // Regex to match words (letters and apostrophes) vs everything else
  // This preserves punctuation, numbers, whitespace, etc.
  const tokens = text.split(/(\b[a-zA-Z']+\b)/);

  return tokens
    .map((token) => {
      // Only translate if it's a word (contains letters)
      if (/^[a-zA-Z']+$/.test(token)) {
        // Handle contractions by splitting on apostrophe
        if (token.includes("'")) {
          const parts = token.split("'");
          return parts.map((p) => (p ? translateWord(p) : '')).join("'");
        }
        return translateWord(token);
      }
      return token;
    })
    .join('');
}

/**
 * Async version of translateWord that ensures dictionary is loaded.
 */
export async function translateWordAsync(word: string): Promise<string> {
  await loadDictionary();
  return translateWord(word);
}

/**
 * Async version of translateText that ensures dictionary is loaded.
 */
export async function translateTextAsync(text: string): Promise<string> {
  await loadDictionary();
  return translateText(text);
}

/**
 * Gets statistics about the dictionary.
 */
export function getDictionaryStats(): { wordCount: number } {
  const dict = getDictionary();
  return {
    wordCount: Object.keys(dict).length,
  };
}
