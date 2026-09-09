import { describe, expect, it } from 'vitest';
import {
  buildStrictRhymeMap,
  countSyllables,
  hasRhymePage,
  isVowel,
  rhymeGroup,
  rhymesFor,
  rimeStartIndex,
  RHYME_LIST_LIMIT,
  RHYME_MAX_PER_GROUP,
  RHYME_MAX_RANK,
  RHYME_MIN_RHYMES,
  selectRhymePages,
  strictRhymeKey,
  stripStress,
  type RhymeDeps,
} from './rhymes';

const PRON: Record<string, string[]> = {
  colonel: ['K', 'ER1', 'N', 'AH0', 'L'],
  kernel: ['K', 'ER1', 'N', 'AH0', 'L'],
  journal: ['JH', 'ER1', 'N', 'AH0', 'L'],
  eternal: ['IH0', 'T', 'ER1', 'N', 'AH0', 'L'],
  several: ['S', 'EH1', 'V', 'ER0', 'AH0', 'L'],
  national: ['N', 'AE1', 'SH', 'AH0', 'N', 'AH0', 'L'],
  animal: ['AE1', 'N', 'AH0', 'M', 'AH0', 'L'],
  placard: ['P', 'L', 'AE1', 'K', 'ER0', 'D'],
  cat: ['K', 'AE1', 'T'],
  hat: ['HH', 'AE1', 'T'],
  the: ['DH', 'AH0'],
  hmm: ['HH', 'M'], // no vowel at all
};

const lookup = (word: string): string[] | null => PRON[word] ?? null;

/** Ranks words by their position in the list, the way the generator does. */
function ranker(words: string[]): RhymeDeps['rankOf'] {
  const ranks = new Map(words.map((w, i) => [w, i]));
  return (w) => ranks.get(w) ?? Number.POSITIVE_INFINITY;
}

function deps(words: string[]): RhymeDeps {
  return { lookupPronunciation: lookup, rankOf: ranker(words) };
}

describe('phoneme helpers', () => {
  it.each([
    ['AE1', true],
    ['ER0', true],
    ['K', false],
    ['NG', false],
  ])('isVowel(%s) → %s', (phoneme, expected) => {
    expect(isVowel(phoneme)).toBe(expected);
  });

  it('strips stress digits and counts syllables', () => {
    expect(stripStress('ER1')).toBe('ER');
    expect(stripStress('K')).toBe('K');
    expect(countSyllables(PRON.eternal!)).toBe(3);
    expect(countSyllables([])).toBe(1); // never zero — every word says something
  });
});

describe('strictRhymeKey', () => {
  it.each([
    ['placard', 'AE K ER D'],
    ['cat', 'AE T'],
    ['colonel', 'ER N AH L'],
    ['several', 'EH V ER AH L'],
    ['the', 'AH'], // nothing carries primary stress: falls back to the last vowel
    ['hmm', null], // no vowel, so nothing to rhyme on
  ])('%s → %s', (word, expected) => {
    expect(strictRhymeKey(PRON[word]!)).toBe(expected);
  });

  it('starts the rime at the primary-stressed vowel, not the last one', () => {
    expect(rimeStartIndex(PRON.placard!)).toBe(2);
    expect(rimeStartIndex(PRON.the!)).toBe(1);
    expect(rimeStartIndex(PRON.hmm!)).toBeNull();
  });
});

/**
 * The old key was the last two stress-stripped phonemes, which claimed
 * "colonel" rhymes with "several", "national" and "animal" on a shared /əl/ —
 * wrong output that shipped to the live site. This pins that the strict key
 * separates them and never collapses back onto that grouping.
 */
describe('strict grouping vs the old last-two-phonemes key', () => {
  const looseKey = (phonemes: string[]): string => phonemes.map(stripStress).slice(-2).join(' ');
  const wrong = ['colonel', 'several', 'national', 'animal'];

  it('separates words the loose key merged', () => {
    expect(new Set(wrong.map((w) => looseKey(PRON[w]!))).size).toBe(1);
    expect(new Set(wrong.map((w) => strictRhymeKey(PRON[w]!))).size).toBe(wrong.length);
  });

  it('keeps only real rhymes in the group', () => {
    const map = buildStrictRhymeMap([...wrong, 'kernel', 'journal', 'hmm'], lookup);
    expect(map.get('ER N AH L')).toEqual(['colonel', 'kernel', 'journal']);
    expect(map.has('AH L')).toBe(false); // the loose key is gone entirely
    expect([...map.values()].flat()).not.toContain('hmm'); // no vowel, no group
  });

  it('skips words the dictionary cannot pronounce', () => {
    expect(buildStrictRhymeMap(['nosuchword'], lookup).size).toBe(0);
  });
});

describe('rhymesFor', () => {
  const words = ['colonel', 'kernel', 'journal', 'eternal', 'cat'];
  const map = buildStrictRhymeMap(words, lookup);

  it('excludes the headword itself', () => {
    expect(rhymesFor('colonel', map, deps(words))).not.toContain('colonel');
  });

  it('puts same-syllable rhymes before longer ones, then the more common word', () => {
    // "eternal" is 3 syllables against colonel's 2, so it sorts last even
    // though it is ranked ahead of "journal" here.
    const order = ['colonel', 'eternal', 'kernel', 'journal'];
    expect(rhymesFor('colonel', map, deps(order))).toEqual(['kernel', 'journal', 'eternal']);
  });

  it('returns nothing for a word with no group and no pronunciation', () => {
    expect(rhymesFor('cat', map, deps(words))).toEqual([]);
    expect(rhymesFor('nosuchword', map, deps(words))).toEqual([]);
    expect(rhymeGroup('nosuchword', map, deps(words))).toEqual([]);
    expect(rhymeGroup('hmm', map, deps(words))).toEqual([]);
  });

  it('truncates at RHYME_LIST_LIMIT', () => {
    const many = Array.from({ length: RHYME_LIST_LIMIT + 40 }, (_, i) => `w${i}`);
    const big = new Map([['AE T', ['cat', ...many]]]);
    const fake: RhymeDeps = {
      lookupPronunciation: (w) => (w === 'cat' ? PRON.cat! : ['K', 'AE1', 'T']),
      rankOf: ranker(['cat', ...many]),
    };
    expect(rhymesFor('cat', big, fake)).toHaveLength(RHYME_LIST_LIMIT);
  });
});

describe('selectRhymePages', () => {
  /** A rhyme group of `size` synthetic words, all pronounced to rhyme with "cat". */
  function group(size: number, prefix = 'w'): string[] {
    return Array.from({ length: size }, (_, i) => `${prefix}${i}`);
  }

  it(`drops a group with ${RHYME_MIN_RHYMES - 1} rhymes and keeps one with ${RHYME_MIN_RHYMES}`, () => {
    const small = group(RHYME_MIN_RHYMES); // headword + 7 rhymes
    const big = group(RHYME_MIN_RHYMES + 1, 'x'); // headword + 8 rhymes
    const map = new Map([
      ['AE T', small],
      ['IH T', big],
    ]);
    const words = [...small, ...big];
    expect(selectRhymePages(words, map, ranker(words))).toEqual(big);
  });

  it(`gives at most ${RHYME_MAX_PER_GROUP} pages to one group`, () => {
    const forty = group(40);
    const map = new Map([['AE T', forty]]);
    const pages = selectRhymePages(forty, map, ranker(forty));
    expect(pages).toHaveLength(RHYME_MAX_PER_GROUP);
    // The most common members, in the caller's order.
    expect(pages).toEqual(forty.slice(0, RHYME_MAX_PER_GROUP));
  });

  it('drops a word nobody searches for, keeping its commoner rhymes', () => {
    const words = group(10);
    const rare = words.at(-1)!;
    const map = new Map([['AE T', words]]);
    const ranks = ranker(words);
    const pages = selectRhymePages(words, map, (w) => (w === rare ? RHYME_MAX_RANK : ranks(w)));
    expect(pages).not.toContain(rare);
    expect(pages).toHaveLength(words.length - 1);
  });
});

describe('hasRhymePage', () => {
  it('is true only for words that got a page', () => {
    const pages = new Set(['cat']);
    expect(hasRhymePage('cat', pages)).toBe(true);
    expect(hasRhymePage('colonel', pages)).toBe(false);
  });
});
