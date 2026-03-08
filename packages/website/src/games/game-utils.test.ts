import { describe, expect, it } from 'vitest';
import { getTierLabel, makeScoreLabel } from './game-utils';

describe('getTierLabel', () => {
  it('returns Easy for tier 1', () => {
    expect(getTierLabel(1)).toBe('Easy');
  });

  it('returns Medium for tier 2', () => {
    expect(getTierLabel(2)).toBe('Medium');
  });

  it('returns Hard for tier 3', () => {
    expect(getTierLabel(3)).toBe('Hard');
  });

  it('returns Hard for any tier above 3', () => {
    expect(getTierLabel(5)).toBe('Hard');
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

  it('returns great label at 90%', () => {
    expect(getLabel(90)).toBe('Amazing!');
  });

  it('returns great label at 100%', () => {
    expect(getLabel(100)).toBe('Amazing!');
  });

  it('returns good label at 70%', () => {
    expect(getLabel(70)).toBe('Good job!');
  });

  it('returns good label at 89%', () => {
    expect(getLabel(89)).toBe('Good job!');
  });

  it('returns ok label at 50%', () => {
    expect(getLabel(50)).toBe('Not bad!');
  });

  it('returns ok label at 69%', () => {
    expect(getLabel(69)).toBe('Not bad!');
  });

  it('returns low label at 49%', () => {
    expect(getLabel(49)).toBe('Keep trying!');
  });

  it('returns low label at 0%', () => {
    expect(getLabel(0)).toBe('Keep trying!');
  });
});
