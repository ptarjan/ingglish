import { describe, it, expect, vi } from 'vitest';
import {
  charEditDistance,
  computeWeightedMetrics,
  editSimilarity,
  g2pRoundtripScore,
  phonemeLevenshtein,
  scoreWordOrthotactic,
} from './mapping-metrics';

// Mock @ingglish/dictionary with a small word set instead of loading the full
// 134k-entry CMU dictionary + frequencies (~5-9s). The tests only need relative
// scores from the bigram model, not exact values from the real dictionary.
vi.mock('@ingglish/dictionary', () => {
  const dict: Record<string, string[]> = {
    and: ['AH0', 'N', 'D'],
    bat: ['B', 'AE1', 'T'],
    cat: ['K', 'AE1', 'T'],
    hello: ['HH', 'AH0', 'L', 'OW1'],
    in: ['IH1', 'N'],
    is: ['IH1', 'Z'],
    of: ['AH1', 'V'],
    the: ['DH', 'AH0'],
    to: ['T', 'UW1'],
    world: ['W', 'ER1', 'L', 'D'],
  };
  const freqs: Record<string, number> = {
    and: 28_852,
    bat: 50,
    cat: 100,
    hello: 200,
    in: 18_214,
    is: 10_102,
    of: 22_050,
    the: 69_971,
    to: 26_149,
    world: 300,
  };
  return {
    getDictionary: () => dict,
    getWordFrequency: (w: string) => freqs[w] ?? 0,
    loadDictionary: async () => {},
    loadFrequencies: async () => {},
  };
});

describe('charEditDistance', () => {
  it.each([
    ['hello', 'hello', 0, 'identical strings'],
    ['', 'abc', 3, 'empty source'],
    ['abc', '', 3, 'empty target'],
    ['', '', 0, 'both empty'],
    ['cat', 'bat', 1, 'single substitution'],
    ['cat', 'cats', 1, 'insertion'],
    ['cats', 'cat', 1, 'deletion'],
    ['kitten', 'sitting', 3, 'multi-edit'],
  ])('charEditDistance(%s, %s) → %d (%s)', (a, b, expected) => {
    expect(charEditDistance(a, b)).toBe(expected);
  });
});

describe('editSimilarity', () => {
  it.each([
    ['hello', 'hello', 1, 'identical'],
    ['abc', 'xyz', 0, 'completely different'],
    ['', '', 1, 'both empty'],
  ])('editSimilarity(%s, %s) → %d (%s)', (a, b, expected) => {
    expect(editSimilarity(a, b)).toBe(expected);
  });

  it('returns fraction for partial similarity', () => {
    expect(editSimilarity('cat', 'bat')).toBeCloseTo(2 / 3);
  });
});

describe('phonemeLevenshtein', () => {
  it.each([
    [['B', 'AE', 'T'], ['B', 'AE', 'T'], 0, 'identical'],
    [[], ['B'], 1, 'empty source'],
    [['B'], [], 1, 'empty target'],
    [['B', 'AE', 'T'], ['K', 'AE', 'T'], 1, 'single substitution'],
  ] as const)('phonemeLevenshtein(%j, %j) → %d (%s)', (a, b, expected, _desc) => {
    expect(phonemeLevenshtein([...a], [...b])).toBe(expected);
  });
});

describe('g2pRoundtripScore', () => {
  it('returns 1.0 for a word G2P reads back correctly', () => {
    // "bat" → G2P predicts B AE T, original is B AE T
    expect(g2pRoundtripScore('bat', ['B', 'AE1', 'T'])).toBe(1);
  });

  it('penalizes spellings G2P cannot read back', () => {
    // "coo" for "you" → G2P predicts K UW, not Y UW
    const score = g2pRoundtripScore('coo', ['Y', 'UW1']);
    expect(score).toBeLessThan(1);
  });

  it('returns 1 for empty phonemes', () => {
    expect(g2pRoundtripScore('', [])).toBe(1);
  });
});

const trivialGrapheme = (p: string) => p[0]!.toLowerCase();

describe('computeWeightedMetrics', () => {
  it('frequency-weights so high-frequency preserved word dominates', () => {
    const result = computeWeightedMetrics(
      [
        { english: 'bat', frequency: 1000, phonemes: ['B', 'AE1', 'T'], spelling: 'bat' },
        { english: 'cat', frequency: 1, phonemes: ['K', 'AE1', 'T'], spelling: 'zzz' },
      ],
      trivialGrapheme
    );
    expect(result.textPreservedPct).toBeGreaterThan(99);
  });

  it('frequency-weights so high-frequency non-preserved word dominates', () => {
    const result = computeWeightedMetrics(
      [
        { english: 'bat', frequency: 1, phonemes: ['B', 'AE1', 'T'], spelling: 'bat' },
        { english: 'cat', frequency: 1000, phonemes: ['K', 'AE1', 'T'], spelling: 'zzz' },
      ],
      trivialGrapheme
    );
    expect(result.textPreservedPct).toBeLessThan(1);
  });

  it('with equal frequencies, treats words equally', () => {
    const result = computeWeightedMetrics(
      [
        { english: 'bat', frequency: 100, phonemes: ['B', 'AE1', 'T'], spelling: 'bat' },
        { english: 'cat', frequency: 100, phonemes: ['K', 'AE1', 'T'], spelling: 'zzz' },
      ],
      trivialGrapheme
    );
    expect(result.textPreservedPct).toBeCloseTo(50);
  });

  it('frequency-weights pronounceability', () => {
    // "bat" round-trips perfectly; "zzz" for "cat" does not
    const highFreqGood = computeWeightedMetrics(
      [
        { english: 'bat', frequency: 1000, phonemes: ['B', 'AE1', 'T'], spelling: 'bat' },
        { english: 'cat', frequency: 1, phonemes: ['K', 'AE1', 'T'], spelling: 'zzz' },
      ],
      trivialGrapheme
    );
    const highFreqBad = computeWeightedMetrics(
      [
        { english: 'bat', frequency: 1, phonemes: ['B', 'AE1', 'T'], spelling: 'bat' },
        { english: 'cat', frequency: 1000, phonemes: ['K', 'AE1', 'T'], spelling: 'zzz' },
      ],
      trivialGrapheme
    );
    expect(highFreqGood.pronounceability).toBeGreaterThan(highFreqBad.pronounceability);
  });

  it('frequency-weights edit similarity', () => {
    const highFreqIdentical = computeWeightedMetrics(
      [
        { english: 'bat', frequency: 1000, phonemes: ['B', 'AE1', 'T'], spelling: 'bat' },
        { english: 'cat', frequency: 1, phonemes: ['K', 'AE1', 'T'], spelling: 'zzz' },
      ],
      trivialGrapheme
    );
    const highFreqDifferent = computeWeightedMetrics(
      [
        { english: 'bat', frequency: 1, phonemes: ['B', 'AE1', 'T'], spelling: 'bat' },
        { english: 'cat', frequency: 1000, phonemes: ['K', 'AE1', 'T'], spelling: 'zzz' },
      ],
      trivialGrapheme
    );
    expect(highFreqIdentical.editSimilarity).toBeGreaterThan(highFreqDifferent.editSimilarity);
  });

  it('frequency-weights spelling familiarity', () => {
    // "bat" with phonemes B,AE1,T → graphemes b,a,t → all in "bat" → familiarity 1.0
    // "cat" with phonemes K,AE1,T → graphemes k,a,t → "k" not in "cat" → familiarity 2/3
    const highFreqFamiliar = computeWeightedMetrics(
      [
        { english: 'bat', frequency: 1000, phonemes: ['B', 'AE1', 'T'], spelling: 'bat' },
        { english: 'cat', frequency: 1, phonemes: ['K', 'AE1', 'T'], spelling: 'kat' },
      ],
      trivialGrapheme
    );
    const highFreqLessFamiliar = computeWeightedMetrics(
      [
        { english: 'bat', frequency: 1, phonemes: ['B', 'AE1', 'T'], spelling: 'bat' },
        { english: 'cat', frequency: 1000, phonemes: ['K', 'AE1', 'T'], spelling: 'kat' },
      ],
      trivialGrapheme
    );
    expect(highFreqFamiliar.spellingFamiliarity).toBeGreaterThan(
      highFreqLessFamiliar.spellingFamiliarity
    );
  });

  it('returns defaults for empty input', () => {
    const result = computeWeightedMetrics([], () => '');
    expect(result.textPreservedPct).toBe(0);
    expect(result.pronounceability).toBe(0);
    expect(result.editSimilarity).toBe(0);
    expect(result.spellingFamiliarity).toBe(0);
    expect(result.naturalness).toBe(-Infinity);
  });
});

describe('scoreWordOrthotactic', () => {
  it('returns a finite score for empty string (boundary bigram ^$)', () => {
    const score = scoreWordOrthotactic('');
    expect(Number.isFinite(score)).toBe(true);
  });

  it('scores common English words higher than nonsense', () => {
    const theScore = scoreWordOrthotactic('the');
    const xzqScore = scoreWordOrthotactic('xzq');
    expect(theScore).toBeGreaterThan(xzqScore);
  });

  it('returns a finite negative number for normal words', () => {
    const score = scoreWordOrthotactic('hello');
    expect(score).toBeLessThan(0);
    expect(Number.isFinite(score)).toBe(true);
  });
});
