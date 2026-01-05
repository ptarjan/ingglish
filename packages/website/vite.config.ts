import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  test: {
    exclude: ['e2e/**', 'node_modules/**'],
  },
  // Use BASE_URL env var for GitHub Pages, otherwise default to '/'
  base: process.env.BASE_URL || '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Dictionary chunk is ~6.6MB, suppress warning for it
    chunkSizeWarningLimit: 7000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code for better caching
          vendor: ['react', 'react-dom'],
          // The CMU dictionary is large, keep it separate
          dictionary: ['cmu-pronouncing-dictionary'],
          // Word frequency data is ~3.5MB, keep it separate
          'word-frequencies': ['subtlex-word-frequencies'],
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
