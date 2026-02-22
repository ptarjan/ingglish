import { defineConfig } from 'vitest/config';

export default defineConfig({
  benchmark: {
    include: ['src/**/*.bench.ts'],
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
