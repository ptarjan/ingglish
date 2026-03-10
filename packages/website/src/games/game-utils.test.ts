import { describe, expect, it } from 'vitest';
import { getTierLabel, makeScoreLabel } from './game-utils';

describe('getTierLabel', () => {
  it.each<{ expected: string; tier: number }>([
    { expected: 'Easy', tier: 1 },
    { expected: 'Medium', tier: 2 },
    { expected: 'Hard', tier: 3 },
    { expected: 'Hard', tier: 5 },
  ])('returns $expected for tier $tier', ({ expected, tier }) => {
    expect(getTierLabel(tier)).toBe(expected);
  });
});

describe('makeScoreLabel', () => {
  const labels = {
    good: 'Good job!',
    great: 'Amazing!',
    low: 'Keep trying!',
    ok: 'Not bad!',
  };
  const getLabel = makeScoreLabel(labels);

  it.each<{ expected: string; percentage: number }>([
    { expected: 'Amazing!', percentage: 90 },
    { expected: 'Amazing!', percentage: 100 },
    { expected: 'Good job!', percentage: 70 },
    { expected: 'Good job!', percentage: 89 },
    { expected: 'Not bad!', percentage: 50 },
    { expected: 'Not bad!', percentage: 69 },
    { expected: 'Keep trying!', percentage: 49 },
    { expected: 'Keep trying!', percentage: 0 },
  ])('returns "$expected" at $percentage%', ({ expected, percentage }) => {
    expect(getLabel(percentage)).toBe(expected);
  });
});
