import {
  lookupPronunciation,
  lookupPhonemeKey,
  sortByFrequency,
  getWordFrequency,
  hasCustomPronunciation,
} from '@ingglish/dictionary';
import { stripStress } from '@ingglish/phonemes';
import type { OutputFormat } from '@ingglish/phonemes';
import { arpabetToIPARaw } from '@ingglish/ipa';
import { translateWord } from 'ingglish';
import { diagnoseUnknown, matchBritish, isInitialism, translateAsAcronym } from '@ingglish/fallback';
import type { WordDiagnosis } from '@ingglish/fallback';

export interface WordResult {
  word: string;
  phonemes: string[] | null;
  ipa: string;
  ingglish: string;
  formatted: string;
  matched: boolean;
  isCustom: boolean;
  homophones: string[];
  frequency: number | undefined;
  diagnosis?: WordDiagnosis;
  britishSpelling?: string; // dictionary-word British badge only
}

export function analyzeWord(word: string, format: OutputFormat): WordResult {
  const lower = word.toLowerCase().trim();
  const dictPhonemes = lookupPronunciation(lower);
  const isCustom = hasCustomPronunciation(lower);
  const formatted = translateWord(lower, format);
  const ingglish = translateWord(lower, 'ingglish');

  // Initialisms (URL, API, etc.) pass through unchanged in the translation,
  // but we tag them so the breakdown shows how they're pronounced letter-by-letter.
  // Check before the dictionary branch since some (e.g. "url") are also in CMU.
  if (isInitialism(lower)) {
    return {
      word: lower,
      phonemes: null,
      ipa: translateAsAcronym(lower, 'ipa').replace(/^\/|\/$/g, ''),
      ingglish,
      formatted,
      matched: true,
      isCustom,
      homophones: [],
      frequency: getWordFrequency(lower),
      diagnosis: { strategy: 'initialism' },
    };
  }

  if (dictPhonemes !== null) {
    const ipa = arpabetToIPARaw(dictPhonemes);
    const key = dictPhonemes.map(stripStress).join(' ');
    const reverseMatches = lookupPhonemeKey(key);
    const homophones =
      reverseMatches !== undefined ? sortByFrequency(reverseMatches).filter((w) => w !== lower) : [];

    // Check if this dictionary word is a British variant (colour→color, centre→center)
    const britishMatch = matchBritish(lower);

    return {
      word: lower,
      phonemes: dictPhonemes,
      ipa,
      ingglish,
      formatted,
      matched: true,
      isCustom,
      homophones,
      frequency: getWordFrequency(lower),
      britishSpelling: britishMatch?.american,
    };
  }

  // Word not in dictionary — diagnose which fallback strategy handles it
  const ipa = translateWord(lower, 'ipa').replace(/^\/|\/$/g, '');
  const diagnosis = diagnoseUnknown(lower) ?? undefined;

  // Extract phonemes from diagnosis for the PhonemeChain display
  const phonemes =
    diagnosis?.strategy === 'custom'
      ? diagnosis.phonemes
      : diagnosis?.strategy === 'british'
        ? diagnosis.phonemes
        : diagnosis?.strategy === 'phonemize'
          ? diagnosis.phonemes
          : diagnosis?.strategy === 'g2p'
            ? diagnosis.trace.phonemes
            : null;

  return {
    word: lower,
    phonemes,
    ipa,
    ingglish,
    formatted,
    matched: false,
    isCustom,
    homophones: [],
    frequency: getWordFrequency(lower),
    diagnosis,
  };
}

export function formatFrequency(freq: number | undefined): string {
  if (freq === undefined) {
    return 'rare';
  }
  if (freq >= 1000) {
    return `${(freq / 1000).toFixed(1)}k`;
  }
  return String(freq);
}

export function fallbackLabel(strategy: WordDiagnosis['strategy'] | undefined): string {
  switch (strategy) {
    case 'custom':
      return 'custom override';
    case 'initialism':
      return 'initialism';
    case 'british':
      return 'British spelling';
    case 'compound':
      return 'compound word';
    case 'stemming':
      return 'stemmed';
    case 'phonemize':
      return 'neural G2P';
    case 'g2p':
      return 'G2P rules';
    case undefined:
      return 'passthrough';
  }
}
