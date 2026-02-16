import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  cacheDir: './node_modules/.vite',
  esbuild: {
    target: 'esnext',
  },
  resolve: {
    alias: {
      '@ingglish/phonemes': resolve(__dirname, '../phonemes/src/index.ts'),
      '@ingglish/dictionary': resolve(__dirname, '../dictionary/src/index.ts'),
    },
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
