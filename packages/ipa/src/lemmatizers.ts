import type { IpaDict } from './foreign';

export type Lemmatizer = (dict: IpaDict, word: string) => string | undefined;

export const LEMMATIZERS: Partial<Record<string, Lemmatizer>> = {
  ro: lemmatizeRo,
  sv: lemmatizeSv,
  sw: lemmatizeSw,
};

/** Try candidates in the dictionary, return first IPA match. */
function tryLookup(dict: IpaDict, ...candidates: string[]): string | undefined {
  for (const c of candidates) {
    if (c && dict[c]) {
      return dict[c];
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Swedish
// ---------------------------------------------------------------------------

/** Suffix → replacement candidates to try after stripping. */
const SV_SUFFIXES: [string, string[]][] = [
  // 4+ char suffixes
  ['erna', ['', 'e']],
  ['orna', ['', 'a']],
  ['ande', ['', 'a']],
  ['ende', ['', 'a']],
  ['aste', ['']],
  // 3 char
  ['ade', ['', 'a']],
  ['igt', ['ig']],
  // 2 char
  ['en', ['']],
  ['et', ['', 'e']],
  ['an', ['', 'a']],
  ['ar', ['']],
  ['er', ['', 'a']],
  ['de', ['', 'a']],
  ['te', ['', 'a']],
  // 1 char
  ['a', ['']],
  ['t', ['', 'a']],
  ['s', ['']],
  ['r', ['', 'a']],
  ['n', ['']],
];

function lemmatizeSv(dict: IpaDict, word: string): string | undefined {
  // First pass: try stripping each suffix (longest-first) and checking dict
  for (const [suffix, replacements] of SV_SUFFIXES) {
    if (word.length > suffix.length && word.endsWith(suffix)) {
      const stem = word.slice(0, -suffix.length);
      const candidates = replacements.map((r) => stem + r);
      const ipa = tryLookup(dict, ...candidates);
      if (ipa) {
        return ipa;
      }
    }
  }

  // Two-level for genitive chains: strip -s, then try lemmatizing the remainder
  // e.g. "solens" -> "solen" -> strip -en -> "sol"
  if (word.endsWith('s') && word.length > 2) {
    const inner = word.slice(0, -1);
    // Try inner directly first
    if (dict[inner]) {
      return dict[inner];
    }
    // Recursively lemmatize the inner form
    return lemmatizeSv(dict, inner);
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Romanian
// ---------------------------------------------------------------------------

const RO_SUFFIXES: [string, string[]][] = [
  // 4+ char
  ['ului', ['']],
  ['ilor', ['']],
  ['ește', ['', 'i']],
  // 3 char
  ['ele', ['', 'ă']],
  ['uri', ['']],
  ['eau', ['', 'i', 'ea']],
  // 2 char
  ['ul', ['']],
  ['ii', ['', 'ie', 'iu']],
  ['ea', ['', 'e']],
  ['ți', ['t']],
  ['că', ['c', 'ca']],
  // 1 char
  ['a', ['', 'ă']],
  ['e', ['', 'ă']],
  ['i', ['', 'e']],
];

/** Romanian prefix fragments from contractions: n→în, l→îl, m→mă */
const RO_PREFIX_RESTORE: [string, string][] = [
  ['n', 'în'],
  ['l', 'îl'],
  ['m', 'mă'],
];

function lemmatizeRo(dict: IpaDict, word: string): string | undefined {
  // Suffix stripping
  for (const [suffix, replacements] of RO_SUFFIXES) {
    if (word.length > suffix.length && word.endsWith(suffix)) {
      const stem = word.slice(0, -suffix.length);
      const candidates = replacements.map((r) => stem + r);
      const ipa = tryLookup(dict, ...candidates);
      if (ipa) {
        return ipa;
      }
    }
  }

  // Prefix restoration for contraction fragments
  for (const [prefix, restored] of RO_PREFIX_RESTORE) {
    if (word.startsWith(prefix)) {
      const remainder = restored + word.slice(prefix.length);
      if (dict[remainder]) {
        return dict[remainder];
      }
    }
  }

  // Try î + word for fragments like ntâlnesc -> întâlnesc
  const withI = 'î' + word;
  if (dict[withI]) {
    return dict[withI];
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Swahili
// ---------------------------------------------------------------------------

/**
 * Swahili verb prefix combinations (subject marker + tense marker).
 * Ordered longest-first for greedy matching.
 */
const SW_VERB_PREFIXES: string[] = [
  // 5+ char
  'hatuku',
  'hawaku',
  'haiku',
  'hatua',
  'hatui',
  // 4 char
  'wali',
  'tuli',
  'nili',
  'aali',
  'wame',
  'tume',
  'nime',
  'ame',
  'wana',
  'tuna',
  'nina',
  'ana',
  'wata',
  'tuta',
  'nita',
  'ata',
  'yame',
  'yata',
  'yana',
  'yali',
  'kime',
  'kita',
  'kina',
  'kili',
  'lime',
  'lita',
  'lina',
  'lili',
  'vime',
  'vita',
  'vina',
  'vili',
  'zime',
  'zita',
  'zina',
  'zili',
  'haku',
  'hatu',
  'hani',
  'hawa',
  // 3 char
  'ali',
  'ame',
  'ana',
  'ata',
  'uli',
  'ume',
  'una',
  'uta',
  'tua',
  'tui',
  'wai',
  'wal',
  'iku',
  'ina',
  'hue',
  'huj',
  'hui',
  'yat',
  'yam',
  'yan',
  'kum',
  'kui',
  'kua',
  // 2 char
  'wa',
  'tu',
  'ni',
  'li',
  'ki',
  'vi',
  'zi',
  'ya',
  'ku',
  'hu',
];

/** Derivational suffixes to try stripping or replacing on Swahili verb stems. */
const SW_DERIV_SUFFIXES: [string, string[]][] = [
  ['ika', ['a']],
  ['isha', ['a']],
  ['ana', ['a']],
  ['wa', ['a']],
  ['ia', ['a']],
  ['ika', ['a', 'ea']],
];

function lemmatizeSw(dict: IpaDict, word: string): string | undefined {
  // Try stripping known verb prefix combinations
  for (const prefix of SW_VERB_PREFIXES) {
    if (word.length > prefix.length + 1 && word.startsWith(prefix)) {
      const remainder = word.slice(prefix.length);
      // Try remainder directly
      if (dict[remainder]) {
        return dict[remainder];
      }
      // Try with ku- prefix (infinitive form)
      const kuForm = 'ku' + remainder;
      if (dict[kuForm]) {
        return dict[kuForm];
      }
      // Try derivational suffix stripping on the remainder
      for (const [suffix, replacements] of SW_DERIV_SUFFIXES) {
        if (remainder.length > suffix.length && remainder.endsWith(suffix)) {
          const stem = remainder.slice(0, -suffix.length);
          for (const r of replacements) {
            const candidate = stem + r;
            if (dict[candidate]) {
              return dict[candidate];
            }
            // Also try ku + candidate
            if (dict['ku' + candidate]) {
              return dict['ku' + candidate];
            }
          }
        }
      }
    }
  }

  // Try just derivational suffix stripping without prefix removal
  for (const [suffix, replacements] of SW_DERIV_SUFFIXES) {
    if (word.length > suffix.length && word.endsWith(suffix)) {
      const stem = word.slice(0, -suffix.length);
      for (const r of replacements) {
        const candidate = stem + r;
        if (dict[candidate]) {
          return dict[candidate];
        }
      }
    }
  }

  return undefined;
}
