import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  // Cache directory for faster subsequent runs
  cacheDir: './node_modules/.vite',
  // Use esbuild for faster TypeScript transforms
  esbuild: {
    target: 'esnext', // Required for top-level await support
  },
  resolve: {
    alias: {
      '@ingglish/normalize': resolve(__dirname, '../normalize/src/index.ts'),
      '@ingglish/phonemes': resolve(__dirname, '../phonemes/src/index.ts'),
      '@ingglish/tokenize': resolve(__dirname, '../tokenize/src/index.ts'),
      '@ingglish/dictionary': resolve(__dirname, '../dictionary/src/index.ts'),
      '@ingglish/fallback': resolve(__dirname, '../fallback/src/index.ts'),
      '@ingglish/g2p': resolve(__dirname, '../g2p/src/index.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
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
