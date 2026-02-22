import { describe, it, expect, beforeAll } from 'vitest';
import { loadDictionary, loadFrequencies } from '@ingglish/dictionary';
import {
  charEditDistance,
  computeWeightedMetrics,
  editSimilarity,
  g2pRoundtripScore,
  phonemeLevenshtein,
  scoreWordOrthotactic,
} from './mapping-metrics';

beforeAll(async () => {
  await Promise.all([loadDictionary(), loadFrequencies()]);
}, 30_000);

describe('charEditDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(charEditDistance('hello', 'hello')).toBe(0);
  });

  it('handles empty strings', () => {
    expect(charEditDistance('', 'abc')).toBe(3);
    expect(charEditDistance('abc', '')).toBe(3);
    expect(charEditDistance('', '')).toBe(0);
  });

  it('computes single-character substitution', () => {
    expect(charEditDistance('cat', 'bat')).toBe(1);
  });

  it('computes insertion and deletion', () => {
    expect(charEditDistance('cat', 'cats')).toBe(1);
    expect(charEditDistance('cats', 'cat')).toBe(1);
  });

  it('computes multi-edit distance', () => {
    expect(charEditDistance('kitten', 'sitting')).toBe(3);
  });
});

describe('editSimilarity', () => {
  it('returns 1 for identical strings', () => {
    expect(editSimilarity('hello', 'hello')).toBe(1);
  });

  it('returns 0 for completely different strings of same length', () => {
    expect(editSimilarity('abc', 'xyz')).toBe(0);
  });

  it('returns 1 for two empty strings', () => {
    expect(editSimilarity('', '')).toBe(1);
  });

  it('returns fraction for partial similarity', () => {
    // cat → bat: 1 edit / 3 max = 0.333 distance → 0.667 similarity
    expect(editSimilarity('cat', 'bat')).toBeCloseTo(2 / 3);
  });
});

describe('phonemeLevenshtein', () => {
  it('returns 0 for identical arrays', () => {
    expect(phonemeLevenshtein(['B', 'AE', 'T'], ['B', 'AE', 'T'])).toBe(0);
  });

  it('handles empty arrays', () => {
    expect(phonemeLevenshtein([], ['B'])).toBe(1);
    expect(phonemeLevenshtein(['B'], [])).toBe(1);
  });

  it('counts substitutions', () => {
    expect(phonemeLevenshtein(['B', 'AE', 'T'], ['K', 'AE', 'T'])).toBe(1);
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
