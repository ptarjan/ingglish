import { defineConfig } from 'vitest/config';

export default defineConfig({
  cacheDir: './node_modules/.vite',
  esbuild: {
    target: 'esnext',
  },
  resolve: {
    conditions: ['source'],
  },
  ssr: {
    resolve: { conditions: ['source'] },
  },
  test: {
    include: ['src/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
    maxWorkers: 1,
    isolate: false,
    testTimeout: 10000,
    hookTimeout: 30000,
    sequence: { groupOrder: 2 },
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
      thresholds: { lines: 100, functions: 100, statements: 100 },
    },
  },
});
