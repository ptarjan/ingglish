import { applyCasePattern, detectCasePattern } from '@ingglish/normalize';
import { arpabetToFormat, arpabetToIngglish } from '@ingglish/phonemes';
import type { OutputFormat } from '@ingglish/phonemes';
import { ipaToArpabet } from './from-ipa';
import { IPA_LANGUAGE_OVERRIDES } from './ipa-maps';

export type IpaDict = Record<string, string>;

export interface Language {
  code: string;
  label: string;
}

export const LANGUAGES: Language[] = [
  { code: 'ar', label: 'Arabic' },
  { code: 'de', label: 'German' },
  { code: 'es', label: 'Spanish' },
  { code: 'fi', label: 'Finnish' },
  { code: 'fr', label: 'French' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'nl', label: 'Dutch' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'zh', label: 'Mandarin' },
];

/**
 * Word-level IPA overrides per language.
 *
 * Some IPA dictionary entries are incorrect or represent a different
 * word form. These overrides take priority over the dictionary.
 */
const IPA_WORD_OVERRIDES: Record<string, Record<string, string>> = {
  // French
  fr: {
    est: '/ɛ/', // verb "is" — st is silent (dict has /ɛst/)
  },
};

/**
 * Converts an IPA transcription to Ingglish spelling.
 * Strips slashes and syllable dots before conversion.
 */
export function ipaToIngglish(ipa: string): string {
  const clean = ipa.replaceAll(/^\/|\/$/g, '').replaceAll('.', '');
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
  return dict[word] ?? dict[word.toLowerCase()];
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
  const clean = ipa.replaceAll(/^\/|\/$/g, '').replaceAll('.', '');
  const overrides = lang ? IPA_LANGUAGE_OVERRIDES[lang] : undefined;
  const arpabet = ipaToArpabet(clean, overrides);
  return arpabetToFormat(arpabet, format, { disableRColoring: true });
}

/** Marker for words not found in the dictionary */
export const NOT_FOUND_MARKER = '\u{FFFD}'; // Unicode replacement character

/**
 * Translates foreign text to the specified output format.
 * Words not found in the dictionary are returned with a marker prefix.
 *
 * @param lang Optional language code for language-specific IPA overrides
 */
export function translateForeign(
  text: string,
  dict: IpaDict,
  format: OutputFormat = 'ingglish',
  lang?: string
): string {
  return text
    .split(/(\s+)/)
    .map((segment) => {
      // Preserve whitespace segments as-is
      if (/^\s+$/.test(segment)) {
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
      while (core.length > 0 && /^\P{L}/u.test(core)) {
        leading.push(core[0]!);
        core = core.slice(1);
      }
      // Peel off trailing non-letter characters
      while (core.length > 0 && /\P{L}$/u.test(core)) {
        trailing.unshift(core.at(-1)!);
        core = core.slice(0, -1);
      }

      if (!core) {
        return segment;
      }

      const casePattern = detectCasePattern(core);
      const ipa = lookupIpa(dict, core, lang);
      if (ipa) {
        const translated = ipaToFormat(ipa, format, lang);
        return leading.join('') + applyCasePattern(translated, casePattern) + trailing.join('');
      }

      // Try splitting on apostrophes/hyphens (French contractions: l'essentiel, s'il, allez-vous)
      const parts = core.split(/(?<=['-])|(?=['-])/);
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
            return applyCasePattern(ipaToFormat(partIpa, format, lang), partCase);
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
