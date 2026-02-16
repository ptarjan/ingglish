import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import markdown from './vite-plugin-md';
import type { Plugin } from 'vite';
import { copyFileSync, mkdirSync } from 'fs';
import { dirname, join, resolve } from 'path';

// Skip sourcemaps for data and vendor chunks
function processChunks(): Plugin {
  const skipSourcemaps = ['cmudict', 'reverse-cmudict', 'word-frequencies', 'vendor'];
  return {
    name: 'process-chunks',
    generateBundle(_, bundle) {
      for (const name of Object.keys(bundle)) {
        // Delete sourcemap files
        if (name.endsWith('.map') && skipSourcemaps.some((c) => name.includes(c))) {
          delete bundle[name];
          continue;
        }
        const asset = bundle[name];
        if (asset?.type !== 'chunk' || typeof asset.code !== 'string') continue;

        // Strip sourceMappingURL from skipped chunks
        if (skipSourcemaps.some((c) => name.includes(c))) {
          asset.code = asset.code.replace(/\n\/\/# sourceMappingURL=.*$/, '');
          asset.map = null;
        }
      }
    },
  };
}

// Copy index.html to each route path so GitHub Pages serves the SPA for all routes
function copyRoutesToDist(): Plugin {
  const docIds = [
    'design-decisions',
    'phoneme-mapping',
    'orthography-comparison',
    'spelling-reform-comparison',
    'spelling-evolution',
    'identical-words-analysis',
    'collision-analysis',
    'architecture',
    'api-reference',
    'performance',
    'deployment',
    'contributing',
    'troubleshooting',
  ];
  const routes = [
    'text',
    'url',
    'guide',
    'extension',
    'poems',
    'docs',
    ...docIds.map((id) => `docs/${id}`),
  ];

  return {
    name: 'copy-routes-to-dist',
    writeBundle(options) {
      const distDir = options.dir ?? join(__dirname, 'dist');
      const src = join(distDir, 'index.html');
      for (const route of routes) {
        const dest = join(distDir, route, 'index.html');
        mkdirSync(dirname(dest), { recursive: true });
        copyFileSync(src, dest);
      }
      // 404.html as catch-all fallback for GitHub Pages
      copyFileSync(src, join(distDir, '404.html'));
    },
  };
}

export default defineConfig({
  resolve: {
    // Resolve workspace packages to source (avoids needing full DTS builds in CI)
    alias: {
      '@ingglish/core': resolve(__dirname, '../core/src/index.ts'),
      '@ingglish/dom': resolve(__dirname, '../dom/src/index.ts'),
      '@ingglish/phonemes': resolve(__dirname, '../phonemes/src/index.ts'),
      '@ingglish/tokenize': resolve(__dirname, '../tokenize/src/index.ts'),
      '@ingglish/normalize': resolve(__dirname, '../normalize/src/index.ts'),
      '@ingglish/dictionary': resolve(__dirname, '../dictionary/src/index.ts'),
      '@ingglish/fallback': resolve(__dirname, '../fallback/src/index.ts'),
      '@ingglish/g2p': resolve(__dirname, '../g2p/src/index.ts'),
    },
  },
  test: {
    // Docs.test.ts needs generated docs, runs separately after build
    exclude: ['e2e/**', 'node_modules/**', '**/Docs.test.ts'],
  },
  // Use BASE_URL env var for GitHub Pages, otherwise default to '/'
  base: process.env.BASE_URL ?? '/',
  // SWC is ~20x faster than Babel for React compilation
  // markdown() converts .md imports to HTML at build time (saves ~150KB vs react-markdown)
  plugins: [markdown(), react(), processChunks(), copyRoutesToDist()],
  build: {
    outDir: 'dist',
    // Enable sourcemaps in CI for debugging, skip locally for speed
    sourcemap: !!process.env.CI,
    // Skip gzip size reporting in CI (saves ~2s)
    reportCompressedSize: !process.env.CI,
    // Dictionary chunk is ~6.6MB, suppress warning for it
    chunkSizeWarningLimit: 7000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Dictionary files - large, rarely change
          // Note: reverse-cmudict must be checked BEFORE cmudict (substring match)
          if (id.includes('reverse-cmudict')) {
            return 'reverse-cmudict';
          }
          if (id.includes('cmudict')) {
            return 'cmudict';
          }
          // Word frequency data - separate chunk (loaded via dynamic import)
          if (id.includes('word-frequencies')) {
            return 'word-frequencies';
          }
          // @ingglish libraries
          if (
            id.includes('packages/core') ||
            id.includes('packages/dom') ||
            id.includes('packages/normalize') ||
            id.includes('packages/phonemes') ||
            id.includes('packages/tokenize') ||
            id.includes('packages/fallback')
          ) {
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
