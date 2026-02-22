import { bench, describe } from 'vitest';
import { translateSync, translateSyncWithMapping } from './forward';

// --- Single word benchmarks ---

describe('translateSync - single words', () => {
  bench('dictionary hit (hello)', () => {
    translateSync('hello');
  });

  bench('unknown / G2P (flurbletrax)', () => {
    translateSync('flurbletrax');
  });

  bench('compound (nevertheless)', () => {
    translateSync('nevertheless');
  });

  bench('stemmed (unhappiness)', () => {
    translateSync('unhappiness');
  });

  bench('initialism (API)', () => {
    translateSync('API');
  });

  bench('camelCase (iPhone)', () => {
    translateSync('iPhone');
  });

  bench("contraction (don't)", () => {
    translateSync("don't");
  });
});

// --- Text throughput benchmarks ---

const sentence = 'The quick brown fox jumps over the lazy dog';
const paragraph =
  'The quick brown fox jumps over the lazy dog. ' +
  'She sells seashells by the seashore. ' +
  'How much wood would a woodchuck chuck if a woodchuck could chuck wood. ' +
  'Peter Piper picked a peck of pickled peppers.';
const article = Array.from({ length: 10 }, () => paragraph).join(' ');

describe('translateSync - text throughput', () => {
  bench('sentence (~9 words)', () => {
    translateSync(sentence);
  });

  bench('paragraph (~40 words)', () => {
    translateSync(paragraph);
  });

  bench('article (~400 words)', () => {
    translateSync(article);
  });
});

// --- With mapping (UI path) ---

describe('translateSyncWithMapping', () => {
  bench('sentence', () => {
    translateSyncWithMapping(sentence);
  });

  bench('paragraph', () => {
    translateSyncWithMapping(paragraph);
  });
});
