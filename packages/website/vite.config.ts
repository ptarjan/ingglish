import { defineConfig, build as viteBuild } from 'vite';
import react from '@vitejs/plugin-react-swc';
import markdown from './vite-plugin-md';
import type { Plugin } from 'vite';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { randomUUID } from 'crypto';
import { dirname, join } from 'path';
import { pathToFileURL } from 'url';
import { build as esbuild } from 'esbuild';
import { marked } from 'marked';
import { DOC_ENTRIES, GAME_ENTRIES, TOP_LEVEL_ROUTES } from './src/routes';
import { generateOgImages, ROUTE_OG } from './scripts/generate-og-images';

const BUILD_ID = randomUUID();

// All routes that get their own index.html in dist/
const ALL_ROUTES = [
  ...TOP_LEVEL_ROUTES,
  // Backward compat: /challenge redirects to /games/reading
  'challenge',
  ...GAME_ENTRIES.map((e) => `games/${e.id}`),
  ...DOC_ENTRIES.map((e) => `docs/${e.id}`),
];

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
  games: {
    title: 'Ingglish Games',
    description:
      'Practice reading and understanding Ingglish with interactive games. Reading challenge, homophones quiz, and learn-to-read lessons.',
  },
  challenge: {
    title: 'Ingglish Reading Challenge',
    description:
      'Test how quickly you can read Ingglish! 10 rounds of progressively harder sentences with shareable results.',
  },
  'games/reading': {
    title: 'Ingglish Reading Challenge',
    description:
      'Test how quickly you can read Ingglish! 10 rounds of progressively harder sentences with shareable results.',
  },
  'games/homophones': {
    title: 'Ingglish Homophones Quiz',
    description:
      'Can you tell which English word an Ingglish spelling represents? Test your knowledge of homophones and phonetic spelling.',
  },
  'games/learn': {
    title: 'Learn to Read Ingglish',
    description:
      '8 progressive lessons teaching you to read phonetic English. From unchanged words to full sentences.',
  },
  'games/daily': {
    title: 'Ingglish Daily Challenge',
    description:
      'A new Ingglish puzzle every day. 5 rounds with Wordle-style colored squares. Same challenge for everyone.',
  },
  'games/speedmatch': {
    title: 'Ingglish Speed Match',
    description:
      'Match Ingglish words to their English translations as fast as you can. Race the clock across 3 rounds.',
  },
  'games/reverse': {
    title: 'Ingglish Reverse Spelling',
    description:
      'See an English word and type how it looks in Ingglish. Tests your knowledge of phonetic spelling rules.',
  },
  docs: {
    title: 'Ingglish Documentation',
    description:
      'Technical documentation for the Ingglish phonetic English project. Design decisions, architecture, and API reference.',
  },
};

// Build a map from doc ID to title for per-doc metadata
const DOC_TITLE_MAP = new Map(DOC_ENTRIES.map((e) => [e.id, e.title]));

// Map doc IDs to their markdown file paths (relative to repo root)
const DOC_FILE_MAP: Record<string, string> = {
  'how-to-read-english': 'english-spelling-rules.md',
  'how-to-spell-english': 'english-spelling-choices.md',
  'api-reference': 'generated/README.md',
};
const DOCS_DIR = join(__dirname, '..', '..', 'docs');

/** Read and render a doc's markdown to HTML for SEO injection. */
function renderDocHtml(docId: string): string {
  const filename = DOC_FILE_MAP[docId] ?? `${docId}.md`;
  const mdPath = join(DOCS_DIR, filename);
  if (!existsSync(mdPath)) return '';
  const md = readFileSync(mdPath, 'utf-8');
  return marked.parse(md, { async: false }) as string;
}

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

  let result = html
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

  return result;
}

// Pre-render all routes using React SSG
function preRenderRoutes(): Plugin {
  return {
    name: 'pre-render-routes',
    async closeBundle() {
      const distDir = join(__dirname, 'dist');
      const ssgDir = join(distDir, '.ssg');

      // Build SSR bundle using Vite
      await viteBuild({
        configFile: false,
        root: __dirname,
        resolve: { conditions: ['source'] },
        ssr: { resolve: { conditions: ['source'] } },
        define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
        build: {
          ssr: join(__dirname, 'src/entry-ssg.tsx'),
          outDir: ssgDir,
          rollupOptions: {
            output: { format: 'esm' },
            // Suppress externalization warnings for node:fs/node:url
            onwarn(warning, warn) {
              if (warning.message?.includes('has been externalized for browser compatibility'))
                return;
              warn(warning);
            },
          },
        },
        logLevel: 'error',
        plugins: [react(), markdown()],
      });

      // Load the SSR module
      const ssgEntry = pathToFileURL(join(ssgDir, 'entry-ssg.js')).href;
      const { render } = (await import(ssgEntry)) as { render: (url: string) => Promise<string> };

      const baseHtml = readFileSync(join(distDir, 'index.html'), 'utf-8');

      // Render each route
      for (const route of ['', ...ALL_ROUTES]) {
        const url = route === '' ? '/' : `/${route}`;
        let appHtml: string;
        try {
          appHtml = await render(url);
        } catch (err) {
          console.warn(`SSG: failed to render ${url}, using empty shell:`, err);
          appHtml = '';
        }

        // Inject rendered HTML into the #root div, replacing the entire static shell.
        // Use string indexOf instead of regex to correctly handle nested </div> tags.
        let html = baseHtml;
        if (appHtml) {
          const rootOpen = '<div id="root">';
          const startIdx = html.indexOf(rootOpen);
          if (startIdx !== -1) {
            // Find the closing </div> that pairs with <div id="root">.
            // It's the last </div> before the first <script> after the root open.
            const afterRoot = html.indexOf('<script>', startIdx);
            const closingDiv = html.lastIndexOf('</div>', afterRoot);
            if (closingDiv !== -1) {
              html =
                html.slice(0, startIdx) +
                `<div id="root">${appHtml}</div>` +
                html.slice(closingDiv + '</div>'.length);
            }
          }
        }

        // Apply per-route metadata (title, description, OG tags)
        if (route !== '') {
          html = customizeHtml(html, route);
        }

        const dest =
          route === '' ? join(distDir, 'index.html') : join(distDir, route, 'index.html');
        mkdirSync(dirname(dest), { recursive: true });
        writeFileSync(dest, html);
      }

      // Clean up SSR bundle
      rmSync(ssgDir, { recursive: true, force: true });

      // 404.html as catch-all fallback for GitHub Pages
      copyFileSync(join(distDir, 'index.html'), join(distDir, '404.html'));
    },
  };
}

// Generate sitemap-pages.xml (app routes) from the shared route list. The word
// pages sitemap and the sitemap.xml *index* are written by wordPages() below.
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
      writeFileSync(join(distDir, 'sitemap-pages.xml'), sitemap);
    },
  };
}

// Generate per-word SEO landing pages (dist/word/<w>/index.html), the browsable
// hub (dist/words/), sitemap-words.xml, and the sitemap.xml index. Runs the
// standalone generator via tsx with source conditions so it can translate words
// using the workspace packages' TypeScript source. Skippable via WORD_PAGES=0.
function wordPages(): Plugin {
  return {
    name: 'generate-word-pages',
    apply: 'build',
    closeBundle() {
      // Vitest evaluates this config and fires closeBundle; only generate during
      // a real production build (never under test) and honor WORD_PAGES=0.
      if (process.env.VITEST || process.env.WORD_PAGES === '0') {
        return;
      }
      execSync('npx tsx --conditions=source scripts/build-word-pages.ts', {
        stdio: 'inherit',
        cwd: __dirname,
      });
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

// Build sw.js — esbuild compiles src/sw.ts to dist/sw.js as IIFE with BUILD_ID injected
function buildServiceWorker(): Plugin {
  return {
    name: 'build-service-worker',
    async writeBundle(options) {
      const distDir = options.dir ?? join(__dirname, 'dist');
      await esbuild({
        entryPoints: [join(__dirname, 'src/sw.ts')],
        bundle: true,
        format: 'iife',
        outfile: join(distDir, 'sw.js'),
        minify: true,
        define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
        logLevel: 'error',
      });
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
    preRenderRoutes(),
    generateSitemap(),
    wordPages(),
    writeBuildId(),
    buildBookmarklet(),
    buildServiceWorker(),
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
          if (
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-router')
          ) {
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
