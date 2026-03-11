import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    conditions: ['source'],
  },
  ssr: {
    resolve: { conditions: ['source'] },
  },
  test: {
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.bench.ts'],
      thresholds: { lines: 100, functions: 100, statements: 100 },
    },
  },
});
