# Performance

How to profile, benchmark, and optimize Ingglish.

## Profiling Scripts

### Core Library (`packages/core/scripts/profile/`)

| Script | Purpose |
|--------|---------|
| `benchmark.ts` | Full benchmark suite (1000 iterations, statistics) |
| `overview.ts` | Quick translation profile |
| `translate.ts` | translateSync performance |
| `convert.ts` | Phoneme conversion performance |
| `cpu-profile.ts` | V8 CPU profiler for flame graphs |
| `harness.ts` | Shared benchmark and formatting helpers |

### DOM Library (`packages/dom/scripts/`)

| Script | Purpose |
|--------|---------|
| `profile-wikipedia.ts` | Profiles a real Wikipedia page (~220KB of HTML) |
| `profile-tree-walker.ts` | Compares TreeWalker alternatives |
| `profile-process-node.ts` | Text node processing cost |
| `profile-dom.ts` | General DOM translation profile |
| `profile-real-html.ts` | Profiles article-style HTML |
| `profile-tooltips.ts` | Compares tooltip overhead |

## Running Benchmarks

### Core Library

```bash
cd packages/core

# Full benchmark suite
npx vite-node --script scripts/profile/benchmark.ts

# Quick profile
npx vite-node --script scripts/profile/overview.ts
```

Sample output:
```
=== Ingglish Core Benchmarks ===

Iterations: 1000, Warmup: 100

--- Forward Translation ---
translateSync(short text)                      0.005ms  (min: 0.003ms, max: 0.033ms)    212690 ops/sec
translateSync(medium text)                     0.013ms  (min: 0.009ms, max: 0.077ms)     74524 ops/sec

--- Reverse Translation ---
reverseTranslateWord(single)                   0.005ms  (min: 0.003ms, max: 0.544ms)    183851 ops/sec
```

### DOM Library

```bash
cd packages/dom

# Profile with real Wikipedia content
npx vite-node --script scripts/profile-wikipedia.ts

# Compare TreeWalker implementations
npx vite-node --script scripts/profile-tree-walker.ts
```

Sample output from `profile-wikipedia.ts` (abridged):
```
=== Wikipedia DOM Profile ===

HTML size: 219.3 KB

--- DOM Statistics ---
Total elements: 2213
Text nodes: 808
Total word occurrences: 1769
Unique words: 927

collectTextNodes:  avg: 18.70ms  (23.14µs per node)
extractWordsFromNodes:  avg: 1.11ms  (927 unique words)
applyTranslationsMap:  avg: 62.14ms  min: 41.51ms  max: 114.88ms

=== Summary ===

Total translation time: 62.14ms for 808 text nodes (1769 words)
Breakdown:
  - collectTextNodes: 18.70ms (30.1%)
  - Text processing:  2.63ms (4.2%)
  - DOM updates:      40.82ms (65.7%)
```

The phases overlap: `applyTranslationsMap` walks the DOM itself, so its time already includes collecting the text nodes. The total is the `applyTranslationsMap` time, and the breakdown splits it into its parts. Timings vary from run to run.

## Performance Characteristics

### Summary

| Path | Complexity | Notes |
|------|------------|-------|
| Forward (dictionary hit) | O(p) | p = phoneme count |
| Forward (unknown word) | O(n) | n = word length |
| Reverse | O(n) | Pre-sorted at build time |
| Full text | O(w × n) | w = word count |

Every path is **linear**: nothing is quadratic or exponential.

### Forward Translation (`translateWord`)

| Operation | Complexity | Notes |
|-----------|------------|-------|
| Dictionary lookup | O(1) | Hash table, phonemes pre-split at build time |
| ARPAbet→Ingglish | O(p) | p = phoneme count, single pass |
| CamelCase split | O(n) | n = word length, single pass |
| Case detection | O(n) | Single pass through word |

#### Fallback chain for unknown words

| Strategy | Complexity | Notes |
|----------|------------|-------|
| Custom pronunciations | O(1) | Hash table lookup |
| Initialism check | O(n) | Hash table lookup, then spells out each letter |
| Compound splitting | O(n) | n-2 split points × O(1) lookup each |
| Stemming | O(1) | ~20 suffixes × ~4 variants = constant |
| G2P (grapheme-to-phoneme) rules | O(n) | n chars × ~40 rules (constant) |

### Reverse Translation (`reverseTranslateWord`)

| Operation | Complexity | Notes |
|-----------|------------|-------|
| Ingglish→ARPAbet | O(n) | n = word length |
| Phoneme key lookup | O(1) | Hash table, words pre-sorted by frequency at build time |

### Infrastructure

| Operation | Complexity | Notes |
|-----------|------------|-------|
| Forward dictionary load | O(n) | ~1MB gzipped, phonemes pre-split |
| Reverse dictionary load | O(n) | ~300KB gzipped, words pre-sorted |
| DOM traversal | O(n) | TreeWalker, n = nodes |

## Optimization Guidelines

1. **Profile first**: measure before optimizing, so you fix the real bottleneck

2. **Reuse collected nodes**: pass `textNodes` to `applyTranslationsMap()` so the DOM isn't walked twice

3. **Batch translations**: use `translateWordsInBatches()` for large sets of words

4. **Render in chunks**: use `requestAnimationFrame` to keep large pages smooth

5. **Cache translations**: the Chrome extension's background worker caches 50K translations

## Bundle Splitting

The `@ingglish/dictionary` package splits its code with dynamic imports:

- `ingglish` index: the minimal public API (~2KB)
- Forward dictionary: loaded on the first `translate()` call (~1MB gzipped)
- Reverse dictionary: loaded on the first reverse translation (~300KB gzipped)
- Word frequencies: loaded on the first reverse translation (~500KB)

`@ingglish/dictionary` pre-processes the dictionaries at build time:
- Phonemes pre-split into arrays (no runtime string splitting)
- Reverse dictionary pre-sorted by word frequency (no runtime sorting)

The first page load stays fast, and the heavy data loads only when it's needed.