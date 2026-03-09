#!/usr/bin/env npx vite-node
/**
 * Deep profile of translateSync to identify bottlenecks.
 */

import { performance } from 'perf_hooks';

const ITERATIONS = 100;

export async function main() {
  console.log('=== translateSync Deep Profile ===\n');

  const { loadDictionary, lookupPronunciation } = await import('@ingglish/dictionary');
  const { arpabetToFormat } = await import('@ingglish/phonemes');
  const { tokenizeText } = await import('@ingglish/normalize');
  const { normalizeApostrophes, detectCasePattern, applyCasePattern } =
    await import('@ingglish/normalize');

  await loadDictionary();

  // Test text
  const text = 'The quick brown fox jumps over the lazy dog. '.repeat(10);
  console.log(`Text length: ${text.length} chars\n`);

  // Profile each step
  const times: Record<string, number[]> = {
    normalize: [],
    tokenize: [],
    translate_total: [],
    lookup_total: [],
    convert_total: [],
    case_detect: [],
    case_apply: [],
  };

  for (let iter = 0; iter < ITERATIONS; iter++) {
    // Step 1: Normalize
    let start = performance.now();
    const normalized = normalizeApostrophes(text);
    times.normalize.push(performance.now() - start);

    // Step 2: Tokenize
    start = performance.now();
    const tokens = tokenizeText(normalized);
    times.tokenize.push(performance.now() - start);

    // Step 3: Translate each word
    let lookupTime = 0;
    let convertTime = 0;
    let caseDetectTime = 0;
    let caseApplyTime = 0;

    start = performance.now();
    for (const { text: token, isWord } of tokens) {
      if (!isWord) continue;

      const detectStart = performance.now();
      const pattern = detectCasePattern(token);
      caseDetectTime += performance.now() - detectStart;

      const lookupStart = performance.now();
      const pronunciation = lookupPronunciation(token.toLowerCase());
      lookupTime += performance.now() - lookupStart;

      if (pronunciation) {
        const convertStart = performance.now();
        const translated = arpabetToFormat(pronunciation, 'ingglish');
        convertTime += performance.now() - convertStart;

        const applyStart = performance.now();
        applyCasePattern(translated, pattern, token);
        caseApplyTime += performance.now() - applyStart;
      }
    }
    times.translate_total.push(performance.now() - start);
    times.lookup_total.push(lookupTime);
    times.convert_total.push(convertTime);
    times.case_detect.push(caseDetectTime);
    times.case_apply.push(caseApplyTime);
  }

  // Calculate averages
  console.log('--- Average Times (ms) ---\n');
  for (const [name, samples] of Object.entries(times)) {
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    const min = Math.min(...samples);
    const max = Math.max(...samples);
    console.log(
      `${name.padEnd(20)} avg: ${avg.toFixed(4)}ms  min: ${min.toFixed(4)}ms  max: ${max.toFixed(4)}ms`
    );
  }

  // Calculate percentages
  const totalAvg = times.translate_total.reduce((a, b) => a + b, 0) / times.translate_total.length;
  console.log('\n--- Time Breakdown (% of translate_total) ---\n');
  console.log(
    `lookup_total:    ${((times.lookup_total.reduce((a, b) => a + b, 0) / ITERATIONS / totalAvg) * 100).toFixed(1)}%`
  );
  console.log(
    `convert_total:   ${((times.convert_total.reduce((a, b) => a + b, 0) / ITERATIONS / totalAvg) * 100).toFixed(1)}%`
  );
  console.log(
    `case_detect:     ${((times.case_detect.reduce((a, b) => a + b, 0) / ITERATIONS / totalAvg) * 100).toFixed(1)}%`
  );
  console.log(
    `case_apply:      ${((times.case_apply.reduce((a, b) => a + b, 0) / ITERATIONS / totalAvg) * 100).toFixed(1)}%`
  );

  // Count tokens
  const normalized = normalizeApostrophes(text);
  const tokens = tokenizeText(normalized);
  const words = tokens.filter((t) => t.isWord);
  console.log(`\n--- Token Stats ---`);
  console.log(`Total tokens: ${tokens.length}`);
  console.log(`Word tokens: ${words.length}`);
  console.log(`Time per word: ${((totalAvg / words.length) * 1000).toFixed(2)}µs`);
}

if (process.argv[1]?.includes('translate')) main().catch(console.error);
