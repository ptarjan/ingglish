import {
  lookupPronunciation,
  lookupPhonemeKey,
  sortByFrequency,
  getWordFrequency,
  hasCustomPronunciation,
  getCustomPronunciation,
} from '@ingglish/dictionary';
import { stripStress } from '@ingglish/phonemes';
import type { OutputFormat } from '@ingglish/phonemes';
import { arpabetToIPARaw } from '@ingglish/ipa';
import { translateWord } from 'ingglish';
import { wordToArpabetTraced } from '@ingglish/g2p';
import type { G2PTrace } from '@ingglish/g2p';
import {
  diagnoseFallback,
  decomposeCompound,
  diagnoseStemming,
  diagnoseBritish,
  isInitialism,
  translateAsAcronym,
} from '@ingglish/fallback';
import type { FallbackStrategy, StemmingResult } from '@ingglish/fallback';

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
  g2pTrace?: G2PTrace;
  fallbackStrategy?: FallbackStrategy | null;
  compoundParts?: string[];
  stemmingResult?: StemmingResult;
  britishSpelling?: string;
}

export function analyzeWord(word: string, format: OutputFormat): WordResult {
  const lower = word.toLowerCase().trim();
  const dictPhonemes = lookupPronunciation(lower);
  const isCustom = hasCustomPronunciation(lower);
  const formatted = translateWord(lower, format);
  const ingglish = translateWord(lower, 'ingglish');
  let ipa = '';
  let homophones: string[] = [];
  let phonemes: string[] | null = dictPhonemes;
  let g2pTrace: G2PTrace | undefined;
  let fallbackStrategy: FallbackStrategy | null | undefined;
  let compoundParts: string[] | undefined;
  let stemmingResult: StemmingResult | undefined;

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
      fallbackStrategy: 'initialism',
    };
  }

  if (dictPhonemes !== null) {
    ipa = arpabetToIPARaw(dictPhonemes);
    const key = dictPhonemes.map(stripStress).join(' ');
    const reverseMatches = lookupPhonemeKey(key);
    if (reverseMatches !== undefined) {
      homophones = sortByFrequency(reverseMatches).filter((w) => w !== lower);
    }
  } else {
    ipa = translateWord(lower, 'ipa').replace(/^\/|\/$/g, '');
    fallbackStrategy = diagnoseFallback(lower);

    switch (fallbackStrategy) {
      case 'g2p': {
        const trace = wordToArpabetTraced(lower);
        g2pTrace = trace;
        phonemes = trace.phonemes;
        break;
      }
      case 'compound':
        compoundParts = decomposeCompound(lower) ?? undefined;
        break;
      case 'stemming':
        stemmingResult = diagnoseStemming(lower) ?? undefined;
        break;
      case 'custom':
        phonemes = getCustomPronunciation(lower) ?? null;
        break;
      case 'british':
      case 'initialism':
      case 'phonemize':
      case null:
        break;
    }
  }

  const britishSpelling = diagnoseBritish(lower) ?? undefined;

  return {
    word: lower,
    phonemes,
    ipa,
    ingglish,
    formatted,
    matched: dictPhonemes !== null,
    isCustom,
    homophones,
    frequency: getWordFrequency(lower),
    g2pTrace,
    fallbackStrategy,
    compoundParts,
    stemmingResult,
    britishSpelling,
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

export function fallbackLabel(strategy: FallbackStrategy | null | undefined): string {
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
    case null:
    case undefined:
      return 'passthrough';
  }
}
