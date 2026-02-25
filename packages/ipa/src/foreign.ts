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
import { ar } from './overrides/ar';
import { de } from './overrides/de';
import { es } from './overrides/es';
import { fi } from './overrides/fi';
import { fr } from './overrides/fr';
import { ja } from './overrides/ja';
import { ko } from './overrides/ko';
import { nl } from './overrides/nl';
import { pt } from './overrides/pt';

// Pre-compiled regexes (avoid per-call RegExp object creation)
const IPA_SLASH_RE = /^\/|\/$/g;
const WHITESPACE_SPLIT_RE = /(\s+)/;
const WHITESPACE_RE = /^\s+$/;
const LEADING_NON_LETTER_RE = /^\P{L}/u;
const TRAILING_NON_LETTER_RE = /\P{L}$/u;
const CONTRACTION_SPLIT_RE = /(?<=['-])|(?=['-])/;

export type IpaDict = Record<string, string>;

export interface Language {
  code: string;
  label: string;
}

export const LANGUAGES: Language[] = [
  { code: 'ar', label: 'Arabic' },
  { code: 'de', label: 'German' },
  { code: 'eo', label: 'Esperanto' },
  { code: 'es', label: 'Spanish' },
  { code: 'fa', label: 'Persian' },
  { code: 'fi', label: 'Finnish' },
  { code: 'fr', label: 'French' },
  { code: 'is', label: 'Icelandic' },
  { code: 'ja', label: 'Japanese' },
  { code: 'jam', label: 'Jamaican Creole' },
  { code: 'km', label: 'Khmer' },
  { code: 'ko', label: 'Korean' },
  { code: 'ma', label: 'Malay' },
  { code: 'nb', label: 'Norwegian' },
  { code: 'nl', label: 'Dutch' },
  { code: 'or', label: 'Odia' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ro', label: 'Romanian' },
  { code: 'sv', label: 'Swedish' },
  { code: 'sw', label: 'Swahili' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'yue', label: 'Cantonese' },
  { code: 'zh', label: 'Mandarin' },
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
  es,
  fi,
  fr,
  ja,
  ko,
  nl,
  pt,
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
  return undefined;
}

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

  return normalizeApostrophes(text)
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
        const translated = parts.map((part, i) => {
          if (part === "'" || part === '-') {
            return part;
          }
          const partCase = detectCasePattern(part);
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
