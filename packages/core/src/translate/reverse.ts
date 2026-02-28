/**
 * Reverse translation: Ingglish/IPA -> English.
 *
 * Uses ARPAbet matching to find English words that would produce
 * the given spelling. Handles homophones by preferring more common
 * words based on frequency data.
 */

import { lookupPhonemeKey, sortByFrequency, getWordFrequency } from '@ingglish/dictionary';
import { ipaToArpabetClean } from '@ingglish/ipa';
import { applyCasePattern, detectCasePattern, tokenizeIPA } from '@ingglish/normalize';
import {
  expandArpabetAlternatives,
  getFormatHandler,
  ingglishToArpabet,
  registerFormat,
} from '@ingglish/phonemes';
import type { TranslateOptions } from '../foreign-dict';
import type { TranslatedToken } from './forward';
import type { TranslateResult } from './pipeline';
import { extractTokens, HAS_LETTER, mapTokens } from './pipeline';

// Alternative phoneme interpretation must be this many times more common
// than the primary to override it (prevents "kat" → "cut" while allowing "haloh" → "hello")
const ALT_FREQUENCY_THRESHOLD = 5;

// ============================================================================
// Core Translation Functions
// ============================================================================

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
 * Translates an Ingglish word back to English.
 * Returns possible English words sorted by frequency, or [] if lookup failed.
 * Non-letter tokens (numbers, punctuation) are returned as-is in a single-element array.
 */
export function reverseTranslateWord(ingglishWord: string): string[] {
  if (!ingglishWord || !HAS_LETTER.test(ingglishWord)) {
    return ingglishWord ? [ingglishWord] : [];
  }

  const casePattern = detectCasePattern(ingglishWord);
  const arpabet = ingglishToArpabet(ingglishWord);

  if (!arpabet) {
    return [];
  }

  const matches = lookupByArpabet(arpabet);

  if (matches.length === 0) {
    return [];
  }

  return matches.map((word) => applyCasePattern(word, casePattern));
}

/**
 * Looks up English words matching an ARPAbet sequence.
 * Tries primary interpretation first. Only considers alternatives (e.g.,
 * AE↔AH ambiguity from schwa='a') when the alternative's best match is
 * overwhelmingly more common than the primary's best match (>5x frequency).
 * This prevents "kat" → "cut" (3.5x) while allowing "haloh" → "hello" (3000x).
 */
function lookupByArpabet(arpabet: string[]): string[] {
  const [primary, ...alternatives] = expandArpabetAlternatives(arpabet);
  if (!primary) {
    return [];
  }

  const primaryKey = primary.join(' ');
  const primaryMatches = lookupPhonemeKey(primaryKey);

  if (!primaryMatches || primaryMatches.length === 0) {
    // Primary had no matches — try alternatives
    const allMatches: string[] = [];
    const seen = new Set<string>();
    for (const variant of alternatives) {
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
    return allMatches.length > 1 ? sortByFrequency(allMatches) : allMatches;
  }

  // Primary has matches — check if any alternative has a much better match
  const primaryBestFreq = getWordFrequency(primaryMatches[0] ?? '') ?? 0;

  for (const variant of alternatives) {
    const key = variant.join(' ');
    const matches = lookupPhonemeKey(key);
    if (matches && matches.length > 0) {
      const altBestFreq = getWordFrequency(matches[0] ?? '') ?? 0;
      if (altBestFreq > primaryBestFreq * ALT_FREQUENCY_THRESHOLD) {
        // Alternative is overwhelmingly more common — merge and sort
        const allMatches = [...primaryMatches];
        const seen = new Set(primaryMatches);
        for (const match of matches) {
          if (!seen.has(match)) {
            seen.add(match);
            allMatches.push(match);
          }
        }
        return sortByFrequency(allMatches);
      }
    }
  }

  return primaryMatches;
}

// ============================================================================
// Unified Reverse Translation
// ============================================================================

// Register reverse handlers for built-in formats
registerFormat('ingglish', {
  reverseText: reverseTranslateIngglishText,
  reverseTextWithMapping: reverseTranslateIngglishTextWithMapping,
});
registerFormat('ipa', {
  reverseText: reverseTranslateIPATextInternal,
  reverseTextWithMapping: reverseTranslateIPATextWithMapping,
});

/**
 * Synchronous version of {@link reverseTranslate}. Dictionary must already be loaded.
 */
export function reverseTranslateSync(text: string, options: TranslateOptions = {}): string {
  const { format = 'ingglish' } = options;
  const handler = getFormatHandler(format);
  if (handler?.reverseText) {
    return handler.reverseText(text);
  }
  return reverseTranslateIngglishText(text);
}

/**
 * Like {@link reverseTranslate}, but returns token-by-token mappings instead of a string.
 * Each token includes the original text, translation, and whether it matched
 * the dictionary. Dictionary must already be loaded.
 */
export function reverseTranslateSyncWithMapping(
  text: string,
  options: TranslateOptions = {}
): TranslatedToken[] {
  const { format = 'ingglish' } = options;
  const handler = getFormatHandler(format);
  if (handler?.reverseTextWithMapping) {
    return handler.reverseTextWithMapping(text);
  }
  return reverseTranslateIngglishTextWithMapping(text);
}

/**
 * Translates Ingglish text back to English.
 * URLs and emails are preserved unchanged.
 */
function reverseTranslateIngglishText(text: string): string {
  return reverseTranslateIngglishTextWithMapping(text)
    .map((t) => t.translated)
    .join('');
}

// ============================================================================
// Reverse Translation with Mapping
// ============================================================================

/**
 * Ingglish reverse translation with token-by-token mapping.
 */
function reverseTranslateIngglishTextWithMapping(text: string): TranslatedToken[] {
  const { preserved, rawTokens } = extractTokens(text);
  return mapTokens(rawTokens, preserved, reverseTranslateWordAsResult);
}

/**
 * Translates IPA text back to English, preserving punctuation.
 */
function reverseTranslateIPATextInternal(text: string): string {
  // Strip leading/trailing IPA notation brackets (/, [, ]) but preserve internal punctuation
  const cleanText = text.replaceAll(/^[/[\]]+|[/[\]]+$/g, '');
  const tokens = tokenizeIPA(cleanText);

  return tokens
    .map((token) => {
      if (token.isWord) {
        const matches = reverseTranslateIPAWord(token.text);
        return matches[0] ?? token.text;
      }
      return token.text;
    })
    .join('');
}

/**
 * Translates IPA text back to English with token-by-token mapping.
 */
function reverseTranslateIPATextWithMapping(text: string): TranslatedToken[] {
  const cleanText = text.replaceAll(/^[/[\]]+|[/[\]]+$/g, '');
  const tokens = tokenizeIPA(cleanText);

  return tokens.map((token) => {
    if (token.isWord) {
      const matches = reverseTranslateIPAWord(token.text);
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

/**
 * Translate a single Ingglish word (with contraction support) returning a
 * TranslateResult for use with the pipeline's mapTokens stage.
 */
function reverseTranslateWordAsResult(word: string): TranslateResult {
  if (!HAS_LETTER.test(word)) {
    return { matched: true, translated: word };
  }

  if (word.includes("'")) {
    // Handle contractions by splitting on apostrophe
    const parts = word.split("'");
    let allMatched = true;
    const translatedParts = parts.map((p) => {
      if (!p) {
        return '';
      }
      const matches = reverseTranslateWord(p);
      if (matches[0]) {
        return matches[0];
      }
      allMatched = false;
      return p;
    });
    return { matched: allMatched, translated: translatedParts.join("'") };
  }

  const matches = reverseTranslateWord(word);
  if (matches[0]) {
    return { matched: true, translated: matches[0] };
  }
  return { matched: false, translated: word };
}
