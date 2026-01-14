/**
 * Comprehensive benchmark suite for Inglish core library.
 * Runs multiple iterations to get statistically meaningful results.
 */

import { performance } from 'perf_hooks';

const ITERATIONS = 1000;
const WARMUP_ITERATIONS = 100;

interface BenchmarkResult {
  name: string;
  avgMs: number;
  minMs: number;
  maxMs: number;
  opsPerSec: number;
}

function benchmark(name: string, fn: () => void, iterations = ITERATIONS): BenchmarkResult {
  // Warmup
  for (let i = 0; i < WARMUP_ITERATIONS; i++) {
    fn();
  }

  // Collect samples
  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    times.push(performance.now() - start);
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);

  return {
    name,
    avgMs: avg,
    minMs: min,
    maxMs: max,
    opsPerSec: 1000 / avg,
  };
}

function formatResult(r: BenchmarkResult): string {
  return `${r.name.padEnd(45)} ${r.avgMs.toFixed(3).padStart(8)}ms  (min: ${r.minMs.toFixed(3)}ms, max: ${r.maxMs.toFixed(3)}ms)  ${r.opsPerSec.toFixed(0).padStart(8)} ops/sec`;
}

async function main() {
  console.log('=== Inglish Core Benchmarks ===\n');
  console.log(`Iterations: ${ITERATIONS}, Warmup: ${WARMUP_ITERATIONS}\n`);

  // Load modules
  const { loadDictionary, getDictionary } = await import('../src/dictionary/loader');
  const { translateSync } = await import('../src/translate/forward');
  const { reverseTranslateWord, reverseTranslateSync } = await import('../src/translate/reverse');
  const { ingglishToArpabet } = await import('../src/convert/from-ingglish');
  const { arpabetToIPA } = await import('../src/convert/to-ipa');
  const { lookupPronunciation } = await import('../src/dictionary/lookup');
  const { loadReverseDictionary } = await import('../src/dictionary/reverse');
  const { sortByFrequency } = await import('../src/utils/frequency');

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
  const ingglishWords = ['huloh', 'werld', 'kumpyooter', 'langwij'];

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
      reverseTranslateWord('huloh');
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
      reverseTranslateSync('Dhuh kwik brown foks jumps ohver dhuh layzee dog');
    })
  );

  console.log('');
  console.log('--- Conversion Functions ---');

  results.push(
    benchmark('ingglishToArpabet(single word)', () => {
      ingglishToArpabet('huloh');
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
