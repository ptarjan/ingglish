import { translateWord } from 'ingglish';
import {
  lookupPronunciation,
  lookupPhonemeKey,
  sortByFrequency,
  getWordFrequency,
  hasCustomPronunciation,
} from '@ingglish/dictionary';
import type { WordDiagnosis } from '@ingglish/fallback';
import {
  diagnoseUnknown,
  isInitialism,
  matchBritish,
  translateAsAcronym,
} from '@ingglish/fallback';
import { arpabetToIPARaw } from '@ingglish/ipa';
import type { OutputFormat } from '@ingglish/phonemes';
import { stripStress } from '@ingglish/phonemes';

export interface WordResult {
  britishSpelling?: string; // dictionary-word British badge only
  diagnosis?: WordDiagnosis;
  formatted: string;
  frequency: number | undefined;
  homophones: string[];
  ingglish: string;
  ipa: string;
  isCustom: boolean;
  matched: boolean;
  phonemes: null | string[];
  word: string;
}

export function analyzeWord(word: string, format: OutputFormat): WordResult {
  const lower = word.toLowerCase().trim();
  const dictPhonemes = lookupPronunciation(lower);
  const isCustom = hasCustomPronunciation(lower);
  const formatted = translateWord(lower, { format });
  const ingglish = translateWord(lower, { format: 'ingglish' });

  // Initialisms (URL, API, etc.) pass through unchanged in the translation,
  // but we tag them so the breakdown shows how they're pronounced letter-by-letter.
  // Check before the dictionary branch since some (e.g. "url") are also in CMU.
  if (isInitialism(lower)) {
    return {
      diagnosis: { strategy: 'initialism' },
      formatted,
      frequency: getWordFrequency(lower),
      homophones: [],
      ingglish,
      ipa: translateAsAcronym(lower, 'ipa').replaceAll(/^\/|\/$/g, ''),
      isCustom,
      matched: true,
      phonemes: null,
      word: lower,
    };
  }

  if (dictPhonemes !== null) {
    const ipa = arpabetToIPARaw(dictPhonemes);
    const key = dictPhonemes.map((p) => stripStress(p)).join(' ');
    const reverseMatches = lookupPhonemeKey(key);
    const homophones =
      reverseMatches === undefined
        ? []
        : sortByFrequency(reverseMatches).filter((w) => w !== lower);

    // Check if this dictionary word is a British variant (colour→color, centre→center)
    const britishMatch = matchBritish(lower);

    return {
      britishSpelling: britishMatch?.american,
      formatted,
      frequency: getWordFrequency(lower),
      homophones,
      ingglish,
      ipa,
      isCustom,
      matched: true,
      phonemes: dictPhonemes,
      word: lower,
    };
  }

  // Word not in dictionary — diagnose which fallback strategy handles it
  const ipa = translateWord(lower, { format: 'ipa' }).replaceAll(/^\/|\/$/g, '');
  const diagnosis = diagnoseUnknown(lower) ?? undefined;

  // Extract phonemes from diagnosis for the PhonemeChain display
  const phonemes = extractDiagnosisPhonemes(diagnosis);

  return {
    diagnosis,
    formatted,
    frequency: getWordFrequency(lower),
    homophones: [],
    ingglish,
    ipa,
    isCustom,
    matched: false,
    phonemes,
    word: lower,
  };
}

export function fallbackLabel(strategy: undefined | WordDiagnosis['strategy']): string {
  switch (strategy) {
    case 'british': {
      return 'British spelling';
    }
    case 'compound': {
      return 'compound word';
    }
    case 'custom': {
      return 'custom override';
    }
    case 'g2p': {
      return 'G2P rules';
    }
    case 'initialism': {
      return 'initialism';
    }
    case 'stemming': {
      return 'stemmed';
    }
    case undefined: {
      return 'passthrough';
    }
  }
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

function extractDiagnosisPhonemes(diagnosis: undefined | WordDiagnosis): null | string[] {
  if (diagnosis?.strategy === 'custom' || diagnosis?.strategy === 'british') {
    return diagnosis.phonemes;
  }
  if (diagnosis?.strategy === 'g2p') {
    return diagnosis.trace.phonemes;
  }
  return null;
}
