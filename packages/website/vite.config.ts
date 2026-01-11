import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import markdown from './vite-plugin-md';

export default defineConfig({
  test: {
    exclude: ['e2e/**', 'node_modules/**'],
  },
  // Use BASE_URL env var for GitHub Pages, otherwise default to '/'
  base: process.env.BASE_URL ?? '/',
  // SWC is ~20x faster than Babel for React compilation
  // markdown() converts .md imports to HTML at build time (saves ~150KB vs react-markdown)
  plugins: [markdown(), react()],
  build: {
    outDir: 'dist',
    // Enable sourcemaps in CI for debugging, skip locally for speed
    sourcemap: !!process.env.CI,
    // Dictionary chunk is ~6.6MB, suppress warning for it
    chunkSizeWarningLimit: 7000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Dictionary files first (before packages/core check) - large, rarely change
          if (id.includes('cmudict') || id.includes('ipa-dict-supplement')) {
            return 'cmudict';
          }
          // Word frequency data is ~3.5MB, keep it separate
          if (id.includes('subtlex-word-frequencies')) {
            return 'word-frequencies';
          }
          // @ingglish libraries - separate for caching (library changes less than UI)
          if (id.includes('packages/core') || id.includes('packages/dom')) {
            return 'ingglish';
          }
          // Split vendor code for better caching
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor';
          }
        },
      },
    },
  },
  server: {
    port: 3000,
  },
  preview: {
    port: 3000,
  },
});
