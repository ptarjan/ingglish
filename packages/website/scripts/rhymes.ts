/**
 * The rhyme model: which words rhyme, which of them get their own
 * /rhymes/<word>/ page, and in what order the rhymes are listed. Shared by the
 * word-page generator (./build-word-pages) and the rhyme-page generator
 * (./build-rhyme-pages) so both can only ever quote the same set.
 *
 * A rhyme is the primary-stressed vowel to the end of the word — the standard
 * definition of a perfect rhyme. The looser "last two phonemes" key this
 * replaces put `colonel`, `several`, `national` and `animal` in one group on
 * the strength of a shared /əl/: 633 keys over 48,804 words, the largest
 * holding 4,074. The strict key gives 22,487 keys, 17,130 of them singletons,
 * the largest 639.
 */

/** ARPAbet vowels are exactly the phonemes carrying a stress digit. */
const STRESS_DIGIT = /[0-2]$/;

/** True for a vowel phoneme (ARPAbet marks vowels, and only vowels, with stress). */
export function isVowel(phoneme: string): boolean {
  return STRESS_DIGIT.test(phoneme);
}

/** Drops the ARPAbet stress digit: "ER1" → "ER". */
export function stripStress(phoneme: string): string {
  return phoneme.replace(STRESS_DIGIT, '');
}

/** Counts syllables as the number of vowel-carrying phonemes (never below 1). */
export function countSyllables(phonemes: string[]): number {
  return Math.max(1, phonemes.filter(isVowel).length);
}

/**
 * Index of the phoneme the rime starts at: the primary-stressed vowel, or the
 * last vowel when nothing carries primary stress (CMUdict leaves some
 * function words unstressed). Null when the word has no vowel at all.
 */
export function rimeStartIndex(phonemes: string[]): number | null {
  let lastVowel: number | null = null;
  for (const [i, p] of phonemes.entries()) {
    if (!isVowel(p)) {
      continue;
    }
    if (p.endsWith('1')) {
      return i;
    }
    lastVowel = i;
  }
  return lastVowel;
}

/**
 * The rhyme key: every phoneme from the stressed vowel to the end,
 * stress-stripped. `placard` → "AE K ER D", `cat` → "AE T",
 * `colonel` → "ER N AH L". Null when the word has no vowel.
 */
export function strictRhymeKey(phonemes: string[]): string | null {
  const start = rimeStartIndex(phonemes);
  return start === null ? null : phonemes.slice(start).map(stripStress).join(' ');
}

/** A word needs this many rhymes before a page of them is worth having. */
export const RHYME_MIN_RHYMES = 8;
/**
 * How many words in one rhyme group may get a page. Every page in a group
 * lists the same words, so the group is the unit that goes thin: uncapped,
 * 71 groups would carry 40+ near-identical pages each — a doorway cluster.
 * The cap keeps the most-searched dozen and drops the tail.
 */
export const RHYME_MAX_PER_GROUP = 12;
/** A headword rarer than this is not searched for often enough to earn a page. */
export const RHYME_MAX_RANK = 20_000;
/** How many rhymes one page lists. Past this the table stops being readable. */
export const RHYME_LIST_LIMIT = 60;

/** Dependencies the rhyme model needs, injected so it can be unit-tested. */
export interface RhymeDeps {
  lookupPronunciation: (word: string) => string[] | null | undefined;
  /** 0-based frequency rank — lower is more common. */
  rankOf: (word: string) => number;
}

/**
 * Groups words by strict rhyme key. Input order is preserved inside each
 * group, which is frequency order when built from the frequency-ranked word
 * list. Words with no pronunciation or no vowel are skipped.
 */
export function buildStrictRhymeMap(
  words: string[],
  lookupPronunciation: RhymeDeps['lookupPronunciation']
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const word of words) {
    const phonemes = lookupPronunciation(word);
    if (!phonemes || phonemes.length === 0) {
      continue;
    }
    const key = strictRhymeKey(phonemes);
    if (key === null) {
      continue;
    }
    const list = map.get(key);
    if (list) {
      list.push(word);
    } else {
      map.set(key, [word]);
    }
  }
  return map;
}

/** The rhyme group `word` belongs to, or an empty list if it has none. */
export function rhymeGroup(word: string, map: Map<string, string[]>, deps: RhymeDeps): string[] {
  const phonemes = deps.lookupPronunciation(word);
  if (!phonemes) {
    return [];
  }
  const key = strictRhymeKey(phonemes);
  return key === null ? [] : (map.get(key) ?? []);
}

/**
 * The words that rhyme with `word`, nearest first: same syllable count before
 * one syllable off, and within that the more common word first. A rhyme of the
 * same length is the one a reader is actually looking for.
 */
export function rhymesFor(word: string, map: Map<string, string[]>, deps: RhymeDeps): string[] {
  const phonemes = deps.lookupPronunciation(word);
  if (!phonemes) {
    return [];
  }
  const own = countSyllables(phonemes);
  return rhymeGroup(word, map, deps)
    .filter((w) => w !== word)
    .map((w) => {
      const ph = deps.lookupPronunciation(w);
      return { word: w, distance: Math.abs(countSyllables(ph ?? []) - own), rank: deps.rankOf(w) };
    })
    .sort((a, b) => a.distance - b.distance || a.rank - b.rank)
    .slice(0, RHYME_LIST_LIMIT)
    .map((r) => r.word);
}

/**
 * The words that get a /rhymes/<word>/ page: enough rhymes to fill a list,
 * common enough to be searched for, and at most RHYME_MAX_PER_GROUP per rhyme
 * group. Returned in `words` order, so the caller keeps its own ranking.
 */
export function selectRhymePages(
  words: string[],
  map: Map<string, string[]>,
  rankOf: RhymeDeps['rankOf']
): string[] {
  const chosen = new Set<string>();
  for (const group of map.values()) {
    if (group.length - 1 < RHYME_MIN_RHYMES) {
      continue;
    }
    const eligible = [...group]
      .filter((w) => rankOf(w) < RHYME_MAX_RANK)
      .sort((a, b) => rankOf(a) - rankOf(b))
      .slice(0, RHYME_MAX_PER_GROUP);
    for (const w of eligible) {
      chosen.add(w);
    }
  }
  return words.filter((w) => chosen.has(w));
}

/** True when `word` is one of the words that got a rhyme page. */
export function hasRhymePage(word: string, pages: ReadonlySet<string>): boolean {
  return pages.has(word);
}
