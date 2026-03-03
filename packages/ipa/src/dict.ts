import {
  applyCasePattern,
  detectCasePattern,
  normalizeApostrophes,
  stripDiacritics,
} from '@ingglish/normalize';
import {
  arpabetToFormat,
  arpabetToIngglish,
  getFormatPreservesCase,
  getStress,
  isVowel,
  stripStress,
} from '@ingglish/phonemes';
import type { OutputFormat, TranslatedToken } from '@ingglish/phonemes';
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

// Pre-compiled regexes (avoid per-call RegExp object creation)
const IPA_SLASH_RE = /^\/|\/$/g;
const WHITESPACE_SPLIT_RE = /(\s+)/;
const WHITESPACE_RE = /^\s+$/;
// Include \p{M} (combining marks) so Odia/Khmer vowel signs aren't stripped
const LEADING_NON_LETTER_RE = /^[^\p{L}\p{M}]/u;
const TRAILING_NON_LETTER_RE = /[^\p{L}\p{M}]$/u;
const CONTRACTION_SPLIT_RE = /(?<=['-])|(?=['-])/;

/**
 * Unified phoneme dictionary type. Entries are ARPAbet arrays, converted
 * from IPA at build time. English and foreign dicts share the same format.
 */
export interface PhoneDict {
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
const khmerSegmenter =
  typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter('km', { granularity: 'word' })
    : undefined;

export interface Language {
  code: string;
  label: string;
}

/** Insert spaces between adjacent Khmer words that have no separator. */
export function segmentKhmerText(text: string): string {
  if (khmerSegmenter === undefined) {
    return text;
  }
  // Replace zero-width spaces (common Khmer word boundary marker) with real spaces
  const normalized = text.replaceAll('\u200B', ' ');
  const segments = [...khmerSegmenter.segment(normalized)];
  let result = '';
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;
    result += seg.segment;
    // Insert space between adjacent word-like segments (no existing separator)
    const next = segments[i + 1];
    if (seg.isWordLike === true && next?.isWordLike === true) {
      result += ' ';
    }
  }
  return result;
}

export const LANGUAGES: Language[] = [
  { code: 'ar', label: 'Arabic' },
  { code: 'yue', label: 'Cantonese' },
  { code: 'nl', label: 'Dutch' },
  { code: 'en', label: 'English' },
  { code: 'eo', label: 'Esperanto' },
  { code: 'fi', label: 'Finnish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'is', label: 'Icelandic' },
  { code: 'ja', label: 'Japanese' },
  { code: 'km', label: 'Khmer' },
  { code: 'ko', label: 'Korean' },
  { code: 'ma', label: 'Malay' },
  { code: 'zh', label: 'Mandarin' },
  { code: 'nb', label: 'Norwegian' },
  { code: 'or', label: 'Odia' },
  { code: 'fa', label: 'Persian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ro', label: 'Romanian' },
  { code: 'es', label: 'Spanish' },
  { code: 'sw', label: 'Swahili' },
  { code: 'sv', label: 'Swedish' },
  { code: 'vi', label: 'Vietnamese' },
];

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
 * Converts an IPA transcription to Ingglish spelling.
 * Strips slashes and syllable dots before conversion.
 */
export function ipaToIngglish(ipa: string): string {
  const clean = ipa.replaceAll(IPA_SLASH_RE, '').replaceAll('.', '');
  const arpabet = ipaToArpabet(clean);
  return arpabetToIngglish(arpabet);
}

/**
 * Look up a word in a PhoneDict, returning ARPAbet string[] or undefined.
 * Tries: overrides → exact → lowercase → title → accent-stripped → ß→ss →
 * curly apostrophes → word resolvers → apostrophe splitting → confident G2P.
 */
export function lookupDict(dict: PhoneDict, word: string): string[] | undefined {
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
  // German ß→ss normalization (e.g. "Bewußtsein" → dict["Bewusstsein"])
  if (lower.includes('ß')) {
    const ssLower = lower.replaceAll('ß', 'ss');
    const ssTitle = ssLower.charAt(0).toUpperCase() + ssLower.slice(1);
    return entries[ssLower] ?? entries[ssTitle];
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
  cached = {};
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

  if (lower.includes('ß')) {
    const ssLower = lower.replaceAll('ß', 'ss');
    const ssTitle = ssLower.charAt(0).toUpperCase() + ssLower.slice(1);
    return entries[ssLower] ?? entries[ssTitle];
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

/**
 * Converts ARPAbet phonemes to the specified output format with foreign-language options.
 * Disables English R-coloring rules since foreign languages treat R as
 * a regular consonant (e.g. Korean 사랑 → "sarang" not "sarrang").
 */
function arpabetToFormatForeign(arpabet: string[], format: OutputFormat): string {
  return arpabetToFormat(arpabet, format, { disableRColoring: true });
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
 * Check if a word's first character belongs to a caseless script
 * (e.g. Arabic, Japanese, Chinese, Korean) where toUpperCase === toLowerCase.
 */
function isCaselessWord(word: string): boolean {
  const ch = word[0];
  return ch !== undefined && ch.toUpperCase() === ch.toLowerCase();
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

/** Sentence-ending punctuation (Latin and CJK) */
const SENTENCE_END_RE = /[.!?。！？]$/;

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
    if (!key) {
      continue;
    }
    const existing = map.get(key);
    if (existing) {
      existing.push(word);
    } else {
      map.set(key, [word]);
    }
  }

  return map;
}

// ============================================================================
// Forward Translation (source language → Ingglish)
// ============================================================================

/**
 * Translates foreign text to the specified output format.
 * Words not found in the dictionary are returned with a marker prefix.
 *
 * For caseless scripts (Arabic, Japanese, Chinese, Korean), sentence-initial
 * words are automatically capitalized in the output.
 */
export function translateDict(
  text: string,
  dict: PhoneDict,
  format: OutputFormat = 'ingglish'
): string {
  const tokens = translateDictWithMapping(text, dict, format);
  return tokens
    .map((t) => (!t.matched && t.isWord ? NOT_FOUND_MARKER + t.original : t.translated))
    .join('');
}

/**
 * Like {@link translateDict}, but returns token-by-token mappings instead of a string.
 * Each token includes the original text, translation, and whether it matched the dictionary.
 */
export function translateDictWithMapping(
  text: string,
  dict: PhoneDict,
  format: OutputFormat = 'ingglish'
): TranslatedToken[] {
  const { lang } = dict;
  let atSentenceStart = true;

  // Khmer has no inherent word boundaries — segment before processing
  const processed = lang === 'km' ? segmentKhmerText(text) : text;

  const tokens: TranslatedToken[] = [];

  for (const segment of normalizeApostrophes(processed).split(WHITESPACE_SPLIT_RE)) {
    // Preserve whitespace segments as-is
    if (WHITESPACE_RE.test(segment)) {
      tokens.push({ isWord: false, matched: true, original: segment, translated: segment });
      continue;
    }
    if (!segment) {
      continue;
    }

    // Strip leading/trailing punctuation for lookup
    const leading: string[] = [];
    const trailing: string[] = [];
    let core = segment;

    // Peel off leading non-letter characters (Unicode-aware so Arabic/CJK aren't stripped)
    while (core.length > 0 && LEADING_NON_LETTER_RE.test(core)) {
      leading.push(core[0]!);
      core = core.slice(1);
    }
    // Peel off trailing non-letter characters
    while (core.length > 0 && TRAILING_NON_LETTER_RE.test(core)) {
      trailing.unshift(core.at(-1)!);
      core = core.slice(0, -1);
    }

    if (!core) {
      tokens.push({ isWord: false, matched: true, original: segment, translated: segment });
      continue;
    }

    let casePattern = detectCasePattern(core);
    const preservesCase = getFormatPreservesCase(format);

    // For caseless scripts, capitalize sentence-initial words
    if (atSentenceStart && preservesCase && casePattern === 'lower' && isCaselessWord(core)) {
      casePattern = 'capitalized';
    }

    // Update sentence tracking: sentence ends after . ! ? 。 ！ ？
    atSentenceStart = SENTENCE_END_RE.test(trailing.join(''));

    const leadStr = leading.join('');
    const trailStr = trailing.join('');

    const phonemes = lookupDict(dict, core);
    if (phonemes) {
      const translated = arpabetToFormatForeign(phonemes, format);
      const cased = preservesCase ? applyCasePattern(translated, casePattern) : translated;
      tokens.push({
        isWord: true,
        matched: true,
        original: segment,
        translated: leadStr + cased + trailStr,
      });
      continue;
    }

    // Try splitting on apostrophes/hyphens (French contractions: l'essentiel, s'il, allez-vous)
    const parts = core.split(CONTRACTION_SPLIT_RE);
    if (parts.length > 1) {
      // Collect phonemes for each non-separator part
      const partPhonemes: (string[] | undefined)[] = parts.map((part, i) => {
        if (part === "'" || part === '-') {
          return;
        }
        let phonemes: string[] | undefined;
        // In contraction context, prefer clitic form (d' → /d‿/) over
        // bare letter name (d → /de/) so the consonant merges naturally
        if (parts[i + 1] === "'") {
          phonemes = lookupDict(dict, part + "'");
        }
        phonemes ??= lookupDict(dict, part);
        return phonemes;
      });

      const allFound = parts.every(
        (part, i) => part === "'" || part === '-' || partPhonemes[i] !== undefined
      );

      if (allFound) {
        // Merge phonemes across apostrophes, keep hyphens as group separators.
        // French clitics (l', s', d') flow into the next word phonetically
        // (e.g. l'ordre → /lɔʁdʁ/ → "lawrdr", not "el'awrdr").
        const groups: string[][] = [[]];
        for (const [i, part_] of parts.entries()) {
          const part = part_;
          if (part === "'") {
            continue;
          }
          if (part === '-') {
            groups.push([]);
            continue;
          }
          const ph = partPhonemes[i]!;
          groups.at(-1)!.push(...ph);
        }
        const translated = groups.map((ph) => arpabetToFormatForeign(ph, format)).join('-');
        const cased = preservesCase ? applyCasePattern(translated, casePattern) : translated;
        tokens.push({
          isWord: true,
          matched: true,
          original: segment,
          translated: leadStr + cased + trailStr,
        });
        continue;
      }

      // Fallback: some parts not found — translate each independently
      let isFirstPart = true;
      const translated = parts.map((part, i) => {
        if (part === "'" || part === '-') {
          return part;
        }
        const partCase = isFirstPart ? casePattern : detectCasePattern(part);
        isFirstPart = false;
        const partPh = partPhonemes[i];
        if (partPh) {
          const partTranslated = arpabetToFormatForeign(partPh, format);
          return preservesCase ? applyCasePattern(partTranslated, partCase) : partTranslated;
        }
        return NOT_FOUND_MARKER + part;
      });
      if (
        translated.some(
          (t, i) => parts[i] !== "'" && parts[i] !== '-' && !t.startsWith(NOT_FOUND_MARKER)
        )
      ) {
        // Partial match — strip NOT_FOUND_MARKERs in the token translated text
        const translatedText = translated.map((t) => t.replaceAll(NOT_FOUND_MARKER, '')).join('');
        tokens.push({
          isWord: true,
          matched: false,
          original: segment,
          translated: leadStr + translatedText + trailStr,
        });
        continue;
      }
    }

    // Not found — return original
    tokens.push({ isWord: true, matched: false, original: segment, translated: segment });
  }

  return tokens;
}
