/**
 * G2P (grapheme-to-phoneme) converters for phonetically regular languages.
 * These provide a fallback when a word isn't found in the IPA dictionary.
 * Each converter takes a lowercase word and returns an IPA string with stress markers.
 */

type G2PConverter = (word: string) => string;

/**
 * Map of language codes to G2P converter functions.
 * Used as the last fallback in lookupIpa() before returning NOT_FOUND.
 */
export const G2P_CONVERTERS: Record<string, G2PConverter> = {
  eo: esperantoG2P,
  fi: finnishG2P,
  ma: malayG2P,
  sw: swahiliG2P,
};

// --- Shared helpers ---

/** IPA vowel characters used for syllable counting and stress placement. */
const IPA_VOWELS = new Set('aeiouɑæøyɛɔə');

/** Insert primary stress marker (ˈ) before the first syllable. */
function addFirstSyllableStress(ipa: string): string {
  return ipa ? 'ˈ' + ipa : ipa;
}

/**
 * Insert primary stress marker (ˈ) before the penultimate syllable.
 * Falls back to first-syllable stress for monosyllabic words.
 */
function addPenultimateStress(ipa: string): string {
  // Find vowel positions
  const vowelPositions: number[] = [];
  for (const [i, ch] of Array.from(ipa).entries()) {
    if (IPA_VOWELS.has(ch)) {
      vowelPositions.push(i);
    }
  }

  // Monosyllabic or empty → stress on first (and only) syllable
  if (vowelPositions.length <= 1) {
    return ipa ? 'ˈ' + ipa : ipa;
  }

  // Find the penultimate vowel
  const stressPos = vowelPositions.at(-2)!;

  // Walk back to find the syllable onset (stop at previous vowel or length mark)
  let onset = stressPos;
  while (onset > 0 && !IPA_VOWELS.has(ipa[onset - 1]!) && ipa[onset - 1] !== 'ː') {
    onset--;
  }

  return ipa.slice(0, onset) + 'ˈ' + ipa.slice(onset);
}

/**
 * Convert a word to IPA by applying ordered grapheme rules.
 * Rules are tried in array order at each position (first match wins),
 * so digraphs/trigraphs must precede their single-char components.
 */
function applyRules(word: string, rules: [string, string][]): string {
  const normalized = word.normalize('NFC');
  let result = '';
  let i = 0;
  while (i < normalized.length) {
    let matched = false;
    for (const [grapheme, phoneme] of rules) {
      if (normalized.startsWith(grapheme, i)) {
        result += phoneme;
        i += grapheme.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      i++; // skip unknown characters
    }
  }
  return result;
}

// --- Finnish ---

const FINNISH_RULES: [string, string][] = [
  // Digraphs (must precede single-char rules)
  ['nk', 'ŋk'],
  ['ng', 'ŋː'],
  // Long vowels (double letters → vowel + length mark)
  ['aa', 'ɑː'],
  ['ee', 'eː'],
  ['ii', 'iː'],
  ['oo', 'oː'],
  ['uu', 'uː'],
  ['yy', 'yː'],
  ['ää', 'æː'],
  ['öö', 'øː'],
  // Geminate consonants
  ['pp', 'pː'],
  ['tt', 'tː'],
  ['kk', 'kː'],
  ['mm', 'mː'],
  ['nn', 'nː'],
  ['ll', 'lː'],
  ['rr', 'rː'],
  ['ss', 'sː'],
  // Single vowels
  ['a', 'ɑ'],
  ['e', 'e'],
  ['i', 'i'],
  ['o', 'o'],
  ['u', 'u'],
  ['y', 'y'],
  ['ä', 'æ'],
  ['ö', 'ø'],
  // Single consonants
  ['b', 'b'],
  ['d', 'd'],
  ['f', 'f'],
  ['g', 'ɡ'],
  ['h', 'h'],
  ['j', 'j'],
  ['k', 'k'],
  ['l', 'l'],
  ['m', 'm'],
  ['n', 'n'],
  ['p', 'p'],
  ['r', 'r'],
  ['s', 's'],
  ['t', 't'],
  ['v', 'ʋ'],
  ['w', 'ʋ'],
  ['z', 'ts'],
];

/** Finnish G2P: stress always on the first syllable. */
function finnishG2P(word: string): string {
  return addFirstSyllableStress(applyRules(word, FINNISH_RULES));
}

// --- Esperanto ---

const ESPERANTO_RULES: [string, string][] = [
  // Special Esperanto characters (must precede base letters)
  ['ĉ', 'tʃ'],
  ['ĝ', 'dʒ'],
  ['ĥ', 'x'],
  ['ĵ', 'ʒ'],
  ['ŝ', 'ʃ'],
  ['ŭ', 'w'],
  ['c', 'ts'],
  // Vowels
  ['a', 'a'],
  ['e', 'e'],
  ['i', 'i'],
  ['o', 'o'],
  ['u', 'u'],
  // Consonants
  ['b', 'b'],
  ['d', 'd'],
  ['f', 'f'],
  ['g', 'ɡ'],
  ['h', 'h'],
  ['j', 'j'],
  ['k', 'k'],
  ['l', 'l'],
  ['m', 'm'],
  ['n', 'n'],
  ['p', 'p'],
  ['r', 'r'],
  ['s', 's'],
  ['t', 't'],
  ['v', 'v'],
  ['z', 'z'],
];

/** Esperanto G2P: stress always on the penultimate syllable. */
function esperantoG2P(word: string): string {
  return addPenultimateStress(applyRules(word, ESPERANTO_RULES));
}

// --- Swahili ---

const SWAHILI_RULES: [string, string][] = [
  // Trigraph (must precede digraph 'ng')
  ["ng'", 'ŋ'],
  // Digraphs
  ['ch', 'tʃ'],
  ['dh', 'ð'],
  ['gh', 'ɣ'],
  ['ng', 'ŋɡ'],
  ['nj', 'ndʒ'],
  ['ny', 'ɲ'],
  ['sh', 'ʃ'],
  ['th', 'θ'],
  // Vowels
  ['a', 'a'],
  ['e', 'ɛ'],
  ['i', 'i'],
  ['o', 'ɔ'],
  ['u', 'u'],
  // Consonants
  ['b', 'b'],
  ['d', 'd'],
  ['f', 'f'],
  ['g', 'ɡ'],
  ['h', 'h'],
  ['j', 'dʒ'],
  ['k', 'k'],
  ['l', 'l'],
  ['m', 'm'],
  ['n', 'n'],
  ['p', 'p'],
  ['r', 'ɾ'],
  ['s', 's'],
  ['t', 't'],
  ['v', 'v'],
  ['w', 'w'],
  ['y', 'j'],
  ['z', 'z'],
];

/** Swahili G2P: stress on the penultimate syllable. */
function swahiliG2P(word: string): string {
  return addPenultimateStress(applyRules(word, SWAHILI_RULES));
}

// --- Malay ---

const MALAY_RULES: [string, string][] = [
  // Digraphs
  ['gh', 'ɣ'],
  ['kh', 'x'],
  ['ng', 'ŋ'],
  ['ny', 'ɲ'],
  ['sy', 'ʃ'],
  // Vowels
  ['a', 'a'],
  ['e', 'ə'],
  ['i', 'i'],
  ['o', 'o'],
  ['u', 'u'],
  // Consonants
  ['b', 'b'],
  ['c', 'tʃ'],
  ['d', 'd'],
  ['f', 'f'],
  ['g', 'ɡ'],
  ['h', 'h'],
  ['j', 'dʒ'],
  ['k', 'k'],
  ['l', 'l'],
  ['m', 'm'],
  ['n', 'n'],
  ['p', 'p'],
  ['r', 'ɾ'],
  ['s', 's'],
  ['t', 't'],
  ['v', 'v'],
  ['w', 'w'],
  ['y', 'j'],
  ['z', 'z'],
];

/**
 * Malay stress: penultimate syllable, but if that syllable has schwa /ə/,
 * stress shifts to the final syllable instead.
 */
function addMalayStress(ipa: string): string {
  const vowelPositions: number[] = [];
  for (const [i, ch] of Array.from(ipa).entries()) {
    if (IPA_VOWELS.has(ch)) {
      vowelPositions.push(i);
    }
  }

  if (vowelPositions.length <= 1) {
    return ipa ? 'ˈ' + ipa : ipa;
  }

  const penultPos = vowelPositions.at(-2)!;
  // If penultimate vowel is schwa, stress the final syllable instead
  const stressPos = ipa[penultPos] === 'ə' ? vowelPositions.at(-1)! : penultPos;

  let onset = stressPos;
  while (onset > 0 && !IPA_VOWELS.has(ipa[onset - 1]!) && ipa[onset - 1] !== 'ː') {
    onset--;
  }

  return ipa.slice(0, onset) + 'ˈ' + ipa.slice(onset);
}

/** Malay G2P: stress on the penultimate syllable (skips schwa). */
function malayG2P(word: string): string {
  return addMalayStress(applyRules(word, MALAY_RULES));
}
