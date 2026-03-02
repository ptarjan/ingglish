/**
 * Seeded PRNG (mulberry32) and Fisher-Yates shuffle.
 * Shared across all games for reproducible randomness.
 */

export function mulberry32(seed: number): () => number {
  // eslint-disable-next-line unicorn/prefer-math-trunc -- intentional int32 coercion for PRNG
  let s = seed | 0;
  return () => {
    // eslint-disable-next-line unicorn/prefer-math-trunc -- intentional int32 coercion for PRNG
    s = (s + 0x6d_2b_79_f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function shuffle<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}
