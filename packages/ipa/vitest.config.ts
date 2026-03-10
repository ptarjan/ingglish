import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    conditions: ['source'],
  },
  ssr: {
    resolve: { conditions: ['source'] },
  },
  test: {
    include: ['src/**/*.test.ts'],
    // Exclude slow integration tests that read website IPA dict files (~6s).
    // Run separately via: npx turbo test:dict-coverage
    exclude: ['src/dict-coverage.test.ts'],
    setupFiles: ['vitest.setup.ts'],
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.bench.ts'],
      thresholds: { lines: 100, functions: 100, statements: 100 },
    },
  },
});
