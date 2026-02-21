#!/usr/bin/env npx vite-node
/**
 * Profile arpabetToIngglish breakdown to find the bottleneck.
 */

import { performance } from 'perf_hooks';

const ITERATIONS = 10000;

async function main() {
  console.log('=== arpabetToIngglish Deep Profile ===\n');

  const { STRESS_MARKER_REGEX, stripStress, ARPABET_TO_INGGLISH_MAP } =
    await import('@ingglish/phonemes');

  // Test data - typical pronunciation
  const arpabet = ['K', 'AH0', 'M', 'P', 'Y', 'UW1', 'T', 'ER0']; // "computer"

  // Current implementation
  function arpabetToIngglishCurrent(arr: string[]): string {
    return arr
      .map((phoneme) => {
        const base = stripStress(phoneme);
        return ARPABET_TO_INGGLISH_MAP[base] ?? phoneme.toLowerCase();
      })
      .join('');
  }

  // Alternative 1: Avoid regex for most consonants (no stress marker)
  function stripStressFast(phoneme: string): string {
    const lastChar = phoneme.charCodeAt(phoneme.length - 1);
    // '0'=48, '1'=49, '2'=50
    if (lastChar >= 48 && lastChar <= 50) {
      return phoneme.slice(0, -1);
    }
    return phoneme;
  }

  function arpabetToIngglishFast(arr: string[]): string {
    return arr
      .map((phoneme) => {
        const base = stripStressFast(phoneme);
        return ARPABET_TO_INGGLISH_MAP[base] ?? phoneme.toLowerCase();
      })
      .join('');
  }

  // Alternative 2: Single loop with string concatenation
  function arpabetToIngglishLoop(arr: string[]): string {
    let result = '';
    for (const phoneme of arr) {
      const base = stripStressFast(phoneme);
      result += ARPABET_TO_INGGLISH_MAP[base] ?? phoneme.toLowerCase();
    }
    return result;
  }

  // Alternative 3: Array push + join (avoids map callback overhead)
  function arpabetToIngglishPush(arr: string[]): string {
    const parts: string[] = [];
    for (const phoneme of arr) {
      const base = stripStressFast(phoneme);
      parts.push(ARPABET_TO_INGGLISH_MAP[base] ?? phoneme.toLowerCase());
    }
    return parts.join('');
  }

  // Verify all produce same output
  const expected = arpabetToIngglishCurrent(arpabet);
  console.log(`Expected output: "${expected}"`);
  console.log(`Fast matches: ${arpabetToIngglishFast(arpabet) === expected}`);
  console.log(`Loop matches: ${arpabetToIngglishLoop(arpabet) === expected}`);
  console.log(`Push matches: ${arpabetToIngglishPush(arpabet) === expected}`);
  console.log('');

  // Benchmark each
  function bench(name: string, fn: () => string): number {
    // Warmup
    for (let i = 0; i < 1000; i++) fn();

    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      fn();
    }
    const elapsed = performance.now() - start;
    const avgNs = (elapsed / ITERATIONS) * 1000;
    console.log(
      `${name.padEnd(30)} ${avgNs.toFixed(0).padStart(6)}ns per call  (${((ITERATIONS / elapsed) * 1000).toFixed(0)} ops/sec)`
    );
    return avgNs;
  }

  console.log('--- Benchmarks ---\n');

  const current = bench('Current (regex stripStress)', () => arpabetToIngglishCurrent(arpabet));
  const fast = bench('Fast (charCode stripStress)', () => arpabetToIngglishFast(arpabet));
  const loop = bench('Loop (string concat)', () => arpabetToIngglishLoop(arpabet));
  const push = bench('Push + join', () => arpabetToIngglishPush(arpabet));

  console.log('\n--- Improvement ---\n');
  console.log(`Fast vs Current: ${(((current - fast) / current) * 100).toFixed(1)}% faster`);
  console.log(`Loop vs Current: ${(((current - loop) / current) * 100).toFixed(1)}% faster`);
  console.log(`Push vs Current: ${(((current - push) / current) * 100).toFixed(1)}% faster`);

  // Profile just stripStress
  console.log('\n--- stripStress alone ---\n');
  const testPhoneme = 'AH0';

  bench('stripStress (regex)', () => {
    return testPhoneme.replace(STRESS_MARKER_REGEX, '');
  });

  bench('stripStressFast (charCode)', () => {
    return stripStressFast(testPhoneme);
  });
}

main().catch(console.error);
