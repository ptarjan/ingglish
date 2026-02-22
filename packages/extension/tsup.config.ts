import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/content-script.ts', 'src/background.ts', 'src/popup.ts'],
  format: ['iife'],
  outDir: 'dist',
  clean: true,
  esbuildOptions(options) {
    // Resolve workspace packages to source .ts files (same as vite/vitest)
    options.conditions = ['source'];
  },
});
