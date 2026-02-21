/**
 * Shared benchmark harness for core profiling scripts.
 */

import { performance } from 'perf_hooks';

const DEFAULT_ITERATIONS = 1000;
const DEFAULT_WARMUP = 100;

export interface BenchmarkResult {
  name: string;
  avgMs: number;
  minMs: number;
  maxMs: number;
  opsPerSec: number;
}

export function benchmark(
  name: string,
  fn: () => void,
  iterations = DEFAULT_ITERATIONS,
  warmup = DEFAULT_WARMUP
): BenchmarkResult {
  for (let i = 0; i < warmup; i++) {
    fn();
  }

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

export function formatResult(r: BenchmarkResult): string {
  return `${r.name.padEnd(45)} ${r.avgMs.toFixed(3).padStart(8)}ms  (min: ${r.minMs.toFixed(3)}ms, max: ${r.maxMs.toFixed(3)}ms)  ${r.opsPerSec.toFixed(0).padStart(8)} ops/sec`;
}

export function profile<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`${name}: ${(end - start).toFixed(2)}ms`);
  return result;
}

export async function profileAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  console.log(`${name}: ${(end - start).toFixed(2)}ms`);
  return result;
}

export async function ensureDictLoaded(): Promise<void> {
  const { loadDictionary, loadReverseDictionary, loadFrequencies } =
    await import('@ingglish/dictionary');
  await Promise.all([loadDictionary(), loadReverseDictionary(), loadFrequencies()]);
}
