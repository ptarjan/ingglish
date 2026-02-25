import type { IpaDict } from './foreign';

export type Lemmatizer = (dict: IpaDict, word: string) => string | undefined;

export const LEMMATIZERS: Partial<Record<string, Lemmatizer>> = {
  fi: lemmatizeFi,
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

// ---------------------------------------------------------------------------
// Finnish
// ---------------------------------------------------------------------------

/**
 * Finnish suffix stripping rules. Finnish is highly agglutinative with
 * 15 grammatical cases, possessive suffixes, and verb conjugations.
 * Ordered longest-first for greedy matching.
 */
const FI_SUFFIXES: [string, string[]][] = [
  // Possessive + case combinations
  ['ssani', ['', 'nen']],
  ['ssäni', ['', 'nen']],
  ['llani', ['', 'nen']],
  ['lläni', ['', 'nen']],
  ['stani', ['', 'nen']],
  ['stäni', ['', 'nen']],
  ['ssaan', ['', 'nen']],
  ['ssään', ['', 'nen']],
  // Plural case endings (4+ chars)
  ['issa', ['', 'a']],
  ['issä', ['', 'ä']],
  ['illa', ['', 'a']],
  ['illä', ['', 'ä']],
  ['ista', ['', 'a']],
  ['istä', ['', 'ä']],
  ['ihin', ['', 'i']],
  ['ojen', ['o']],
  ['ujen', ['u']],
  ['yjen', ['y']],
  ['iden', ['i']],
  ['jen', ['']],
  // Inessive -ssa/-ssä
  ['ssa', ['', 's']],
  ['ssä', ['', 's']],
  // Elative -sta/-stä
  ['sta', ['', 's']],
  ['stä', ['', 's']],
  // Adessive -lla/-llä
  ['lla', ['', 'a']],
  ['llä', ['', 'ä']],
  // Ablative -lta/-ltä
  ['lta', ['', 'a']],
  ['ltä', ['', 'ä']],
  // Allative -lle
  ['lle', ['', 'i']],
  // Essive -na/-nä
  ['na', ['', 'nen']],
  ['nä', ['', 'nen']],
  // Translative -ksi
  ['ksi', ['', 'si']],
  // Possessive -ni, -si, -nsa/-nsä, -mme, -nne
  ['nsa', ['']],
  ['nsä', ['']],
  ['mme', ['']],
  ['nne', ['']],
  ['ni', ['', 'n']],
  ['si', ['', 's']],
  // Partitive -a/-ä, -ta/-tä, -tta/-ttä
  ['tta', ['']],
  ['ttä', ['']],
  ['ta', ['', 'nen']],
  ['tä', ['', 'nen']],
  // Genitive -n, plural -t
  ['en', ['', 'i']],
  ['ot', ['o']],
  ['ut', ['u']],
  ['yt', ['y']],
  ['ät', ['ä']],
  ['at', ['a']],
  ['et', ['e', 'i']],
  // Verb past -i
  ['oi', ['o', 'oa']],
  ['ui', ['u', 'ua']],
  // General fallbacks
  ['a', ['']],
  ['ä', ['']],
  ['n', ['']],
  ['t', ['']],
];

/**
 * Finnish verb suffix patterns including archaic Kalevala forms.
 */
const FI_VERB_SUFFIXES: [string, string[]][] = [
  // Archaic Kalevala -(tt)elevi/-(tt)avi patterns
  ['ttelevi', ['tella', 'della']],
  ['televi', ['tella', 'della']],
  ['ttavi', ['ttaa', 'tää']],
  ['ttevi', ['ttää', 'ttaa']],
  ['elevi', ['ella', 'ellä']],
  ['alevi', ['alla', 'allä']],
  ['evi', ['', 'a', 'ä']],
  ['avi', ['', 'a', 'aa']],
  ['ovi', ['', 'o', 'oa']],
  ['uvi', ['', 'u', 'ua']],
  // Past participle -nut/-nyt, -neet
  ['neet', ['', 'a', 'ä']],
  ['nut', ['', 'a', 'da']],
  ['nyt', ['', 'ä', 'dä']],
  // Present participle -va/-vä
  ['va', ['', 'a']],
  ['vä', ['', 'ä']],
  // Past tense 3rd person
  ['tui', ['tua', 'tyä']],
  ['lui', ['la', 'lä']],
  // Conditional
  ['isi', ['', 'a', 'ä']],
  // Agent noun -ja/-jä
  ['ja', ['', 'a']],
  ['jä', ['', 'ä']],
];

/** Apply Finnish consonant gradation (strong → weak). */
function applyFiGradation(stem: string): string {
  if (stem.endsWith('nt')) {return stem.slice(0, -2) + 'nn';}
  if (stem.endsWith('lt')) {return stem.slice(0, -2) + 'll';}
  if (stem.endsWith('rt')) {return stem.slice(0, -2) + 'rr';}
  if (stem.endsWith('nk')) {return stem.slice(0, -2) + 'ng';}
  if (stem.endsWith('mp')) {return stem.slice(0, -2) + 'mm';}
  if (stem.endsWith('lk')) {return stem.slice(0, -2) + 'l';}
  if (stem.endsWith('rk')) {return stem.slice(0, -2) + 'r';}
  if (stem.endsWith('hk')) {return stem.slice(0, -2) + 'h';}
  return stem;
}

/** Apply Finnish consonant strengthening (weak → strong). */
function applyFiStrengthening(stem: string): string {
  if (stem.endsWith('nn')) {return stem.slice(0, -2) + 'nt';}
  if (stem.endsWith('ll')) {return stem.slice(0, -2) + 'lt';}
  if (stem.endsWith('rr')) {return stem.slice(0, -2) + 'rt';}
  if (stem.endsWith('ng')) {return stem.slice(0, -2) + 'nk';}
  if (stem.endsWith('mm')) {return stem.slice(0, -2) + 'mp';}
  return stem;
}

function lemmatizeFi(dict: IpaDict, word: string): string | undefined {
  // Try verb suffixes first (longest matches)
  for (const [suffix, replacements] of FI_VERB_SUFFIXES) {
    if (word.length > suffix.length + 1 && word.endsWith(suffix)) {
      const stem = word.slice(0, -suffix.length);
      const candidates = replacements.map((r) => stem + r);
      const ipa = tryLookup(dict, ...candidates);
      if (ipa) {
        return ipa;
      }
    }
  }

  // Try nominal case/possessive suffixes
  for (const [suffix, replacements] of FI_SUFFIXES) {
    if (word.length > suffix.length + 1 && word.endsWith(suffix)) {
      const stem = word.slice(0, -suffix.length);
      const candidates = replacements.map((r) => stem + r);
      const ipa = tryLookup(dict, ...candidates);
      if (ipa) {
        return ipa;
      }
      // Try consonant gradation (strong→weak and weak→strong)
      if (stem.length >= 2) {
        const gradated = applyFiGradation(stem);
        if (gradated !== stem) {
          const gradIpa = tryLookup(dict, ...replacements.map((r) => gradated + r));
          if (gradIpa) {
            return gradIpa;
          }
        }
        const strengthened = applyFiStrengthening(stem);
        if (strengthened !== stem) {
          const strIpa = tryLookup(dict, ...replacements.map((r) => strengthened + r));
          if (strIpa) {
            return strIpa;
          }
        }
      }
    }
  }

  // Two-level: strip possessive then try suffix stripping on remainder
  for (const poss of ['ni', 'si', 'nsa', 'nsä', 'mme', 'nne'] as const) {
    if (word.endsWith(poss) && word.length > poss.length + 2) {
      const inner = word.slice(0, -poss.length);
      if (dict[inner]) {
        return dict[inner];
      }
      // Try suffix stripping on the inner form (one level only)
      for (const [suffix, replacements] of FI_SUFFIXES) {
        if (inner.length > suffix.length + 1 && inner.endsWith(suffix)) {
          const stem = inner.slice(0, -suffix.length);
          const ipa = tryLookup(dict, ...replacements.map((r) => stem + r));
          if (ipa) {
            return ipa;
          }
        }
      }
    }
  }

  return undefined;
}
