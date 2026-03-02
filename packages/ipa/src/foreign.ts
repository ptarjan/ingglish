import {
  applyCasePattern,
  detectCasePattern,
  normalizeApostrophes,
  stripDiacritics,
} from '@ingglish/normalize';
import {
  arpabetToFormat,
  arpabetToIngglish,
  expandArpabetAlternatives,
  getFormatPreservesCase,
  getStress,
  ingglishToArpabet,
  isVowel,
  stripStress,
} from '@ingglish/phonemes';
import type { OutputFormat, TranslatedToken } from '@ingglish/phonemes';
import { ipaToArpabet } from './from-ipa';
import { G2P_CONVERTERS } from './g2p';
import { IPA_LANGUAGE_OVERRIDES } from './ipa-maps';
import { LEMMATIZERS } from './lemmatizers';
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

// Pre-compiled regexes (avoid per-call RegExp object creation)
const IPA_SLASH_RE = /^\/|\/$/g;
const WHITESPACE_SPLIT_RE = /(\s+)/;
const WHITESPACE_RE = /^\s+$/;
// Include \p{M} (combining marks) so Odia/Khmer vowel signs aren't stripped
const LEADING_NON_LETTER_RE = /^[^\p{L}\p{M}]/u;
const TRAILING_NON_LETTER_RE = /[^\p{L}\p{M}]$/u;
const CONTRACTION_SPLIT_RE = /(?<=['-])|(?=['-])/;

export interface IpaDict {
  entries: Record<string, string>;
  lang: string;
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
 * Word-level IPA overrides per language.
 *
 * Some IPA dictionary entries are incorrect or represent a different
 * word form. These overrides take priority over the dictionary.
 */
const IPA_WORD_OVERRIDES: Record<string, Record<string, string>> = {
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

/**
 * Converts an IPA transcription to Ingglish spelling.
 * Strips slashes and syllable dots before conversion.
 */
export function ipaToIngglish(ipa: string): string {
  const clean = ipa.replaceAll(IPA_SLASH_RE, '').replaceAll('.', '');
  const arpabet = ipaToArpabet(clean);
  return arpabetToIngglish(arpabet);
}

export function lookupIpa(dict: IpaDict, word: string): string | undefined {
  const { entries, lang } = dict;
  const override = getIpaOverride(lang, word) ?? getIpaOverride(lang, word.toLowerCase());
  if (override) {
    return override;
  }
  // Try exact, lowercase, title case, accent-stripped, then ß→ss normalization
  const lower = word.toLowerCase();
  const title = lower.charAt(0).toUpperCase() + lower.slice(1);
  const stripped = stripDiacritics(lower);
  if (entries[word] ?? entries[lower] ?? entries[title] ?? entries[stripped]) {
    return entries[word] ?? entries[lower] ?? entries[title] ?? entries[stripped];
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
  // Language-specific lemmatization (strip inflections, find base form)
  if (Object.hasOwn(LEMMATIZERS, lang)) {
    const lemmaResult = LEMMATIZERS[lang]!(entries, lower);
    if (lemmaResult) {
      return lemmaResult;
    }
  }
  // Khmer compound fallback: try splitting into dictionary entries (longest-match-first)
  if (lang === 'km') {
    const compound = lookupKhmerCompound(entries, word);
    if (compound !== undefined) {
      return compound;
    }
  }
  // G2P fallback for phonetically regular languages (Finnish, Esperanto, Swahili, Malay)
  if (Object.hasOwn(G2P_CONVERTERS, lang)) {
    return G2P_CONVERTERS[lang]!(lower);
  }
  return undefined;
}

/**
 * Merged Khmer dict (raw dict + overrides) and its keys sorted longest-first.
 * Compound decomposition must search overrides too, not just the raw dict,
 * because browser segmenters can produce words whose parts only exist in overrides.
 */
let khmerMergedDict: Record<string, string> | undefined;
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
  dict: Record<string, string>,
  keys: string[],
  remaining: string,
  acc: string[]
): null | string[] {
  if (remaining.length === 0) {
    return acc;
  }
  for (const key of keys) {
    const ipa = dict[key];
    if (remaining.startsWith(key) && ipa !== undefined) {
      const result = decomposeKhmer(dict, keys, remaining.slice(key.length), [...acc, ipa]);
      if (result !== null) {
        return result;
      }
    }
  }
  return null;
}

function getIpaOverride(lang: string, word: string): string | undefined {
  return IPA_WORD_OVERRIDES[lang]?.[word];
}

/**
 * Converts an IPA transcription to the specified output format.
 * Accepts optional language code for language-specific IPA overrides.
 * Disables English R-coloring rules since foreign languages treat R as
 * a regular consonant (e.g. Korean 사랑 → "sarang" not "sarrang").
 */
function ipaToFormat(ipa: string, format: OutputFormat, lang?: string): string {
  const clean = ipa.replaceAll(IPA_SLASH_RE, '').replaceAll('.', '');
  const overrides = lang ? IPA_LANGUAGE_OVERRIDES[lang] : undefined;
  const arpabet = applyDefaultStress(ipaToArpabet(clean, overrides));
  return arpabetToFormat(arpabet, format, { disableRColoring: true });
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
 * Uses longest-match-first greedy segmentation. Returns concatenated IPA or undefined.
 * Searches both the raw IPA dictionary and Khmer overrides so that browser-segmented
 * compounds whose parts only exist in overrides (e.g. ថ្នែក, សតិ) can still decompose.
 */
function lookupKhmerCompound(entries: Record<string, string>, word: string): string | undefined {
  if (khmerMergedDict === undefined) {
    khmerMergedDict = { ...entries };
    const overrides = IPA_WORD_OVERRIDES.km;
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
  // Strip slashes from each part before joining so ipaToFormat sees clean IPA
  return parts.map((p) => p.replaceAll(IPA_SLASH_RE, '')).join(' ');
}

/** Marker for words not found in the dictionary */
export const NOT_FOUND_MARKER = '\u{FFFD}'; // Unicode replacement character

/** Sentence-ending punctuation (Latin and CJK) */
const SENTENCE_END_RE = /[.!?。！？]$/;

/**
 * Builds a reverse map from an IPA dictionary: stress-free ARPAbet key → source words.
 * Used for reverse-translating Ingglish back to the source language.
 *
 * Processes both dictionary entries and per-language IPA overrides.
 * Overrides take priority (their IPA is used when a word exists in both).
 */
export function buildReverseMap(dict: IpaDict): Map<string, string[]> {
  const { entries, lang } = dict;
  const overrides = IPA_LANGUAGE_OVERRIDES[lang];
  const wordOverrides = IPA_WORD_OVERRIDES[lang];

  // Merge entries with overrides (overrides win)
  const allWords = new Map<string, string>();
  for (const [word, ipa] of Object.entries(entries)) {
    allWords.set(word, ipa);
  }
  if (wordOverrides) {
    for (const [word, ipa] of Object.entries(wordOverrides)) {
      allWords.set(word, ipa);
    }
  }

  const map = new Map<string, string[]>();
  for (const [word, ipa] of allWords) {
    const clean = ipa.replaceAll(IPA_SLASH_RE, '').replaceAll('.', '');
    const arpabet = ipaToArpabet(clean, overrides);
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

/**
 * Reverse-translates Ingglish text back to the source language using a pre-built
 * reverse map. Converts each word: Ingglish → ARPAbet → reverse map lookup,
 * preserving whitespace, punctuation, and case.
 */
export function reverseDictText(text: string, reverseMap: Map<string, string[]>): string {
  const segments = text.split(WHITESPACE_SPLIT_RE);
  const result: string[] = [];

  for (const segment of segments) {
    if (WHITESPACE_RE.test(segment)) {
      result.push(segment);
      continue;
    }
    if (!segment) {
      continue;
    }

    // Strip leading/trailing punctuation
    const leading: string[] = [];
    const trailing: string[] = [];
    let core = segment;

    while (core.length > 0 && LEADING_NON_LETTER_RE.test(core)) {
      leading.push(core[0]!);
      core = core.slice(1);
    }
    while (core.length > 0 && TRAILING_NON_LETTER_RE.test(core)) {
      trailing.unshift(core.at(-1)!);
      core = core.slice(0, -1);
    }

    if (!core) {
      result.push(segment);
      continue;
    }

    const casePattern = detectCasePattern(core);
    const arpabet = ingglishToArpabet(core);

    if (!arpabet) {
      result.push(segment);
      continue;
    }

    // Try primary interpretation and alternatives (e.g. AE↔AH ambiguity)
    const [primary, ...alternatives] = expandArpabetAlternatives(arpabet);
    if (!primary) {
      result.push(segment);
      continue;
    }

    const primaryKey = primary.map((p) => stripStress(p)).join(' ');
    let matches = reverseMap.get(primaryKey);

    if (!matches || matches.length === 0) {
      for (const variant of alternatives) {
        const key = variant.map((p) => stripStress(p)).join(' ');
        matches = reverseMap.get(key);
        if (matches && matches.length > 0) {
          break;
        }
      }
    }

    if (matches && matches.length > 0) {
      const word = applyCasePattern(matches[0]!, casePattern);
      result.push(leading.join('') + word + trailing.join(''));
    } else {
      result.push(segment);
    }
  }

  return result.join('');
}

// ============================================================================
// Reverse Translation (Ingglish → source language)
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
  dict: IpaDict,
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
  dict: IpaDict,
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

    const ipa = lookupIpa(dict, core);
    if (ipa) {
      const translated = ipaToFormat(ipa, format, lang);
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
      // Collect IPA for each non-separator part
      const partIpas: (string | undefined)[] = parts.map((part, i) => {
        if (part === "'" || part === '-') {
          return;
        }
        let ipa: string | undefined;
        // In contraction context, prefer clitic form (d' → /d‿/) over
        // bare letter name (d → /de/) so the consonant merges naturally
        if (parts[i + 1] === "'") {
          ipa = lookupIpa(dict, part + "'");
        }
        ipa ??= lookupIpa(dict, part);
        return ipa;
      });

      const allFound = parts.every(
        (part, i) => part === "'" || part === '-' || partIpas[i] !== undefined
      );

      if (allFound) {
        // Merge IPA across apostrophes, keep hyphens as group separators.
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
          const ipa = partIpas[i]!;
          groups.at(-1)!.push(ipa.replaceAll(IPA_SLASH_RE, '').replaceAll('.', ''));
        }
        const translated = groups.map((ipas) => ipaToFormat(ipas.join(''), format, lang)).join('-');
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
        const partIpa = partIpas[i];
        if (partIpa) {
          const partTranslated = ipaToFormat(partIpa, format, lang);
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
