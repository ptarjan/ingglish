import { arpabetToDisplay } from './arpabet-to-ingglish';
import { translateUnknown } from './unknown-words';
import type { CMUDictionary, OutputFormat } from './types';

/**
 * Normalizes various apostrophe characters to the standard straight apostrophe.
 * Handles: ' (U+2019 right single quotation mark), ' (U+2018 left), ʼ (U+02BC modifier letter)
 */
export function normalizeApostrophes(text: string): string {
  return text.replace(/[\u2018\u2019\u02BC]/g, "'");
}

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
 * Translates a single word (or contraction) to the specified format.
 * Handles contractions like "don't", "I'm", etc.
 * @param word The English word to translate
 * @param format The output format ('ingglish' or 'ipa')
 * @returns The translated word, or the original word if not found
 */
export function translateWord(word: string, format: OutputFormat = 'ingglish'): string {
  // Handle empty strings
  if (!word) {
    return word;
  }

  // Check if word has any letters to translate
  if (!/[a-zA-Z]/.test(word)) {
    return word;
  }

  // Handle contractions (words with apostrophes)
  if (word.includes("'")) {
    return translateContraction(word, format);
  }

  // Preserve case pattern
  // Require length > 1 for all-caps to avoid treating single letters like "I" as acronyms
  const isAllCaps = word.length > 1 && word === word.toUpperCase() && /[A-Z]/.test(word);
  const isCapitalized =
    word.length > 1 && /^[A-Z]/.test(word) && word.slice(1) === word.slice(1).toLowerCase();

  const phonemes = lookupPronunciation(word);

  if (!phonemes) {
    // Word not found in dictionary - try fallback strategies
    const fallbackResult = translateUnknown(word, format);

    // Return original if fallback failed
    if (!fallbackResult || fallbackResult.length === 0) {
      return word;
    }

    // Apply original case pattern to fallback result (only for Ingglish)
    if (format === 'ingglish') {
      if (isAllCaps) {
        return fallbackResult.toUpperCase();
      } else if (isCapitalized) {
        return fallbackResult.charAt(0).toUpperCase() + fallbackResult.slice(1);
      }
    }
    return fallbackResult;
  }

  let result = arpabetToDisplay(phonemes, format);

  // Apply original case pattern (only for Ingglish, IPA doesn't use case)
  if (format === 'ingglish') {
    if (isAllCaps) {
      result = result.toUpperCase();
    } else if (isCapitalized) {
      result = result.charAt(0).toUpperCase() + result.slice(1);
    }
  }

  return result;
}

/**
 * Translates a contraction (internal helper).
 * First tries to look up the whole contraction in the dictionary.
 * Returns the translation without apostrophe for consistent round-tripping.
 */
function translateContraction(token: string, format: OutputFormat = 'ingglish'): string {
  // Try to look up the whole contraction (with apostrophe) in dictionary
  const phonemes = lookupPronunciation(token);

  if (phonemes) {
    // Found the whole contraction - translate it as a unit
    const translated = arpabetToDisplay(phonemes, format);

    // Preserve case (only for Ingglish), but not for I-contractions (I'm, I'll, I've, I'd)
    // since "I" is only capitalized due to English grammar rules
    if (format === 'ingglish') {
      const isIContraction = /^I'/i.test(token);
      const isAllCaps =
        !isIContraction && token.length > 1 && token === token.toUpperCase() && /[A-Z]/.test(token);
      const isCapitalized =
        !isIContraction && /^[A-Z]/.test(token) && token.slice(1) === token.slice(1).toLowerCase();

      if (isAllCaps) {
        return translated.toUpperCase();
      }
      if (isCapitalized) {
        return translated.charAt(0).toUpperCase() + translated.slice(1);
      }
    }
    return translated;
  }

  // Fallback: translate parts separately, preserving apostrophe
  const parts = token.split("'");
  return parts
    .map((p, i) => {
      if (!p) {
        return '';
      }
      if (i > 0 && p.toLowerCase() === 't') {
        return 't'; // Keep 't' as-is for n't contractions not in dictionary
      }
      // Recursively call translateWord for each part (without apostrophe, so no infinite loop)
      return translateWord(p, format);
    })
    .join("'");
}

/**
 * Translates text containing multiple words to the specified format.
 * Preserves punctuation, whitespace, and non-word characters.
 * @param text The English text to translate
 * @param format The output format ('ingglish' or 'ipa')
 * @returns The text with all words translated
 */
export function translateSync(text: string, format: OutputFormat = 'ingglish'): string {
  // Normalize curly apostrophes to straight ones
  const normalizedText = normalizeApostrophes(text);

  // Regex to match words (letters and apostrophes) vs everything else
  // This preserves punctuation, numbers, whitespace, etc.
  const tokens = normalizedText.split(/(\b[a-zA-Z']+\b)/);

  return tokens
    .map((token) => {
      // Only translate if it's a word (contains letters)
      if (/^[a-zA-Z']+$/.test(token)) {
        return translateWord(token, format);
      }
      return token;
    })
    .join('');
}

/**
 * Represents a translated token with original and translated text.
 */
interface TranslatedToken {
  original: string;
  translated: string;
  isWord: boolean;
}

/**
 * Translates text and returns token-by-token mappings.
 * Used internally for DOM translation with tooltips.
 */
export function translateSyncWithMapping(
  text: string,
  format: OutputFormat = 'ingglish'
): TranslatedToken[] {
  const normalizedText = normalizeApostrophes(text);
  const tokens = normalizedText.split(/(\b[a-zA-Z']+\b)/);

  return tokens
    .filter((token) => token.length > 0)
    .map((token) => {
      if (/^[a-zA-Z']+$/.test(token)) {
        return {
          original: token,
          translated: translateWord(token, format),
          isWord: true,
        };
      }
      return {
        original: token,
        translated: token,
        isWord: false,
      };
    });
}
