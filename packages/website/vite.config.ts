import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import markdown from './vite-plugin-md';
import type { Plugin } from 'vite';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { dirname, join } from 'path';
import { build as esbuild } from 'esbuild';
import { DOC_ENTRIES, TOP_LEVEL_ROUTES } from './src/routes';
import { generateOgImages, ROUTE_OG } from './scripts/generate-og-images';

const BUILD_ID = randomUUID();

// All routes that get their own index.html in dist/
const ALL_ROUTES = [...TOP_LEVEL_ROUTES, ...DOC_ENTRIES.map((e) => `docs/${e.id}`)];

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
  challenge: {
    title: 'Ingglish Reading Challenge',
    description:
      'Test how quickly you can read Ingglish! 10 rounds of progressively harder sentences with shareable results.',
  },
  docs: {
    title: 'Ingglish Documentation',
    description:
      'Technical documentation for the Ingglish phonetic English project. Design decisions, architecture, and API reference.',
  },
};

// Build a map from doc ID to title for per-doc metadata
const DOC_TITLE_MAP = new Map(DOC_ENTRIES.map((e) => [e.id, e.title]));

function customizeHtml(html: string, route: string): string {
  let title: string;
  let description: string;

  // Check for doc sub-pages (e.g. 'docs/design-decisions')
  const docId = route.startsWith('docs/') ? route.slice(5) : null;
  if (docId !== null) {
    const docTitle = DOC_TITLE_MAP.get(docId);
    title = docTitle !== undefined ? `${docTitle} | Ingglish Docs` : ROUTE_META.docs.title;
    description =
      docTitle !== undefined
        ? `Ingglish documentation — ${docTitle}. Technical reference for the phonemic English spelling system.`
        : ROUTE_META.docs.description;
  } else {
    const meta = ROUTE_META[route];
    if (meta === undefined) {
      return html;
    }
    title = meta.title;
    description = meta.description;
  }

  const url = `https://ingglish.com/${route}`;

  // Use the first path segment to look up the OG image (e.g. 'docs/foo' → 'docs')
  const ogKey = route.split('/')[0];
  const ogImageUrl =
    ogKey in ROUTE_OG
      ? `https://ingglish.com/og/${ogKey}.png`
      : 'https://ingglish.com/og-image.png';

  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(
      /<meta name="description" content="[^"]*"/,
      `<meta name="description" content="${description}"`
    )
    .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${url}"`)
    .replace(
      /<meta property="og:title" content="[^"]*"/,
      `<meta property="og:title" content="${title}"`
    )
    .replace(
      /<meta property="og:description" content="[^"]*"/,
      `<meta property="og:description" content="${description}"`
    )
    .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${url}"`)
    .replace(
      /<meta property="og:image" content="[^"]*"/,
      `<meta property="og:image" content="${ogImageUrl}"`
    )
    .replace(
      /<meta name="twitter:title" content="[^"]*"/,
      `<meta name="twitter:title" content="${title}"`
    )
    .replace(
      /<meta name="twitter:description" content="[^"]*"/,
      `<meta name="twitter:description" content="${description}"`
    )
    .replace(
      /<meta name="twitter:image" content="[^"]*"/,
      `<meta name="twitter:image" content="${ogImageUrl}"`
    );
}

// Copy index.html to each route path so GitHub Pages serves the SPA for all routes
function copyRoutesToDist(): Plugin {
  return {
    name: 'copy-routes-to-dist',
    writeBundle(options) {
      const distDir = options.dir ?? join(__dirname, 'dist');
      const srcPath = join(distDir, 'index.html');
      const baseHtml = readFileSync(srcPath, 'utf-8');
      for (const route of ALL_ROUTES) {
        const dest = join(distDir, route, 'index.html');
        mkdirSync(dirname(dest), { recursive: true });
        const html = customizeHtml(baseHtml, route);
        writeFileSync(dest, html);
      }
      // 404.html as catch-all fallback for GitHub Pages
      copyFileSync(srcPath, join(distDir, '404.html'));
    },
  };
}

// Generate sitemap.xml from the shared route list
function generateSitemap(): Plugin {
  return {
    name: 'generate-sitemap',
    writeBundle(options) {
      const distDir = options.dir ?? join(__dirname, 'dist');
      const allUrls = [
        '', // homepage
        ...ALL_ROUTES,
      ];
      const urls = allUrls
        .map((r) => {
          const loc = r === '' ? 'https://ingglish.com/' : `https://ingglish.com/${r}`;
          return `  <url>\n    <loc>${loc}</loc>\n  </url>`;
        })
        .join('\n');
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
      writeFileSync(join(distDir, 'sitemap.xml'), sitemap);
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

// Generate per-route OG images (SVG → PNG via resvg)
function ogImages(): Plugin {
  return {
    name: 'generate-og-images',
    writeBundle(options) {
      const distDir = options.dir ?? join(__dirname, 'dist');
      const svgPath = join(distDir, 'og-image.svg');
      generateOgImages(distDir, svgPath);
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
    ogImages(),
    copyRoutesToDist(),
    generateSitemap(),
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
