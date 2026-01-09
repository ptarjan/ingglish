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
    pool: 'threads',
    isolate: false, // Share global state (dictionary) across tests for speed
    // Faster timeouts
    testTimeout: 10000,
    hookTimeout: 30000,
  },
});
