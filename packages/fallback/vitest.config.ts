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
  benchmark: {
    include: ['src/**/*.bench.ts'],
    setupFiles: ['./vitest.setup.ts'],
  },
  test: {
    include: ['src/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
    maxWorkers: 1,
    isolate: false,
    testTimeout: 10000,
    hookTimeout: 30000,
  },
});
