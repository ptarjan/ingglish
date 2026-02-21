#!/usr/bin/env npx vite-node
/**
 * Comprehensive benchmark suite for Ingglish core library.
 * Runs multiple iterations to get statistically meaningful results.
 */

import { benchmark, formatResult, type BenchmarkResult } from './harness';

async function main() {
  console.log('=== Ingglish Core Benchmarks ===\n');

  // Load modules
  const {
    loadDictionary,
    getDictionary,
    loadReverseDictionary,
    lookupPronunciation,
    sortByFrequency,
  } = await import('@ingglish/dictionary');
  const { translateSync } = await import('../../src/translate/forward');
  const { reverseTranslateWord, reverseTranslateSync } =
    await import('../../src/translate/reverse');
  const { ingglishToArpabet } = await import('@ingglish/phonemes');
  const { arpabetToIPA } = await import('@ingglish/ipa');

  // Load dictionary first
  console.log('Loading dictionary...');
  await loadDictionary();
  await loadReverseDictionary();
  const dict = getDictionary();
  console.log(`Dictionary loaded: ${Object.keys(dict).length} entries\n`);

  // Warm caches
  console.log('Warming caches...');
  sortByFrequency(['test', 'hello', 'world']); // Warm frequency map
  console.log('');

  const results: BenchmarkResult[] = [];

  // Test data
  const shortText = 'Hello world';
  const mediumText = 'The quick brown fox jumps over the lazy dog';
  const longText = mediumText.repeat(10);
  const commonWords = ['the', 'hello', 'world', 'computer', 'language'];
  const ingglishWords = ['haloh', 'werld', 'kumpyooter', 'langwij'];

  console.log('--- Forward Translation ---');

  results.push(
    benchmark('translateSync(short text)', () => {
      translateSync(shortText);
    })
  );

  results.push(
    benchmark('translateSync(medium text)', () => {
      translateSync(mediumText);
    })
  );

  results.push(
    benchmark('translateSync(long text ~450 chars)', () => {
      translateSync(longText);
    })
  );

  console.log('');
  console.log('--- Reverse Translation ---');

  results.push(
    benchmark('reverseTranslateWord(single)', () => {
      reverseTranslateWord('haloh');
    })
  );

  results.push(
    benchmark('reverseTranslateWord(5 words)', () => {
      for (const word of ingglishWords) {
        reverseTranslateWord(word);
      }
    })
  );

  results.push(
    benchmark('reverseTranslateSync(medium text)', () => {
      reverseTranslateSync('Dha kwik brown foks jumps ohver dha layzee dog');
    })
  );

  console.log('');
  console.log('--- Conversion Functions ---');

  results.push(
    benchmark('ingglishToArpabet(single word)', () => {
      ingglishToArpabet('haloh');
    })
  );

  results.push(
    benchmark('ingglishToArpabet(5 words)', () => {
      for (const word of ingglishWords) {
        ingglishToArpabet(word);
      }
    })
  );

  const arpabet = ['HH', 'AH0', 'L', 'OW1'];
  results.push(
    benchmark('arpabetToIPA(4 phonemes)', () => {
      arpabetToIPA(arpabet);
    })
  );

  const longArpabet = ['K', 'AH0', 'M', 'P', 'Y', 'UW1', 'T', 'ER0'];
  results.push(
    benchmark('arpabetToIPA(8 phonemes)', () => {
      arpabetToIPA(longArpabet);
    })
  );

  console.log('');
  console.log('--- Dictionary Operations ---');

  results.push(
    benchmark('lookupPronunciation(single)', () => {
      lookupPronunciation('hello');
    })
  );

  results.push(
    benchmark('lookupPronunciation(5 words)', () => {
      for (const word of commonWords) {
        lookupPronunciation(word);
      }
    })
  );

  results.push(
    benchmark('sortByFrequency(10 words)', () => {
      sortByFrequency(['hello', 'world', 'the', 'a', 'is', 'it', 'to', 'of', 'and', 'in']);
    })
  );

  results.push(
    benchmark('sortByFrequency(50 words)', () => {
      sortByFrequency(Array.from({ length: 50 }, (_, i) => `word${i}`));
    })
  );

  console.log('');
  console.log('=== Results ===\n');

  for (const r of results) {
    console.log(formatResult(r));
  }

  // Find slowest operations
  console.log('\n--- Slowest Operations (potential optimization targets) ---');
  const sorted = [...results].sort((a, b) => b.avgMs - a.avgMs);
  for (const r of sorted.slice(0, 5)) {
    console.log(formatResult(r));
  }
}

main().catch(console.error);
