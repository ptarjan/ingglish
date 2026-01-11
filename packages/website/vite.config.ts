import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import markdown from './vite-plugin-md';
import type { Plugin } from 'vite';

// Skip sourcemaps for data and vendor chunks (only keep for app code)
function skipDataSourcemaps(): Plugin {
  const skipChunks = ['cmudict', 'word-frequencies', 'vendor'];
  return {
    name: 'skip-data-sourcemaps',
    generateBundle(_, bundle) {
      for (const name of Object.keys(bundle)) {
        // Delete sourcemap files for data chunks
        if (name.endsWith('.map') && skipChunks.some((c) => name.includes(c))) {
          delete bundle[name];
          continue;
        }
        // Strip sourceMappingURL from data chunk JS files
        const asset = bundle[name];
        if (
          asset?.type === 'chunk' &&
          skipChunks.some((c) => name.includes(c)) &&
          typeof asset.code === 'string'
        ) {
          asset.code = asset.code.replace(/\n\/\/# sourceMappingURL=.*$/, '');
          asset.map = null;
        }
      }
    },
  };
}

export default defineConfig({
  test: {
    exclude: ['e2e/**', 'node_modules/**'],
  },
  // Use BASE_URL env var for GitHub Pages, otherwise default to '/'
  base: process.env.BASE_URL ?? '/',
  // SWC is ~20x faster than Babel for React compilation
  // markdown() converts .md imports to HTML at build time (saves ~150KB vs react-markdown)
  plugins: [markdown(), react(), skipDataSourcemaps()],
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
