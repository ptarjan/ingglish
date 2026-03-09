import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    conditions: ['source'],
  },
  ssr: {
    resolve: { conditions: ['source'] },
  },
  benchmark: {
    include: ['src/**/*.bench.ts'],
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
