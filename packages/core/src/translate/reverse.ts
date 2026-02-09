/**
 * Reverse translation: Ingglish/IPA -> English.
 *
 * Uses ARPAbet matching to find English words that would produce
 * the given spelling. Handles homophones by preferring more common
 * words based on frequency data.
 */

import { lookupPhonemeKey } from '../dictionary/reverse';
import { sortByFrequency } from '../dictionary/frequency';
import { detectCasePattern, applyCasePattern } from '../utils/case';
import {
  normalizeApostrophes,
  tokenizeIPA,
  WORD_SPLIT_REGEX,
  WORD_TEST_REGEX,
  extractPreservedPatterns,
  restorePreservedPatterns,
} from '../utils/text';
import { ingglishToArpabet } from '../convert/from-ingglish';
import { ipaToArpabet } from '../convert/from-ipa';
import { STRESS_MARKER_REGEX } from '../phonemes/arpabet';
import type { OutputFormat } from '../types';

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
 * Converts IPA text to ARPAbet (stripping stress markers).
 */
export function ipaToArpabetClean(ipa: string): string[] | null {
  const arpabet = ipaToArpabet(ipa).map((p) => p.replace(STRESS_MARKER_REGEX, ''));
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

// ============================================================================
// Unified Reverse Translation
// ============================================================================

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
 * Translates text back to English from the specified format.
 * For homophones, uses the most common word.
 *
 * @param text - Text in Ingglish or IPA format
 * @param format - The input format ('ingglish' or 'ipa')
 * @returns English text
 */
export function reverseTranslateSync(text: string, format: OutputFormat = 'ingglish'): string {
  if (format === 'ipa') {
    return reverseTranslateIPATextInternal(text);
  }
  return reverseTranslateIngglishText(text);
}

// ============================================================================
// Reverse Translation with Mapping
// ============================================================================

/**
 * Represents a reverse-translated token with match status.
 */
export interface ReverseTranslatedToken {
  original: string;
  translated: string;
  isWord: boolean;
  matched: boolean;
}

/**
 * Reverse translates Ingglish text and returns token-by-token mappings
 * with match status. Used for visual indicators on unmatched words.
 * URLs and emails are preserved unchanged.
 */
export function reverseTranslateSyncWithMapping(
  text: string,
  _format: OutputFormat = 'ingglish'
): ReverseTranslatedToken[] {
  const normalizedText = normalizeApostrophes(text);
  const { text: textWithPlaceholders, preserved } = extractPreservedPatterns(normalizedText);

  const tokens = textWithPlaceholders.split(WORD_SPLIT_REGEX);
  const result: ReverseTranslatedToken[] = [];

  for (const token of tokens) {
    if (token.length === 0) {
      continue;
    }

    // Check for preserved patterns (URLs, emails)
    let foundPlaceholder = false;
    for (const [placeholder, original] of preserved) {
      if (token.includes(placeholder)) {
        const parts = token.split(placeholder);
        if (parts[0].length > 0) {
          result.push({ original: parts[0], translated: parts[0], isWord: false, matched: true });
        }
        result.push({ original, translated: original, isWord: false, matched: true });
        if (parts[1] && parts[1].length > 0) {
          result.push({ original: parts[1], translated: parts[1], isWord: false, matched: true });
        }
        foundPlaceholder = true;
        break;
      }
    }
    if (foundPlaceholder) {
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
