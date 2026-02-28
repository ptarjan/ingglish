/**
 * Factory for creating reverse translators for Unicode script formats
 * (Shavian, Deseret, etc.).
 *
 * All script-based reverse translators share the same pattern:
 * tokenize → convert each word to ARPAbet → look up English words.
 * Only the tokenizer and toArpabet conversion differ per script.
 */

import type { TranslatedToken } from './translated-token';

export interface ScriptReverseTranslator {
  reverseText: (text: string) => string;
  reverseTextWithMapping: (text: string) => TranslatedToken[];
  reverseWord: (word: string) => string[];
}

/**
 * Creates a set of reverse translation functions for a Unicode script.
 *
 * @param tokenize Splits text into word/non-word tokens for this script
 * @param toArpabet Converts a script word to ARPAbet phonemes (null if invalid)
 * @param lookupPhonemeKey Looks up English words by ARPAbet key
 * @param sortByFrequency Sorts word candidates by frequency
 */
export function createScriptReverseTranslator(opts: {
  lookupPhonemeKey: (key: string) => null | string[] | undefined;
  sortByFrequency: (words: string[]) => string[];
  toArpabet: (text: string) => null | string[];
  tokenize: (text: string) => { isWord: boolean; text: string }[];
}): ScriptReverseTranslator {
  const { lookupPhonemeKey, sortByFrequency, toArpabet, tokenize } = opts;

  function reverseWord(word: string): string[] {
    const arpabet = toArpabet(word);
    if (!arpabet) {
      return [word];
    }
    const key = arpabet.join(' ');
    const matches = lookupPhonemeKey(key);
    if (!matches || matches.length === 0) {
      return [word];
    }
    return matches.length > 1 ? sortByFrequency(matches) : matches;
  }

  function reverseText(text: string): string {
    const tokens = tokenize(text);
    return tokens
      .map((token) => {
        if (token.isWord) {
          const matches = reverseWord(token.text);
          return matches[0] ?? token.text;
        }
        return token.text;
      })
      .join('');
  }

  function reverseTextWithMapping(text: string): TranslatedToken[] {
    const tokens = tokenize(text);
    return tokens.map((token) => {
      if (token.isWord) {
        const matches = reverseWord(token.text);
        const translated = matches[0] ?? token.text;
        return {
          isWord: true,
          matched: translated !== token.text,
          original: token.text,
          translated,
        };
      }
      return { isWord: false, matched: true, original: token.text, translated: token.text };
    });
  }

  return { reverseText, reverseTextWithMapping, reverseWord };
}
