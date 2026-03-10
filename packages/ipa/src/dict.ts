import { stripDiacritics } from '@ingglish/normalize';
import { getStress, isVowel, stripStress } from '@ingglish/phonemes';
import { ipaToArpabet } from './from-ipa';
import { G2P_CONVERTERS } from './g2p';
import { IPA_LANGUAGE_OVERRIDES } from './ipa-maps';
import { ar } from './overrides/ar';
import { de } from './overrides/de';
import { eo } from './overrides/eo';
import { es } from './overrides/es';
import { fa } from './overrides/fa';
import { fi } from './overrides/fi';
import { fr } from './overrides/fr';
import { is } from './overrides/is';
import { ja } from './overrides/ja';
import { km } from './overrides/km';
import { ko } from './overrides/ko';
import { ma } from './overrides/ma';
import { nb } from './overrides/nb';
import { nl } from './overrides/nl';
import { or_ } from './overrides/or';
import { pt } from './overrides/pt';
import { ro } from './overrides/ro';
import { sv } from './overrides/sv';
import { sw } from './overrides/sw';
import { vi } from './overrides/vi';
import { WORD_RESOLVERS } from './resolvers';

/**
 * Creates a null-prototype copy of a record. Prevents prototype pollution
 * (e.g. `entries["constructor"]` returning `Object.prototype.constructor`).
 */
export function toNullProto<V>(obj: Record<string, V>): Record<string, V> {
  return Object.assign(Object.create(null) as Record<string, V>, obj);
}

// Pre-compiled regexes (avoid per-call RegExp object creation)
const IPA_SLASH_RE = /^\/|\/$/g;

/**
 * Unified phoneme dictionary type. Entries are ARPAbet arrays, converted
 * from IPA at build time. English and foreign dicts share the same format.
 */
export interface PhoneDict {
  /** Pronouns capitalized by convention, not phonetics (e.g. English "I"). Lowered in contraction output. */
  conventionalCapitals?: Set<string>;
  /** True for non-English languages — disables English R-coloring rules. */
  disableRColoring?: boolean;
  entries: Record<string, string[]>;
  lang: string;
  /** True for non-Latin scripts (Arabic, CJK, Khmer) — uses Unicode tokenizer. */
  nonLatinScript?: boolean;
  /** Pre-process text before tokenization (e.g. Khmer word segmentation). */
  preprocess?: (text: string) => string;
}

/**
 * Khmer word segmenter. Khmer script has no inherent word boundaries,
 * so we use Intl.Segmenter to insert spaces between words.
 */
// =============================================================================
// Word segmentation for spaceless scripts
// =============================================================================

const HAS_INTL_SEGMENTER = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function';

/**
 * Create a word segmenter for a given locale. Returns a function that inserts
 * spaces between adjacent word-like segments. Used for scripts that don't use
 * spaces (Chinese, Japanese, Khmer).
 */
function makeSegmenter(
  locale: string,
  options?: { normalizeZWS?: boolean }
): (text: string) => string {
  /* c8 ignore start */
  if (!HAS_INTL_SEGMENTER) {
    return (text: string) => text;
  }
  /* c8 ignore stop */
  const segmenter = new Intl.Segmenter(locale, { granularity: 'word' });
  const normalizeZWS = options?.normalizeZWS === true;
  return (text: string): string => {
    const input = normalizeZWS ? text.replaceAll('\u200B', ' ') : text;
    const segments = [...segmenter.segment(input)];
    let result = '';
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]!;
      result += seg.segment;
      const next = segments[i + 1];
      if (seg.isWordLike === true && next?.isWordLike === true) {
        result += ' ';
      }
    }
    return result;
  };
}

export const segmentChineseText = makeSegmenter('zh');
export const segmentJapaneseText = makeSegmenter('ja');
export const segmentKhmerText = makeSegmenter('km', { normalizeZWS: true });

export interface Language {
  code: string;
  /** Pronouns capitalized by convention, not phonetics (e.g. English "I"). */
  conventionalCapitals?: Set<string>;
  disableRColoring?: boolean;
  label: string;
  nonLatinScript?: boolean;
  preprocess?: (text: string) => string;
}

export const LANGUAGES: Language[] = [
  { code: 'ar', disableRColoring: true, label: 'Arabic', nonLatinScript: true },
  {
    code: 'yue',
    disableRColoring: true,
    label: 'Cantonese',
    nonLatinScript: true,
    preprocess: segmentChineseText,
  },
  { code: 'nl', disableRColoring: true, label: 'Dutch' },
  { code: 'en', conventionalCapitals: new Set(['I']), label: 'English' },
  { code: 'eo', disableRColoring: true, label: 'Esperanto' },
  { code: 'fi', disableRColoring: true, label: 'Finnish' },
  { code: 'fr', disableRColoring: true, label: 'French' },
  { code: 'de', disableRColoring: true, label: 'German' },
  { code: 'is', disableRColoring: true, label: 'Icelandic' },
  {
    code: 'ja',
    disableRColoring: true,
    label: 'Japanese',
    nonLatinScript: true,
    preprocess: segmentJapaneseText,
  },
  {
    code: 'km',
    disableRColoring: true,
    label: 'Khmer',
    nonLatinScript: true,
    preprocess: segmentKhmerText,
  },
  { code: 'ko', disableRColoring: true, label: 'Korean', nonLatinScript: true },
  { code: 'ma', disableRColoring: true, label: 'Malay' },
  {
    code: 'zh',
    disableRColoring: true,
    label: 'Mandarin',
    nonLatinScript: true,
    preprocess: segmentChineseText,
  },
  { code: 'nb', disableRColoring: true, label: 'Norwegian' },
  { code: 'or', disableRColoring: true, label: 'Odia', nonLatinScript: true },
  { code: 'fa', disableRColoring: true, label: 'Persian', nonLatinScript: true },
  { code: 'pt', disableRColoring: true, label: 'Portuguese' },
  { code: 'ro', disableRColoring: true, label: 'Romanian' },
  { code: 'es', disableRColoring: true, label: 'Spanish' },
  { code: 'sw', disableRColoring: true, label: 'Swahili' },
  { code: 'sv', disableRColoring: true, label: 'Swedish' },
  { code: 'vi', disableRColoring: true, label: 'Vietnamese' },
];

const LANG_MAP = new Map(LANGUAGES.map((l) => [l.code, l]));

/** Look up a Language by its code. */
export function getLanguage(code: string): Language | undefined {
  return LANG_MAP.get(code);
}

/**
 * Raw IPA word overrides per language (source format — IPA strings for readability).
 * Converted to ARPAbet at first access via getOverridesArpabet().
 */
const IPA_WORD_OVERRIDES_RAW: Record<string, Record<string, string>> = {
  ar,
  de,
  eo,
  es,
  fa,
  fi,
  fr,
  is,
  ja,
  km,
  ko,
  ma,
  nb,
  nl,
  or: or_,
  pt,
  ro,
  sv,
  sw,
  vi,
};

/** Cache of converted override maps: lang → word → ARPAbet string[] */
const overridesArpabetCache = new Map<string, Record<string, string[]>>();

/**
 * Look up a word in a PhoneDict, returning ARPAbet string[] or undefined.
 * Tries: overrides → exact → lowercase → title → accent-stripped →
 * curly apostrophes → word resolvers → apostrophe splitting → confident G2P.
 */
export function lookupDict(dict: PhoneDict, rawWord: string): string[] | undefined {
  // Normalize curly apostrophes to straight (U+2019 → U+0027)
  const word = rawWord.includes('\u2019') ? rawWord.replaceAll('\u2019', "'") : rawWord;
  const { entries, lang } = dict;
  const overrides = getOverridesArpabet(lang);
  const override = overrides?.[word] ?? overrides?.[word.toLowerCase()];
  if (override) {
    return override;
  }
  // Try exact, lowercase, title case, accent-stripped, then ß→ss normalization
  const lower = word.toLowerCase();
  const title = lower.charAt(0).toUpperCase() + lower.slice(1);
  const stripped = stripDiacritics(lower);
  const directHit = entries[word] ?? entries[lower] ?? entries[title] ?? entries[stripped];
  if (directHit) {
    return directHit;
  }
  // Some dicts use curly apostrophes (U+2019) — try matching if word has straight ones
  if (word.includes("'")) {
    const curly = word.replaceAll("'", '\u2019');
    const curlyLower = curly.toLowerCase();
    const curlyResult = entries[curly] ?? entries[curlyLower];
    if (curlyResult) {
      return curlyResult;
    }
  }
  // Language-specific word resolution (inflection stripping, compounds, spelling normalization)
  if (Object.hasOwn(WORD_RESOLVERS, lang)) {
    const resolved = WORD_RESOLVERS[lang]!(entries, lower);
    if (resolved) {
      return resolved;
    }
  }
  // Apostrophe splitting (all languages: English contractions, French clitics, etc.)
  if (word.includes("'")) {
    const parts = word.split(/(?<=')|(?=')/);
    if (parts.length > 1) {
      const merged: string[] = [];
      let allFound = true;
      for (let i = 0; i < parts.length; i++) {
        if (parts[i] === "'") {
          continue;
        }
        const part = parts[i]!;
        let ph: string[] | undefined;
        // In contraction context, prefer clitic form (d' → /d‿/) over bare letter name.
        // Use lookupDictNoSplit to avoid infinite recursion (clitic form has apostrophe).
        if (parts[i + 1] === "'") {
          ph = lookupDictNoSplit(dict, part + "'");
        }
        ph ??= lookupDictNoSplit(dict, part);
        if (!ph) {
          allFound = false;
          break;
        }
        merged.push(...ph);
      }
      if (allFound && merged.length > 0) {
        return merged;
      }
    }
  }
  // G2P fallback — only for confident converters (phonetically regular languages)
  const g2p = G2P_CONVERTERS[lang];
  if (g2p?.confident === true) {
    return g2p.convert(lower);
  }
  return undefined;
}

/** Get ARPAbet-converted overrides for a language (lazy, one-time per language). */
function getOverridesArpabet(lang: string): Record<string, string[]> | undefined {
  const raw = IPA_WORD_OVERRIDES_RAW[lang];
  if (!raw) {
    return undefined;
  }
  let cached = overridesArpabetCache.get(lang);
  if (cached) {
    return cached;
  }
  const langOverrides = IPA_LANGUAGE_OVERRIDES[lang];
  cached = Object.create(null) as Record<string, string[]>;
  for (const [word, ipa] of Object.entries(raw)) {
    const clean = ipa.replaceAll(IPA_SLASH_RE, '').replaceAll('.', '');
    cached[word] = applyDefaultStress(ipaToArpabet(clean, langOverrides));
  }
  overridesArpabetCache.set(lang, cached);
  return cached;
}

/**
 * Core lookup without apostrophe splitting. Used by apostrophe splitting
 * to avoid infinite recursion (clitic forms like "d'" contain apostrophes).
 */
/* v8 ignore start — lookupDictNoSplit is only reachable via lookupDict's apostrophe
   splitting path, which is called from core's translateSync. Vitest's source map
   remapping loses coverage attribution across package boundaries. */
function lookupDictNoSplit(dict: PhoneDict, word: string): string[] | undefined {
  const { entries, lang } = dict;
  const overrides = getOverridesArpabet(lang);
  const override = overrides?.[word] ?? overrides?.[word.toLowerCase()];
  if (override) {
    return override;
  }

  const lower = word.toLowerCase();
  const title = lower.charAt(0).toUpperCase() + lower.slice(1);
  const stripped = stripDiacritics(lower);
  const directHit = entries[word] ?? entries[lower] ?? entries[title] ?? entries[stripped];
  if (directHit) {
    return directHit;
  }

  if (word.includes("'")) {
    const curly = word.replaceAll("'", '\u2019');
    const curlyLower = curly.toLowerCase();
    const curlyResult = entries[curly] ?? entries[curlyLower];
    if (curlyResult) {
      return curlyResult;
    }
  }
  if (Object.hasOwn(WORD_RESOLVERS, lang)) {
    const resolved = WORD_RESOLVERS[lang]!(entries, lower);
    if (resolved) {
      return resolved;
    }
  }
  const g2p = G2P_CONVERTERS[lang];
  if (g2p?.confident === true) {
    return g2p.convert(lower);
  }
  return undefined;
}
/* v8 ignore stop */

/**
 * Merged Khmer dict (raw dict + overrides) and its keys sorted longest-first.
 * Compound decomposition must search overrides too, not just the raw dict,
 * because browser segmenters can produce words whose parts only exist in overrides.
 */
let khmerMergedDict: Record<string, string[]> | undefined;
let khmerDictKeys: string[] | undefined;

/**
 * If no vowel in the ARPAbet array carries a stress digit, apply stress 1
 * to the last vowel. This gives useful Guide-mode output for languages
 * whose IPA dictionaries omit stress (e.g. French, where stress is always
 * on the final syllable).
 */
function applyDefaultStress(arpabet: string[]): string[] {
  const hasStress = arpabet.some((p) => isVowel(p) && getStress(p) !== null);
  if (hasStress) {
    return arpabet;
  }
  // Find the last vowel and give it primary stress
  const result = [...arpabet];
  for (let i = result.length - 1; i >= 0; i--) {
    if (isVowel(result[i]!)) {
      result[i] = result[i]! + '1';
      break;
    }
  }
  return result;
}

function decomposeKhmer(
  dict: Record<string, string[]>,
  keys: string[],
  remaining: string,
  acc: string[][]
): null | string[][] {
  if (remaining.length === 0) {
    return acc;
  }
  for (const key of keys) {
    const phonemes = dict[key];
    if (remaining.startsWith(key) && phonemes !== undefined) {
      const result = decomposeKhmer(dict, keys, remaining.slice(key.length), [...acc, phonemes]);
      if (result !== null) {
        return result;
      }
    }
  }
  return null;
}

/**
 * Try to decompose a Khmer compound into known dictionary entries.
 * Uses longest-match-first greedy segmentation. Returns concatenated ARPAbet or undefined.
 * Searches both the dict and Khmer overrides so that browser-segmented
 * compounds whose parts only exist in overrides (e.g. ថ្នែក, សតិ) can still decompose.
 */
function lookupKhmerCompound(
  entries: Record<string, string[]>,
  word: string
): string[] | undefined {
  if (khmerMergedDict === undefined) {
    khmerMergedDict = { ...entries };
    const overrides = getOverridesArpabet('km');
    if (overrides) {
      for (const [k, v] of Object.entries(overrides)) {
        khmerMergedDict[k] = v;
      }
    }
  }
  // Sort keys longest-first for greedy matching. Single-codepoint entries (e.g. ឬ "or")
  // are included since decomposeKhmer backtracks if they lead to dead ends.
  khmerDictKeys ??= Object.keys(khmerMergedDict).toSorted((a, b) => b.length - a.length);
  const parts = decomposeKhmer(khmerMergedDict, khmerDictKeys, word, []);
  if (parts === null || parts.length < 2) {
    return undefined;
  }
  // Concatenate ARPAbet arrays of all parts
  return parts.flat();
}

// Register Khmer word resolver (greedy compound segmentation)
WORD_RESOLVERS.km = (entries, word) => lookupKhmerCompound(entries, word);

/** Marker for words not found in the dictionary */
export const NOT_FOUND_MARKER = '\u{FFFD}'; // Unicode replacement character

/**
 * Builds a reverse map from a PhoneDict: stress-free ARPAbet key → source words.
 * Used for reverse-translating Ingglish back to the source language.
 *
 * Processes both dictionary entries and per-language overrides.
 * Overrides take priority (their phonemes are used when a word exists in both).
 */
export function buildReverseMap(dict: PhoneDict): Map<string, string[]> {
  const { entries, lang } = dict;
  const wordOverrides = getOverridesArpabet(lang);

  // Merge entries with overrides (overrides win)
  const allWords = new Map<string, string[]>();
  for (const [word, phonemes] of Object.entries(entries)) {
    allWords.set(word, phonemes);
  }
  if (wordOverrides) {
    for (const [word, phonemes] of Object.entries(wordOverrides)) {
      allWords.set(word, phonemes);
    }
  }

  const map = new Map<string, string[]>();
  for (const [word, arpabet] of allWords) {
    const key = arpabet.map((p) => stripStress(p)).join(' ');
    /* v8 ignore start -- defensive: all dict entries have phonemes */
    if (!key) {
      continue;
    }
    /* v8 ignore stop */
    const existing = map.get(key);
    if (existing) {
      existing.push(word);
    } else {
      map.set(key, [word]);
    }
  }

  return map;
}

/**
 * Converts IPA string entries to ARPAbet arrays.
 * Some dict files store entries as IPA strings (e.g. "/bɔ̃.ʒuʁ/") instead of
 * pre-converted ARPAbet arrays (e.g. ["B", "AO1", "N", "ZH", "UH1", "R"]).
 * This detects and converts them so the pipeline works uniformly.
 */
export function convertIpaEntries(
  raw: Record<string, string | string[]>,
  langCode: string
): Record<string, string[]> {
  // Check first entry to detect format
  const firstValue = Object.values(raw)[0];
  if (firstValue === undefined || Array.isArray(firstValue)) {
    return toNullProto(raw as Record<string, string[]>);
  }

  // Entries are IPA strings — convert to ARPAbet
  const overrides = IPA_LANGUAGE_OVERRIDES[langCode];
  const result: Record<string, string[]> = Object.create(null) as Record<string, string[]>;
  for (const [word, ipa] of Object.entries(raw)) {
    const clean = (ipa as string).replaceAll(IPA_SLASH_RE, '').replaceAll('.', '');
    const arpabet = applyDefaultStress(ipaToArpabet(clean, overrides));
    if (arpabet.length > 0) {
      result[word] = arpabet;
    }
  }
  return result;
}
