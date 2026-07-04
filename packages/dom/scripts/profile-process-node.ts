#!/usr/bin/env -S npx vite-node --script
/**
 * Deep profile of processTextNode to identify bottlenecks.
 */

import { performance } from 'perf_hooks';
import { JSDOM } from 'jsdom';
import { setupJSDOM } from './harness';

const ITERATIONS = 1000;

export async function main() {
  console.log('=== processTextNode Deep Profile ===\n');

  // Set up DOM
  const dom = new JSDOM('<!DOCTYPE html><html><body><p>Test</p></body></html>');
  setupJSDOM(dom);

  const { normalizeApostrophes, detectCasePattern, applyCasePattern } =
    await import('@ingglish/normalize');
  const { WORD_SPLIT_REGEX, WORD_TEST_REGEX } = await import('@ingglish/normalize');
  const { translate } = await import('ingglish');

  // Load dictionary
  console.log('Loading dictionary...');
  await translate('hello');
  console.log('');

  // Test data
  const testText =
    'The quick brown fox jumps over the lazy dog. This is a test sentence with words.';
  const translations: Record<string, string> = {
    the: 'dha',
    quick: 'kwik',
    brown: 'brown',
    fox: 'foks',
    jumps: 'jumps',
    over: 'ohver',
    lazy: 'layzee',
    dog: 'dog',
    this: 'dhis',
    is: 'iz',
    a: 'a',
    test: 'test',
    sentence: 'sentans',
    with: 'with',
    words: 'werdz',
  };

  console.log(`Test text: "${testText}"`);
  console.log(`Translations: ${Object.keys(translations).length} words\n`);

  // Profile each step
  const times: Record<string, number[]> = {
    normalize: [],
    split: [],
    loop_total: [],
    word_test: [],
    lookup: [],
    case_detect: [],
    case_apply: [],
    string_concat: [],
  };

  for (let iter = 0; iter < ITERATIONS; iter++) {
    // Step 1: Normalize
    let start = performance.now();
    const normalized = normalizeApostrophes(testText);
    times.normalize.push(performance.now() - start);

    // Step 2: Split
    start = performance.now();
    const tokens = normalized.split(WORD_SPLIT_REGEX);
    times.split.push(performance.now() - start);

    // Step 3: Loop through tokens
    let result = '';
    let wordTestTime = 0;
    let lookupTime = 0;
    let caseDetectTime = 0;
    let caseApplyTime = 0;
    let concatTime = 0;

    const loopStart = performance.now();
    for (const token of tokens) {
      if (!token) continue;

      const testStart = performance.now();
      const isWord = WORD_TEST_REGEX.test(token);
      wordTestTime += performance.now() - testStart;

      if (isWord) {
        const lookupStart = performance.now();
        const translated = translations[token.toLowerCase()];
        lookupTime += performance.now() - lookupStart;

        if (translated) {
          const detectStart = performance.now();
          const pattern = detectCasePattern(token);
          caseDetectTime += performance.now() - detectStart;

          const applyStart = performance.now();
          const cased = applyCasePattern(translated, pattern, token);
          caseApplyTime += performance.now() - applyStart;

          const concatStart = performance.now();
          result += cased;
          concatTime += performance.now() - concatStart;
        } else {
          const concatStart = performance.now();
          result += token;
          concatTime += performance.now() - concatStart;
        }
      } else {
        const concatStart = performance.now();
        result += token;
        concatTime += performance.now() - concatStart;
      }
    }
    times.loop_total.push(performance.now() - loopStart);
    times.word_test.push(wordTestTime);
    times.lookup.push(lookupTime);
    times.case_detect.push(caseDetectTime);
    times.case_apply.push(caseApplyTime);
    times.string_concat.push(concatTime);
  }

  // Calculate averages
  console.log('--- Average Times (µs) ---\n');
  for (const [name, samples] of Object.entries(times)) {
    const avgUs = (samples.reduce((a, b) => a + b, 0) / samples.length) * 1000;
    const minUs = Math.min(...samples) * 1000;
    const maxUs = Math.max(...samples) * 1000;
    console.log(
      `${name.padEnd(20)} avg: ${avgUs.toFixed(2).padStart(8)}µs  min: ${minUs.toFixed(2).padStart(8)}µs  max: ${maxUs.toFixed(2).padStart(8)}µs`
    );
  }

  // Calculate percentages of loop_total
  const loopTotalAvg = times.loop_total.reduce((a, b) => a + b, 0) / ITERATIONS;
  console.log('\n--- Time Breakdown (% of loop_total) ---\n');
  for (const name of ['word_test', 'lookup', 'case_detect', 'case_apply', 'string_concat']) {
    const pct = (
      (times[name].reduce((a, b) => a + b, 0) / ITERATIONS / loopTotalAvg) *
      100
    ).toFixed(1);
    console.log(`${name.padEnd(20)} ${pct.padStart(6)}%`);
  }

  // Profile alternatives for the bottleneck
  console.log('\n--- Alternative Implementations ---\n');

  // Alternative 1: Pre-compiled regex test
  const WORD_REGEX_GLOBAL = /[a-zA-Z]+/g;

  function processWithExec(text: string, trans: Record<string, string>): string {
    const normalized = normalizeApostrophes(text);
    let result = '';
    let lastIndex = 0;
    let match;

    while ((match = WORD_REGEX_GLOBAL.exec(normalized)) !== null) {
      // Add text between matches
      result += normalized.slice(lastIndex, match.index);
      lastIndex = match.index + match[0].length;

      const word = match[0];
      const translated = trans[word.toLowerCase()];
      if (translated) {
        const pattern = detectCasePattern(word);
        result += applyCasePattern(translated, pattern, word);
      } else {
        result += word;
      }
    }
    // Add remaining text
    result += normalized.slice(lastIndex);

    // Reset regex
    WORD_REGEX_GLOBAL.lastIndex = 0;

    return result;
  }

  // Verify output matches
  function processCurrent(text: string, trans: Record<string, string>): string {
    const normalized = normalizeApostrophes(text);
    let result = '';
    const tokens = normalized.split(WORD_SPLIT_REGEX);
    for (const token of tokens) {
      if (!token) continue;
      if (WORD_TEST_REGEX.test(token)) {
        const translated = trans[token.toLowerCase()];
        if (translated) {
          const pattern = detectCasePattern(token);
          result += applyCasePattern(translated, pattern, token);
        } else {
          result += token;
        }
      } else {
        result += token;
      }
    }
    return result;
  }

  const expected = processCurrent(testText, translations);
  const execResult = processWithExec(testText, translations);
  console.log(`Current output: "${expected}"`);
  console.log(`Exec matches: ${execResult === expected}`);
  console.log('');

  // Benchmark both
  function bench(name: string, fn: () => string): number {
    // Warmup
    for (let i = 0; i < 1000; i++) fn();

    const start = performance.now();
    for (let i = 0; i < ITERATIONS * 10; i++) {
      fn();
    }
    const elapsed = performance.now() - start;
    const avgNs = (elapsed / (ITERATIONS * 10)) * 1000 * 1000;
    console.log(
      `${name.padEnd(30)} ${(avgNs / 1000).toFixed(2).padStart(8)}µs per call  (${((ITERATIONS * 10 * 1000) / elapsed).toFixed(0)} ops/sec)`
    );
    return avgNs;
  }

  const currentNs = bench('Current (split+test)', () => processCurrent(testText, translations));
  const execNs = bench('Regex exec (no split)', () => processWithExec(testText, translations));

  console.log(`\nRegex exec is ${(((currentNs - execNs) / currentNs) * 100).toFixed(1)}% faster`);
}

if (process.argv[1]?.includes('profile-process-node')) main().catch(console.error);
