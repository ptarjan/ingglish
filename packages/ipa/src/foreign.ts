import { applyCasePattern, detectCasePattern } from '@ingglish/normalize';
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
  { code: 'ro', label: 'Romanian' },
  { code: 'zh', label: 'Mandarin' },
];

/**
 * Word-level IPA overrides per language.
 *
 * Some IPA dictionary entries are incorrect or represent a different
 * word form. These overrides take priority over the dictionary.
 */
const IPA_WORD_OVERRIDES: Record<string, Record<string, string>> = {
  ar: {
    فيه: '/fiːhi/', // in it
  },
  de: {
    samsa: '/ˈzamza/', // Kafka character
  },
  es: {
    aureliano: '/awɾeˈljano/', // character name (García Márquez)
    beatriz: '/beaˈtɾis/', // character name (Borges)
    buendía: '/bwenˈdia/', // character name (García Márquez)
    cañabrava: '/kaɲaˈβɾaβa/', // bamboo cane
    fierro: '/ˈfjeɾo/', // iron (archaic)
    macondo: '/maˈkondo/', // fictional town (García Márquez)
    viterbo: '/biˈteɾβo/', // character name (Borges)
  },
  fr: {
    est: '/ɛ/', // verb "is" — st is silent (dict has /ɛst/)
    parce: '/paʁs/', // because (first part of "parce que")
  },
  ja: {
    あった: '/atːa/', // past of ある (to exist)
    いた: '/ita/', // past of いる (to be)
    いる: '/iɾɯ/', // to be (animate)
    その: '/sono/', // that (determiner)
    なった: '/natːa/', // past of なる (to become)
    呼んで: '/joɴde/', // te-form of 呼ぶ (to call)
    白く: '/ɕiɾokɯ/', // adverbial of 白い (white)
    知って: '/ɕitːe/', // te-form of 知る (to know)
    静かさ: '/ɕizɯkasa/', // quietness (noun form of 静か)
  },
  nl: {
    draaide: '/ˈdraːidə/', // turned (past of draaien)
    gekund: '/ɣəˈkʏnt/', // past participle of kunnen (to be able)
    is: '/ɪs/', // is
    lauriergracht: '/lɑuˈriːrɣrɑxt/', // Amsterdam canal street
    romans: '/roˈmɑns/', // novels
    velden: '/ˈvɛldən/', // fields
    zal: '/zɑl/', // shall/will
    zulke: '/ˈzʏlkə/', // such
  },
  pt: {
    à: '/a/', // to/at (feminine)
    do: '/du/', // of the (contraction de + o)
    isso: '/ˈisu/', // that
    mim: '/mĩ/', // me (prepositional)
    os: '/us/', // the (masc plural)
    parte: '/ˈpaɾtʃi/', // part
    posso: '/ˈpo.su/', // I can (present of poder)
    querer: '/ke.ˈɾex/', // to want
    ser: '/ˈsex/', // to be
    serei: '/se.ˈɾej/', // I will be (future of ser)
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
  // Try exact, lowercase, title case, then accent-stripped
  const lower = word.toLowerCase();
  const title = lower.charAt(0).toUpperCase() + lower.slice(1);
  const stripped = stripAccents(lower);
  return dict[word] ?? dict[lower] ?? dict[title] ?? dict[stripped];
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
  const clean = ipa.replaceAll(/^\/|\/$/g, '').replaceAll('.', '');
  const overrides = lang ? IPA_LANGUAGE_OVERRIDES[lang] : undefined;
  const arpabet = applyDefaultStress(ipaToArpabet(clean, overrides));
  return arpabetToFormat(arpabet, format, { disableRColoring: true });
}

/** Strip combining diacritics (accents, tildes, etc.) from a string. */
function stripAccents(s: string): string {
  return s.normalize('NFD').replaceAll(/[\u0300-\u036F]/g, '');
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
      const preservesCase = getFormatPreservesCase(format);
      const ipa = lookupIpa(dict, core, lang);
      if (ipa) {
        const translated = ipaToFormat(ipa, format, lang);
        const cased = preservesCase ? applyCasePattern(translated, casePattern) : translated;
        return leading.join('') + cased + trailing.join('');
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
