import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Cache directory for faster subsequent runs
  cacheDir: './node_modules/.vite',
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    // Performance optimizations
    pool: 'threads',
    poolOptions: {
      threads: {
        // Share global state (dictionary) across tests for speed
        isolate: false,
        // Use all available CPU threads
        useAtomics: true,
      },
    },
  },
});
