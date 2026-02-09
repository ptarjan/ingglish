import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@ingglish/core/internal': path.resolve(__dirname, '../core/src/internal.ts'),
      '@ingglish/core': path.resolve(__dirname, '../core/src/index.ts'),
      '@ingglish/dom': path.resolve(__dirname, '../dom/src/index.ts'),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
