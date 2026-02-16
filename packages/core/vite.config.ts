import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Shared resolve config used by both vitest.config.ts and vite-node scripts
export default defineConfig({
  resolve: {
    alias: {
      '@ingglish/normalize': resolve(__dirname, '../normalize/src/index.ts'),
      '@ingglish/phonemes': resolve(__dirname, '../phonemes/src/index.ts'),
      '@ingglish/tokenize': resolve(__dirname, '../tokenize/src/index.ts'),
      '@ingglish/dictionary': resolve(__dirname, '../dictionary/src/index.ts'),
      '@ingglish/fallback': resolve(__dirname, '../fallback/src/index.ts'),
    },
  },
});
