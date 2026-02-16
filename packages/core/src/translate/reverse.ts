/**
 * Reverse translation: Ingglish/IPA -> English.
 *
 * Uses ARPAbet matching to find English words that would produce
 * the given spelling. Handles homophones by preferring more common
 * words based on frequency data.
 */

import {
  ingglishToArpabet,
  expandArpabetAlternatives,
  registerFormat,
  getFormatHandler,
} from '@ingglish/phonemes';
import type { OutputFormat } from '@ingglish/phonemes';
import { ipaToArpabetClean } from '@ingglish/ipa';
import { lookupPhonemeKey, sortByFrequency } from '@ingglish/dictionary';
import {
  detectCasePattern,
  applyCasePattern,
  normalizeApostrophes,
  extractPreservedPatterns,
  restorePreservedPatterns,
} from '@ingglish/normalize';
import { tokenizeIPA, WORD_SPLIT_REGEX, WORD_TEST_REGEX } from '@ingglish/tokenize';
import type { TranslatedToken } from './forward';
import { expandPlaceholder } from './preserved';

// ============================================================================
// Core Translation Functions
// ============================================================================

/**
 * Looks up English words matching an ARPAbet sequence.
 * Tries all alternative ARPAbet interpretations and combines results.
 */
function lookupByArpabet(arpabet: string[]): string[] {
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
 * Returns possible English words sorted by frequency, or [] if lookup failed.
 * Non-letter tokens (numbers, punctuation) are returned as-is in a single-element array.
 */
export function reverseTranslateWord(ingglishWord: string): string[] {
  if (!ingglishWord || !/[a-zA-Z]/.test(ingglishWord)) {
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
registerFormat('ingglish', { reverseText: reverseTranslateIngglishText });
registerFormat('ipa', { reverseText: reverseTranslateIPATextInternal });

/**
 * Translates Ingglish text back to English.
 * URLs and emails are preserved unchanged.
 */
function reverseTranslateIngglishText(text: string): string {
  const normalizedText = normalizeApostrophes(text);

  // Extract URLs and emails to preserve them unchanged
  const { text: textWithPlaceholders, preserved } = extractPreservedPatterns(normalizedText);

  const translated = textWithPlaceholders
    .split(WORD_SPLIT_REGEX)
    .map((token) => {
      if (WORD_TEST_REGEX.test(token)) {
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
        return matches.length > 0 ? matches[0] : token;
      }
      return token;
    })
    .join('');

  // Restore URLs and emails
  return restorePreservedPatterns(translated, preserved);
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
 * Like {@link reverseTranslate}, but returns token-by-token mappings instead of a string.
 * Each token includes the original text, translation, and whether it matched
 * the dictionary. Dictionary must already be loaded.
 */
export function reverseTranslateSyncWithMapping(
  text: string,
  _format: OutputFormat = 'ingglish'
): TranslatedToken[] {
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
            translatedParts.push(matches[0]);
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
          result.push({ original: token, translated: matches[0], isWord: true, matched: true });
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
