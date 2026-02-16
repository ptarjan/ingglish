import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@ingglish/phonemes': resolve(__dirname, '../phonemes/src/index.ts'),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
