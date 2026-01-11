import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  test: {
    exclude: ['e2e/**', 'node_modules/**'],
  },
  // Use BASE_URL env var for GitHub Pages, otherwise default to '/'
  base: process.env.BASE_URL ?? '/',
  // SWC is ~20x faster than Babel for React compilation
  plugins: [react()],
  build: {
    outDir: 'dist',
    // Enable sourcemaps in CI for debugging, skip locally for speed
    sourcemap: !!process.env.CI,
    // Dictionary chunk is ~6.6MB, suppress warning for it
    chunkSizeWarningLimit: 7000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split vendor code for better caching
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor';
          }
          // Word frequency data is ~3.5MB, keep it separate
          if (id.includes('subtlex-word-frequencies')) {
            return 'word-frequencies';
          }
          // The CMU dictionary is large (~4MB), keep it separate for caching
          if (id.includes('@ingglish/core') && id.includes('index')) {
            return 'dictionary';
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
