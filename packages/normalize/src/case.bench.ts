import { bench, describe } from 'vitest';
import { applyCasePattern, detectCasePattern, splitCamelCase } from './case';

// --- detectCasePattern ---

describe('detectCasePattern', () => {
  bench('lowercase (hello)', () => {
    detectCasePattern('hello');
  });

  bench('capitalized (Hello)', () => {
    detectCasePattern('Hello');
  });

  bench('uppercase (HELLO)', () => {
    detectCasePattern('HELLO');
  });

  bench('mixed/camelCase (iPhone)', () => {
    detectCasePattern('iPhone');
  });

  bench('short initialism (AI)', () => {
    detectCasePattern('AI');
  });

  bench('single char (I)', () => {
    detectCasePattern('I');
  });
});

// --- applyCasePattern ---

describe('applyCasePattern', () => {
  bench('lower (already lowercase)', () => {
    applyCasePattern('hello', 'lower');
  });

  bench('lower (needs lowering)', () => {
    applyCasePattern('Hello', 'lower');
  });

  bench('capitalized', () => {
    applyCasePattern('hello', 'capitalized');
  });

  bench('upper', () => {
    applyCasePattern('hello', 'upper');
  });

  bench('mixed with original', () => {
    applyCasePattern('hello', 'mixed', 'HeLLo');
  });
});

// --- splitCamelCase ---

describe('splitCamelCase', () => {
  bench('no split (hello)', () => {
    splitCamelCase('hello');
  });

  bench('simple split (iPhone)', () => {
    splitCamelCase('iPhone');
  });

  bench('multi split (MacBook)', () => {
    splitCamelCase('MacBook');
  });
});

// --- Realistic workload ---

const mixedWords = [
  'the',
  'Quick',
  'brown',
  'FOX',
  'jumps',
  'over',
  'the',
  'lazy',
  'dog',
  'iPhone',
  'API',
  'hello',
];

describe('detectCasePattern - realistic mix', () => {
  bench('12-word mixed case batch', () => {
    for (const w of mixedWords) {
      detectCasePattern(w);
    }
  });
});
