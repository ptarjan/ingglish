# Performance

This guide covers profiling, benchmarking, and optimization for Ingglish.

## Profiling Scripts

### Core Library (`packages/core/scripts/`)

| Script | Purpose |
|--------|---------|
| `benchmark.ts` | Full benchmark suite (1000 iterations, statistics) |
| `profile.ts` | Quick translation profiling |
| `profile-translate.ts` | translateSync performance analysis |
| `profile-convert.ts` | Phoneme conversion performance |

### DOM Library (`packages/dom/scripts/`)

| Script | Purpose |
|--------|---------|
| `profile-wikipedia.ts` | Real Wikipedia HTML profiling (~300KB) |
| `profile-tree-walker.ts` | TreeWalker alternatives comparison |
| `profile-process-node.ts` | Text node processing analysis |
| `profile-dom.ts` | General DOM translation profiling |
| `profile-real-html.ts` | Article-style HTML profiling |

## Running Benchmarks

### Core Library

```bash
cd packages/core

# Full benchmark suite
npx tsx scripts/benchmark.ts

# Quick profile
npx tsx scripts/profile.ts
```

Sample output:
```
=== Inglish Core Benchmarks ===

Iterations: 1000, Warmup: 100

--- Forward Translation ---
translateSync(short text)                      0.015ms  (min: 0.012ms, max: 0.089ms)     66667 ops/sec
translateSync(medium text)                     0.045ms  (min: 0.039ms, max: 0.156ms)     22222 ops/sec

--- Reverse Translation ---
reverseTranslateWord(single)                   0.008ms  (min: 0.006ms, max: 0.042ms)    125000 ops/sec
```

### DOM Library

```bash
cd packages/dom

# Profile with real Wikipedia content
npx tsx scripts/profile-wikipedia.ts

# Compare TreeWalker implementations
npx tsx scripts/profile-tree-walker.ts
```

Sample output from `profile-wikipedia.ts`:
```
=== Wikipedia HTML Profiling ===
HTML size: 287KB, Text nodes: 1,247, Words: 12,456

Phase                    Time (ms)    Per-item
─────────────────────────────────────────────
Collect nodes            12.3         9.8µs/node
Extract words            4.2          0.3µs/word
Apply translations       45.6         3.7µs/word
─────────────────────────────────────────────
Total                    62.1ms
```

## Performance Characteristics

| Operation | Complexity | Notes |
|-----------|------------|-------|
| Dictionary loading | O(n) | ~3MB gzipped, loaded once and cached |
| Word lookup | O(1) | Hash map lookup |
| Translation | O(n) | n = word count |
| Reverse translation | O(1) | Phoneme key lookup after initial build |
| DOM traversal | O(n) | TreeWalker, n = nodes |

## Optimization Guidelines

1. **Profile first** - Measure before optimizing to identify actual bottlenecks

2. **Use pre-collected nodes** - Pass `textNodes` to `applyTranslationsMap()` to avoid double DOM traversal

3. **Batch translations** - Use `translateWordsInBatches()` for large word sets

4. **Chunked rendering** - Use `requestAnimationFrame` for smooth rendering on large pages

5. **Cache translations** - The extension caches 50K translations in the background worker

## Bundle Splitting

The core library uses dynamic imports for code splitting:

- `index.ts` - Minimal public API (~2KB)
- Dictionary data - Loaded on first `translate()` call (~3MB)
- Word frequencies - Loaded on first reverse translation (~500KB)

This keeps initial page load fast while deferring heavy data until needed.

## See Also

- [Architecture](architecture.md) - System design and data flow
- [Contributing](contributing.md) - Development workflow
