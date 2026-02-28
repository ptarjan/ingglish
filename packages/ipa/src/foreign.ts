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
} from '@ingglish/phonemes';
import type { OutputFormat } from '@ingglish/phonemes';
import { ipaToArpabet } from './from-ipa';
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
import { jam } from './overrides/jam';
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

export type IpaDict = Record<string, string>;

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
  { code: 'jam', label: 'Jamaican Creole' },
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
  jam,
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

export function lookupIpa(dict: IpaDict, word: string, lang?: string): string | undefined {
  if (lang) {
    const override = getIpaOverride(lang, word) ?? getIpaOverride(lang, word.toLowerCase());
    if (override) {
      return override;
    }
  }
  // Try exact, lowercase, title case, accent-stripped, then ß→ss normalization
  const lower = word.toLowerCase();
  const title = lower.charAt(0).toUpperCase() + lower.slice(1);
  const stripped = stripAccents(lower);
  if (dict[word] ?? dict[lower] ?? dict[title] ?? dict[stripped]) {
    return dict[word] ?? dict[lower] ?? dict[title] ?? dict[stripped];
  }
  // German ß→ss normalization (e.g. "Bewußtsein" → dict["Bewusstsein"])
  if (lower.includes('ß')) {
    const ssLower = lower.replaceAll('ß', 'ss');
    const ssTitle = ssLower.charAt(0).toUpperCase() + ssLower.slice(1);
    return dict[ssLower] ?? dict[ssTitle];
  }
  // Some dicts use curly apostrophes (U+2019) — try matching if word has straight ones
  if (word.includes("'")) {
    const curly = word.replaceAll("'", '\u2019');
    const curlyLower = curly.toLowerCase();
    return dict[curly] ?? dict[curlyLower];
  }
  // Last fallback: language-specific lemmatization (strip inflections, find base form)
  if (lang) {
    const lemmatizer = LEMMATIZERS[lang];
    if (lemmatizer) {
      return lemmatizer(dict, lower);
    }
  }
  // Khmer compound fallback: try splitting into dictionary entries (longest-match-first)
  if (lang === 'km') {
    const compound = lookupKhmerCompound(dict, word);
    if (compound !== undefined) {
      return compound;
    }
  }
  return undefined;
}

/** Khmer dictionary keys sorted longest-first, min 2 graphemes (avoids single-char nonsense). */
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
  dict: IpaDict,
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
 * Try to decompose a Khmer compound into known dictionary entries.
 * Uses longest-match-first greedy segmentation. Returns concatenated IPA or undefined.
 */
function lookupKhmerCompound(dict: IpaDict, word: string): string | undefined {
  // Exclude bare single-consonant entries (1 codepoint) to avoid false compound splits.
  // Real Khmer words are 2+ codepoints (consonant + vowel sign / final consonant).
  khmerDictKeys ??= Object.keys(dict)
    .filter((k) => k.length >= 2)
    .toSorted((a, b) => b.length - a.length);
  const parts = decomposeKhmer(dict, khmerDictKeys, word, []);
  if (parts === null || parts.length < 2) {
    return undefined;
  }
  // Strip slashes from each part before joining so ipaToFormat sees clean IPA
  return parts.map((p) => p.replaceAll(IPA_SLASH_RE, '')).join(' ');
}

/** Strip combining diacritics (accents, tildes, etc.) from a string. */
const stripAccents = stripDiacritics;

/** Marker for words not found in the dictionary */
export const NOT_FOUND_MARKER = '\u{FFFD}'; // Unicode replacement character

/** Sentence-ending punctuation (Latin and CJK) */
const SENTENCE_END_RE = /[.!?。！？]$/;

/**
 * Translates foreign text to the specified output format.
 * Words not found in the dictionary are returned with a marker prefix.
 *
 * For caseless scripts (Arabic, Japanese, Chinese, Korean), sentence-initial
 * words are automatically capitalized in the output.
 *
 * @param lang Optional language code for language-specific IPA overrides
 */
export function translateForeign(
  text: string,
  dict: IpaDict,
  format: OutputFormat = 'ingglish',
  lang?: string
): string {
  let atSentenceStart = true;

  // Khmer has no inherent word boundaries — segment before processing
  const processed = lang === 'km' ? segmentKhmerText(text) : text;

  return normalizeApostrophes(processed)
    .split(WHITESPACE_SPLIT_RE)
    .map((segment) => {
      // Preserve whitespace segments as-is
      if (WHITESPACE_RE.test(segment)) {
        return segment;
      }
      if (!segment) {
        return segment;
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
        return segment;
      }

      let casePattern = detectCasePattern(core);
      const preservesCase = getFormatPreservesCase(format);

      // For caseless scripts, capitalize sentence-initial words
      if (atSentenceStart && preservesCase && casePattern === 'lower' && isCaselessWord(core)) {
        casePattern = 'capitalized';
      }

      // Update sentence tracking: sentence ends after . ! ? 。 ！ ？
      atSentenceStart = SENTENCE_END_RE.test(trailing.join(''));

      const ipa = lookupIpa(dict, core, lang);
      if (ipa) {
        const translated = ipaToFormat(ipa, format, lang);
        const cased = preservesCase ? applyCasePattern(translated, casePattern) : translated;
        return leading.join('') + cased + trailing.join('');
      }

      // Try splitting on apostrophes/hyphens (French contractions: l'essentiel, s'il, allez-vous)
      const parts = core.split(CONTRACTION_SPLIT_RE);
      if (parts.length > 1) {
        let isFirstPart = true;
        const translated = parts.map((part, i) => {
          if (part === "'" || part === '-') {
            return part;
          }
          // First real part inherits the sentence-level case (important for
          // caseless scripts where sentence-initial capitalization was set above)
          const partCase = isFirstPart ? casePattern : detectCasePattern(part);
          isFirstPart = false;
          // Try bare lookup first, then with adjacent apostrophe attached
          // (French ipa-dict stores clitics as "s'" → /s/, "l'" → /l/, etc.)
          let partIpa = lookupIpa(dict, part, lang);
          if (!partIpa && parts[i + 1] === "'") {
            partIpa = lookupIpa(dict, part + "'", lang);
          }
          if (partIpa) {
            const partTranslated = ipaToFormat(partIpa, format, lang);
            return preservesCase ? applyCasePattern(partTranslated, partCase) : partTranslated;
          }
          return NOT_FOUND_MARKER + part;
        });
        // If any part was found, return the combined result
        if (
          translated.some(
            (t, i) => parts[i] !== "'" && parts[i] !== '-' && !t.startsWith(NOT_FOUND_MARKER)
          )
        ) {
          return leading.join('') + translated.join('') + trailing.join('');
        }
      }

      // Not found — return original with marker
      return NOT_FOUND_MARKER + segment;
    })
    .join('');
}

/**
 * Check if a word's first character belongs to a caseless script
 * (e.g. Arabic, Japanese, Chinese, Korean) where toUpperCase === toLowerCase.
 */
function isCaselessWord(word: string): boolean {
  const ch = word[0];
  return ch !== undefined && ch.toUpperCase() === ch.toLowerCase();
}
