import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@ingglish/normalize': path.resolve(__dirname, '../normalize/src/index.ts'),
      '@ingglish/phonemes': path.resolve(__dirname, '../phonemes/src/index.ts'),
      '@ingglish/tokenize': path.resolve(__dirname, '../tokenize/src/index.ts'),
      '@ingglish/dictionary': path.resolve(__dirname, '../dictionary/src/index.ts'),
      '@ingglish/fallback': path.resolve(__dirname, '../fallback/src/index.ts'),
      '@ingglish/g2p': path.resolve(__dirname, '../g2p/src/index.ts'),
      ingglish: path.resolve(__dirname, '../core/src/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
    testTimeout: 10000,
  },
});
