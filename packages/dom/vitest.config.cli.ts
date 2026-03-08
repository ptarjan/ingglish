import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    conditions: ['source'],
  },
  ssr: {
    resolve: { conditions: ['source'] },
  },
  test: {
    include: ['scripts/**/*.test.ts'],
    testTimeout: 30000,
  },
});
