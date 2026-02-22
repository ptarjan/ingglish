import { bench, describe } from 'vitest';
import { dpDecompose } from './compounds';
import { matchStemming } from './stemming';
import { translateUnknown } from './index';

// --- translateUnknown: different fallback paths ---

describe('translateUnknown', () => {
  bench('compound path (nevertheless)', () => {
    translateUnknown('nevertheless');
  });

  bench('stemming path (unhappiness)', () => {
    translateUnknown('unhappiness');
  });

  bench('G2P-only path (flurbletrax)', () => {
    translateUnknown('flurbletrax');
  });
});

// --- dpDecompose ---

describe('dpDecompose', () => {
  bench('6-char compound (sunset)', () => {
    dpDecompose('sunset');
  });

  bench('10-char compound (basketball)', () => {
    dpDecompose('basketball');
  });

  bench('12-char compound (nevertheless)', () => {
    dpDecompose('nevertheless');
  });

  bench('no-split case (beautiful)', () => {
    dpDecompose('beautiful');
  });
});

// --- matchStemming ---

describe('matchStemming', () => {
  bench('-ing suffix (running)', () => {
    matchStemming('running');
  });

  bench('-tion suffix (education)', () => {
    matchStemming('education');
  });

  bench('un- prefix (unhappy)', () => {
    matchStemming('unhappy');
  });

  bench('no match (flurbletrax)', () => {
    matchStemming('flurbletrax');
  });
});
