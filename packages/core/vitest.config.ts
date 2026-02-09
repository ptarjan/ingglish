import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Cache directory for faster subsequent runs
  cacheDir: './node_modules/.vite',
  // Use esbuild for faster TypeScript transforms
  esbuild: {
    target: 'esnext', // Required for top-level await support
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
