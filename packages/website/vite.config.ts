import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import markdown from './vite-plugin-md';
import type { Plugin } from 'vite';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { dirname, join } from 'path';
import { build as esbuild } from 'esbuild';

const BUILD_ID = randomUUID();

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

// Per-route OG metadata overrides
interface RouteMeta {
  title: string;
  description: string;
}

const ROUTE_META: Record<string, RouteMeta> = {
  text: {
    title: 'Ingglish Text Translator',
    description:
      'Translate any English text to phonetic spelling instantly. See how words look when every spelling always makes the same sound.',
  },
  url: {
    title: 'Ingglish URL Translator',
    description:
      'Paste any URL and read the page in phonetic English. Every spelling always makes the same sound.',
  },
  guide: {
    title: 'Ingglish Spelling Guide',
    description:
      'Complete guide to the Ingglish phonetic alphabet. See how every English sound maps to a consistent spelling.',
  },
  poems: {
    title: 'Ingglish Poems',
    description:
      'Classic poems translated into phonetic English. See how poetry sounds when every spelling always makes the same sound.',
  },
  experiment: {
    title: 'Ingglish Experiment - Design Your Own Spelling',
    description:
      'Create your own phonetic spelling system. Customize how each sound is written, test with sample text, and compare statistics against standard Ingglish.',
  },
  explore: {
    title: 'Ingglish Word Explorer',
    description:
      'Look up any English word to see its phoneme-by-phoneme translation pipeline, IPA transcription, homophones, and frequency data.',
  },
  extension: {
    title: 'Ingglish Bookmarklet & Extension',
    description:
      'Translate any webpage to phonetic English with one click. Drag the bookmarklet to your bookmarks bar or install the Chrome extension.',
  },
  docs: {
    title: 'Ingglish Documentation',
    description:
      'Technical documentation for the Ingglish phonetic English project. Design decisions, architecture, and API reference.',
  },
};

function customizeHtml(html: string, route: string): string {
  const meta = ROUTE_META[route];
  if (meta === undefined) {
    return html;
  }
  const url = `https://ingglish.com/${route}`;
  return html
    .replace(
      /<meta property="og:title" content="[^"]*"/,
      `<meta property="og:title" content="${meta.title}"`
    )
    .replace(
      /<meta property="og:description" content="[^"]*"/,
      `<meta property="og:description" content="${meta.description}"`
    )
    .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${url}"`)
    .replace(
      /<meta name="twitter:title" content="[^"]*"/,
      `<meta name="twitter:title" content="${meta.title}"`
    )
    .replace(
      /<meta name="twitter:description" content="[^"]*"/,
      `<meta name="twitter:description" content="${meta.description}"`
    )
    .replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`);
}

// Copy index.html to each route path so GitHub Pages serves the SPA for all routes
function copyRoutesToDist(): Plugin {
  const docIds = [
    'design-decisions',
    'phoneme-mapping',
    'orthography-comparison',
    'spelling-reform-comparison',
    'spelling-iteration',
    'identical-words-analysis',
    'false-friends',
    'orthographic-transparency',
    'morphological-analysis',
    'dialect-assumptions',
    'how-to-read-english',
    'how-to-spell-english',
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
    'explore',
    'experiment',
    'docs',
    ...docIds.map((id) => `docs/${id}`),
  ];

  return {
    name: 'copy-routes-to-dist',
    writeBundle(options) {
      const distDir = options.dir ?? join(__dirname, 'dist');
      const srcPath = join(distDir, 'index.html');
      const baseHtml = readFileSync(srcPath, 'utf-8');
      for (const route of routes) {
        const dest = join(distDir, route, 'index.html');
        mkdirSync(dirname(dest), { recursive: true });
        // Use first path segment for metadata lookup (e.g. 'docs/foo' → 'docs')
        const metaKey = route.split('/')[0];
        const html = customizeHtml(baseHtml, metaKey);
        writeFileSync(dest, html);
      }
      // 404.html as catch-all fallback for GitHub Pages
      copyFileSync(srcPath, join(distDir, '404.html'));
    },
  };
}

// Write build-id.txt to dist so the app can poll for new deploys
function writeBuildId(): Plugin {
  return {
    name: 'write-build-id',
    writeBundle(options) {
      const distDir = options.dir ?? join(__dirname, 'dist');
      writeFileSync(join(distDir, 'build-id.txt'), BUILD_ID + '\n');
    },
  };
}

// Build bookmarklet.js as a self-contained IIFE (includes dictionary, ~3MB gzipped)
function buildBookmarklet(): Plugin {
  return {
    name: 'build-bookmarklet',
    async writeBundle(options) {
      const distDir = options.dir ?? join(__dirname, 'dist');
      await esbuild({
        entryPoints: [join(__dirname, 'src/bookmarklet.ts')],
        bundle: true,
        format: 'iife',
        outfile: join(distDir, 'bookmarklet.js'),
        minify: true,
        conditions: ['source'],
        logLevel: 'error',
      });
    },
  };
}

export default defineConfig({
  resolve: {
    conditions: ['source'],
  },
  ssr: {
    resolve: { conditions: ['source'] },
  },
  test: {
    exclude: ['e2e/**', 'node_modules/**'],
  },
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  // Use BASE_URL env var for GitHub Pages, otherwise default to '/'
  base: process.env.BASE_URL ?? '/',
  // SWC is ~20x faster than Babel for React compilation
  // markdown() converts .md imports to HTML at build time (saves ~150KB vs react-markdown)
  plugins: [
    markdown(),
    react(),
    processChunks(),
    copyRoutesToDist(),
    writeBuildId(),
    buildBookmarklet(),
  ],
  build: {
    outDir: 'dist',
    // Enable sourcemaps in CI for debugging, skip locally for speed
    sourcemap: !!process.env.CI,
    // Skip gzip size reporting in CI (saves ~2s)
    reportCompressedSize: !process.env.CI,
    // Dictionary chunk is ~6.6MB, suppress warning for it
    chunkSizeWarningLimit: 7000,
    rollupOptions: {
      // node:fs and node:url are dynamically imported in @ingglish/dictionary's
      // load-json.ts with a runtime guard; suppress Vite's externalization warning
      onwarn(warning, warn) {
        if (warning.message?.includes('has been externalized for browser compatibility')) return;
        warn(warning);
      },
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
