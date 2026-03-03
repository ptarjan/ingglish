export type WordResolver = (
  entries: Record<string, string[]>,
  word: string
) => string[] | undefined;

export const WORD_RESOLVERS: Partial<Record<string, WordResolver>> = {
  eo: lemmatizeEo,
  fa: lemmatizeFa,
  fi: lemmatizeFi,
  ma: lemmatizeMa,
  nb: lemmatizeNb,
  ro: lemmatizeRo,
  sv: lemmatizeSv,
  sw: lemmatizeSw,
};

/** Try candidates in the dictionary, return first match. */
function tryLookup(dict: Record<string, string[]>, ...candidates: string[]): string[] | undefined {
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

function lemmatizeSv(dict: Record<string, string[]>, word: string): string[] | undefined {
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

function lemmatizeRo(dict: Record<string, string[]>, word: string): string[] | undefined {
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

// ---------------------------------------------------------------------------
// Esperanto
// ---------------------------------------------------------------------------

/**
 * Esperanto is perfectly regular: nouns end -o, adjectives -a, verbs -i
 * (infinitive), adverbs -e. Inflections: -n (accusative), -j (plural),
 * -jn (plural accusative), verb tenses -as/-is/-os/-us/-u, participles
 * -anta/-inta/-onta/-ata/-ita/-ota.
 */
function lemmatizeEo(dict: Record<string, string[]>, word: string): string[] | undefined {
  let w = word;

  // Strip accusative -n
  if (w.endsWith('n') && w.length > 2) {
    const stripped = w.slice(0, -1);
    if (dict[stripped]) {
      return dict[stripped];
    }
    w = stripped;
  }

  // Strip plural -j (after accusative stripping: -ojn → -oj → -o)
  if (w.endsWith('j') && w.length > 2) {
    const stripped = w.slice(0, -1);
    if (dict[stripped]) {
      return dict[stripped];
    }
    w = stripped;
  }

  // Try the current form (after stripping -n and/or -j)
  if (dict[w]) {
    return dict[w];
  }

  // Verb endings → infinitive (-i)
  for (const ending of ['as', 'is', 'os', 'us'] as const) {
    if (w.endsWith(ending) && w.length > ending.length + 1) {
      const stem = w.slice(0, -ending.length);
      const ipa = tryLookup(dict, stem + 'i', stem + 'o', stem);
      if (ipa) {
        return ipa;
      }
    }
  }
  // Imperative/jussive -u → -i
  if (w.endsWith('u') && w.length > 2) {
    const stem = w.slice(0, -1);
    const ipa = tryLookup(dict, stem + 'i', stem + 'o', stem);
    if (ipa) {
      return ipa;
    }
  }

  // Participles: -anta/-inta/-onta/-ata/-ita/-ota/-ante/-inte/-onte → verb -i
  for (const suffix of [
    'anta',
    'inta',
    'onta',
    'ata',
    'ita',
    'ota',
    'ante',
    'inte',
    'onte',
  ] as const) {
    if (w.endsWith(suffix) && w.length > suffix.length + 1) {
      const stem = w.slice(0, -suffix.length);
      const ipa = tryLookup(dict, stem + 'i', stem + 'o', stem);
      if (ipa) {
        return ipa;
      }
    }
  }

  // Adverb -e → noun -o or adjective -a
  if (w.endsWith('e') && w.length > 2) {
    const stem = w.slice(0, -1);
    const ipa = tryLookup(dict, stem + 'o', stem + 'a', stem + 'i', stem);
    if (ipa) {
      return ipa;
    }
  }

  // Try stripping common derivational suffixes
  for (const [suffix, replacements] of [
    ['isto', ['o', 'i', '']],
    ['ejo', ['o', 'i', '']],
    ['ilo', ['o', 'i', '']],
    ['eco', ['o', 'a', '']],
    ['ado', ['o', 'i', '']],
    ['igo', ['o', 'a', '']],
    ['iĝo', ['o', 'a', '']],
  ] as [string, string[]][]) {
    if (w.endsWith(suffix) && w.length > suffix.length + 1) {
      const stem = w.slice(0, -suffix.length);
      const ipa = tryLookup(dict, ...replacements.map((r) => stem + r));
      if (ipa) {
        return ipa;
      }
    }
  }

  // Esperanto prefixes: mal-, ek-, re-, ne-, sen-
  for (const prefix of ['mal', 'ek', 're', 'ne', 'sen'] as const) {
    if (w.startsWith(prefix) && w.length > prefix.length + 1) {
      const remainder = w.slice(prefix.length);
      if (dict[remainder]) {
        return dict[remainder];
      }
      // Try lemmatizing the remainder recursively
      const inner = lemmatizeEo(dict, remainder);
      if (inner) {
        return inner;
      }
    }
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Swahili
// ---------------------------------------------------------------------------

function lemmatizeSw(dict: Record<string, string[]>, word: string): string[] | undefined {
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
  if (stem.endsWith('nt')) {
    return stem.slice(0, -2) + 'nn';
  }
  if (stem.endsWith('lt')) {
    return stem.slice(0, -2) + 'll';
  }
  if (stem.endsWith('rt')) {
    return stem.slice(0, -2) + 'rr';
  }
  if (stem.endsWith('nk')) {
    return stem.slice(0, -2) + 'ng';
  }
  if (stem.endsWith('mp')) {
    return stem.slice(0, -2) + 'mm';
  }
  if (stem.endsWith('lk')) {
    return stem.slice(0, -2) + 'l';
  }
  if (stem.endsWith('rk')) {
    return stem.slice(0, -2) + 'r';
  }
  if (stem.endsWith('hk')) {
    return stem.slice(0, -2) + 'h';
  }
  return stem;
}

/** Apply Finnish consonant strengthening (weak → strong). */
function applyFiStrengthening(stem: string): string {
  if (stem.endsWith('nn')) {
    return stem.slice(0, -2) + 'nt';
  }
  if (stem.endsWith('ll')) {
    return stem.slice(0, -2) + 'lt';
  }
  if (stem.endsWith('rr')) {
    return stem.slice(0, -2) + 'rt';
  }
  if (stem.endsWith('ng')) {
    return stem.slice(0, -2) + 'nk';
  }
  if (stem.endsWith('mm')) {
    return stem.slice(0, -2) + 'mp';
  }
  return stem;
}

function lemmatizeFi(dict: Record<string, string[]>, word: string): string[] | undefined {
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

// ---------------------------------------------------------------------------
// Norwegian Bokmål
// ---------------------------------------------------------------------------

/** Old orthography mappings (Riksmål/Danish → modern Bokmål). */
function modernizeNb(word: string): string[] {
  const variants: string[] = [];
  // aa → å
  if (word.includes('aa')) {
    variants.push(word.replaceAll('aa', 'å'));
  }
  if (word.includes('Aa')) {
    variants.push(word.replaceAll('Aa', 'Å'));
  }
  // Old spellings
  if (word === 'af') {
    variants.push('av');
  }
  if (word === 'efter') {
    variants.push('etter');
  }
  if (word === 'imod') {
    variants.push('imot');
  }
  return variants;
}

const NB_SUFFIXES: [string, string[]][] = [
  // 4+ char
  ['erne', ['', 'e']],
  ['enes', ['', 'e']],
  ['ande', ['', 'e']],
  ['ende', ['', 'e']],
  ['else', ['', 'e']],
  // Definite plural
  ['ene', ['', 'e']],
  ['ane', ['', 'e']],
  // 2 char definite singular
  ['en', ['', 'e']],
  ['et', ['', 'e']],
  // Past tense / participle
  ['te', ['', 'e']],
  ['de', ['', 'e']],
  ['dde', ['']],
  // Indefinite plural
  ['er', ['', 'e']],
  // Comparative / superlative
  ['ere', ['']],
  ['est', ['']],
  ['este', ['']],
  // Present tense
  ['ar', ['', 'e']],
  // General
  ['t', ['', 'e']],
  ['a', ['', 'e']],
  ['s', ['']],
  ['e', ['']],
  ['n', ['', 'e']],
  ['r', ['', 'e']],
];

function lemmatizeNb(dict: Record<string, string[]>, word: string): string[] | undefined {
  // Try old orthography modernization first
  const modern = modernizeNb(word);
  for (const m of modern) {
    if (dict[m]) {
      return dict[m];
    }
    const lower = m.toLowerCase();
    if (dict[lower]) {
      return dict[lower];
    }
  }

  // Suffix stripping
  for (const [suffix, replacements] of NB_SUFFIXES) {
    if (word.length > suffix.length + 1 && word.endsWith(suffix)) {
      const stem = word.slice(0, -suffix.length);
      const ipa = tryLookup(dict, ...replacements.map((r) => stem + r));
      if (ipa) {
        return ipa;
      }
    }
  }

  // Two-level: try old orthography on stems after suffix stripping
  for (const [suffix, replacements] of NB_SUFFIXES) {
    if (word.length > suffix.length + 1 && word.endsWith(suffix)) {
      const stem = word.slice(0, -suffix.length);
      for (const r of replacements) {
        const candidate = stem + r;
        const modernized = modernizeNb(candidate);
        for (const m of modernized) {
          if (dict[m]) {
            return dict[m];
          }
        }
      }
    }
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Malay
// ---------------------------------------------------------------------------

/**
 * Malay morphology: prefixes (me-, men-, mem-, meng-, meny-, ber-, di-, ke-,
 * se-, per-, ter-) and suffixes (-kan, -an, -i, -nya, -mu, -ku, -lah, -kah).
 * Nasalized prefixes drop the initial consonant of the root.
 */

const MA_SUFFIXES: string[] = ['nya', 'mu', 'ku', 'kan', 'an', 'lah', 'kah', 'i'];

/** Prefix → possible root consonant restorations. */
const MA_PREFIXES: [string, string[]][] = [
  ['memper', ['']],
  ['member', ['']],
  ['menge', ['']],
  ['meny', ['s', 'c']],
  ['meng', ['k', 'g', 'h', '']],
  ['mem', ['p', 'b', 'f', '']],
  ['men', ['t', 'd', 'c', 'j', '']],
  ['me', ['']],
  ['diper', ['']],
  ['ber', ['']],
  ['per', ['']],
  ['ter', ['']],
  ['di', ['']],
  ['ke', ['']],
  ['se', ['']],
  ['ku', ['']],
];

function lemmatizeMa(dict: Record<string, string[]>, word: string): string[] | undefined {
  // Try suffix stripping first
  for (const suffix of MA_SUFFIXES) {
    if (word.length > suffix.length + 2 && word.endsWith(suffix)) {
      const stem = word.slice(0, -suffix.length);
      if (dict[stem]) {
        return dict[stem];
      }
      // Try prefix stripping on the suffix-stripped form
      const fromPrefix = tryMaPrefixStrip(dict, stem);
      if (fromPrefix) {
        return fromPrefix;
      }
    }
  }

  // Try prefix stripping alone
  return tryMaPrefixStrip(dict, word);
}

function tryMaPrefixStrip(dict: Record<string, string[]>, word: string): string[] | undefined {
  for (const [prefix, restorations] of MA_PREFIXES) {
    if (word.length > prefix.length + 1 && word.startsWith(prefix)) {
      const remainder = word.slice(prefix.length);
      // Try remainder directly
      if (dict[remainder]) {
        return dict[remainder];
      }
      // Try restoring dropped consonant
      for (const consonant of restorations) {
        if (consonant) {
          const restored = consonant + remainder;
          if (dict[restored]) {
            return dict[restored];
          }
        }
      }
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Persian / Farsi
// ---------------------------------------------------------------------------

/**
 * Persian: handles ZWNJ-joined compounds (e.g. می‌کند = mi + konad),
 * common suffixes (-ها plural, -ای indefinite, etc.), and verb prefixes.
 */
const ZWNJ = '\u200C'; // Zero-width non-joiner

function lemmatizeFa(dict: Record<string, string[]>, word: string): string[] | undefined {
  // Split on ZWNJ and try each part
  if (word.includes(ZWNJ)) {
    const parts = word.split(ZWNJ);
    // Try each part separately
    for (const part of parts) {
      if (dict[part]) {
        return dict[part];
      }
    }
    // For verb forms with می (mi-) prefix, try the verb part
    if (parts.length === 2 && (parts[0] === 'می' || parts[0] === 'نمی')) {
      const verb = parts[1]!;
      if (dict[verb]) {
        return dict[verb];
      }
      // Try stripping verb endings
      for (const ending of ['ند', 'م', 'ی', 'د', 'یم', 'ید'] as const) {
        if (verb.endsWith(ending) && verb.length > ending.length) {
          const stem = verb.slice(0, -ending.length);
          if (dict[stem]) {
            return dict[stem];
          }
        }
      }
    }
    // Try joining without ZWNJ
    const joined = parts.join('');
    if (dict[joined]) {
      return dict[joined];
    }
  }

  // Suffix stripping: -ها (plural), -های, -هایی
  for (const suffix of [
    'هایی',
    'های',
    'ها',
    'ای',
    'ان',
    'ات',
    'ین',
    'تر',
    'ترین',
    'ش',
    'م',
    'ت',
  ] as const) {
    if (word.endsWith(suffix) && word.length > suffix.length + 1) {
      const stem = word.slice(0, -suffix.length);
      if (dict[stem]) {
        return dict[stem];
      }
    }
  }

  return undefined;
}
