import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Cache directory for faster subsequent runs
  cacheDir: './node_modules/.vite',
  // Use esbuild for faster TypeScript transforms
  esbuild: {
    target: 'esnext', // Required for top-level await support
  },
  resolve: {
    conditions: ['source'],
  },
  ssr: {
    resolve: { conditions: ['source'] },
  },
  benchmark: {
    include: ['src/**/*.bench.ts'],
    setupFiles: ['./vitest.setup.ts'],
  },
  test: {
    globals: true,
    environment: 'node',
    // Exclude CLI integration tests — they spawn vite-node processes (~3s each).
    // Run them separately via: npx vitest run scripts/
    include: ['src/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.bench.ts'],
      reporter: ['text', 'json', 'html'],
      thresholds: { lines: 100, functions: 100, statements: 100 },
    },
    // Performance optimizations
    // Single worker avoids loading dictionaries multiple times (9s vs 17s)
    maxWorkers: 1,
    sequence: { groupOrder: 1 }, // Unique group since maxWorkers differs from other packages
    isolate: false, // Share global state (dictionary) across tests
    // Faster timeouts
    testTimeout: 10000,
    hookTimeout: 30000,
  },
});
