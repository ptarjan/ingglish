/**
 * Reverse translation: Ingglish/IPA -> English.
 *
 * Uses ARPAbet matching to find English words that would produce
 * the given spelling. Handles homophones by preferring more common
 * words based on frequency data.
 */

import { lookupPhonemeKey, sortByFrequency, getWordFrequency } from '@ingglish/dictionary';
import { ipaToArpabetClean } from '@ingglish/ipa';
import {
  detectCasePattern,
  applyCasePattern,
  normalizeApostrophes,
  extractPreservedPatterns,
} from '@ingglish/normalize';
import {
  ingglishToArpabet,
  expandArpabetAlternatives,
  registerFormat,
  getFormatHandler,
} from '@ingglish/phonemes';
import type { OutputFormat } from '@ingglish/phonemes';
import { tokenizeIPA, WORD_SPLIT_REGEX, WORD_TEST_REGEX } from '@ingglish/tokenize';
import type { TranslatedToken } from './forward';
import { expandPlaceholder } from './preserved';

// Pre-compiled regex patterns
const HAS_LETTER = /[a-z]/i;

// Alternative phoneme interpretation must be this many times more common
// than the primary to override it (prevents "kat" → "cut" while allowing "haloh" → "hello")
const ALT_FREQUENCY_THRESHOLD = 5;

// ============================================================================
// Core Translation Functions
// ============================================================================

/**
 * Looks up English words matching an ARPAbet sequence.
 * Tries primary interpretation first. Only considers alternatives (e.g.,
 * AE↔AH ambiguity from schwa='a') when the alternative's best match is
 * overwhelmingly more common than the primary's best match (>5x frequency).
 * This prevents "kat" → "cut" (3.5x) while allowing "haloh" → "hello" (3000x).
 */
function lookupByArpabet(arpabet: string[]): string[] {
  const variants = expandArpabetAlternatives(arpabet);

  // Try primary (first variant) first
  const primaryKey = variants[0]!.join(' ');
  const primaryMatches = lookupPhonemeKey(primaryKey);

  if (!primaryMatches || primaryMatches.length === 0) {
    // Primary had no matches — try alternatives
    const allMatches: string[] = [];
    const seen = new Set<string>();
    for (let i = 1; i < variants.length; i++) {
      const key = variants[i]!.join(' ');
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
  const primaryBestFreq = getWordFrequency(primaryMatches[0]!) ?? 0;

  for (let i = 1; i < variants.length; i++) {
    const key = variants[i]!.join(' ');
    const matches = lookupPhonemeKey(key);
    if (matches && matches.length > 0) {
      const altBestFreq = getWordFrequency(matches[0]!) ?? 0;
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
 * Translates Ingglish text back to English.
 * URLs and emails are preserved unchanged.
 */
function reverseTranslateIngglishText(text: string): string {
  return reverseTranslateIngglishTextWithMapping(text)
    .map((t) => t.translated)
    .join('');
}

/**
 * Translates IPA text back to English, preserving punctuation.
 */
function reverseTranslateIPATextInternal(text: string): string {
  // Strip leading/trailing IPA notation brackets (/, [, ]) but preserve internal punctuation
  const cleanText = text.replace(/^[/[\]]+|[/[\]]+$/g, '');
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
 * Synchronous version of {@link reverseTranslate}. Dictionary must already be loaded.
 */
export function reverseTranslateSync(text: string, format: OutputFormat = 'ingglish'): string {
  const handler = getFormatHandler(format);
  if (handler?.reverseText) {
    return handler.reverseText(text);
  }
  return reverseTranslateIngglishText(text);
}

// ============================================================================
// Reverse Translation with Mapping
// ============================================================================

/**
 * Translates IPA text back to English with token-by-token mapping.
 */
function reverseTranslateIPATextWithMapping(text: string): TranslatedToken[] {
  const cleanText = text.replace(/^[/[\]]+|[/[\]]+$/g, '');
  const tokens = tokenizeIPA(cleanText);

  return tokens.map((token) => {
    if (token.isWord) {
      const matches = reverseTranslateIPAWord(token.text);
      const translated = matches[0] ?? token.text;
      return {
        original: token.text,
        translated,
        isWord: true,
        matched: translated !== token.text,
      };
    }
    return { original: token.text, translated: token.text, isWord: false, matched: true };
  });
}

/**
 * Like {@link reverseTranslate}, but returns token-by-token mappings instead of a string.
 * Each token includes the original text, translation, and whether it matched
 * the dictionary. Dictionary must already be loaded.
 */
export function reverseTranslateSyncWithMapping(
  text: string,
  format: OutputFormat = 'ingglish'
): TranslatedToken[] {
  const handler = getFormatHandler(format);
  if (handler?.reverseTextWithMapping) {
    return handler.reverseTextWithMapping(text) as TranslatedToken[];
  }
  return reverseTranslateIngglishTextWithMapping(text);
}

/**
 * Ingglish reverse translation with token-by-token mapping.
 */
function reverseTranslateIngglishTextWithMapping(text: string): TranslatedToken[] {
  const normalizedText = normalizeApostrophes(text);
  const { text: textWithPlaceholders, preserved } = extractPreservedPatterns(normalizedText);

  const tokens = textWithPlaceholders.split(WORD_SPLIT_REGEX);
  const result: TranslatedToken[] = [];

  for (const token of tokens) {
    if (token.length === 0) {
      continue;
    }

    // Check for preserved patterns (URLs, emails)
    const expanded = expandPlaceholder(token, preserved);
    if (expanded) {
      result.push(...expanded);
      continue;
    }

    if (WORD_TEST_REGEX.test(token)) {
      if (token.includes("'")) {
        // Handle contractions as a single token
        const parts = token.split("'");
        const translatedParts: string[] = [];
        let allMatched = true;
        for (const p of parts) {
          if (!p) {
            translatedParts.push('');
            continue;
          }
          const matches = reverseTranslateWord(p);
          if (matches.length > 0) {
            translatedParts.push(matches[0]!);
          } else {
            translatedParts.push(p);
            allMatched = false;
          }
        }
        result.push({
          original: token,
          translated: translatedParts.join("'"),
          isWord: true,
          matched: allMatched,
        });
      } else {
        const matches = reverseTranslateWord(token);
        if (matches.length > 0) {
          result.push({ original: token, translated: matches[0]!, isWord: true, matched: true });
        } else {
          result.push({ original: token, translated: token, isWord: true, matched: false });
        }
      }
    } else {
      result.push({ original: token, translated: token, isWord: false, matched: true });
    }
  }

  return result;
}
