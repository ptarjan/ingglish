import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  ignoreWorkspaces: ['packages/cors-proxy'],
  workspaces: {
    '.': {
      entry: ['scripts/*.{js,ts}'],
    },
    'packages/core': {
      entry: ['scripts/**/*.{js,ts}', 'src/**/*.bench.ts'],
    },
    'packages/dictionary': {
      entry: ['scripts/**/*.{js,ts}'],
    },
    'packages/dom': {
      entry: ['scripts/**/*.{js,ts}', 'src/**/*.bench.ts'],
    },
    'packages/extension': {
      entry: ['scripts/**/*.{js,ts}'],
    },
    'packages/normalize': {
      entry: ['src/**/*.bench.ts'],
    },
    'packages/fallback': {
      entry: ['src/**/*.bench.ts'],
    },
    'packages/g2p': {
      entry: ['src/**/*.bench.ts'],
    },
    'packages/phonemes': {
      entry: ['src/**/*.bench.ts'],
    },
    'packages/website': {
      entry: ['e2e/**/*.ts', 'scripts/**/*.{js,ts}'],
    },
  },
  ignore: [
    // Website bookmarklet (standalone script)
    'packages/website/src/bookmarklet.ts',
    // Detect module re-exports (barrel file)
    'packages/core/src/detect/index.ts',
    // Extension test files (vitest runs them but they're not entry points)
    'packages/extension/src/*.test.ts',
    // Service worker built via custom vite plugin (not a regular import)
    'packages/website/src/sw.ts',
  ],
  ignoreDependencies: [
    'eslint-plugin-prettier', // required by eslint-config-prettier
    'jsdom', // vitest test environment
    'esbuild', // vite internal dep
    '@ingglish/*', // workspace packages resolved via npm workspaces
    'ingglish', // root workspace package used in tests
    'playwright', // used in standalone diagnostic script (not @playwright/test)
    'tsx', // invoked via npx tsx in build scripts (.cjs wrappers)
  ],
  ignoreBinaries: ['playwright'],
  ignoreExportsUsedInFile: true,
  // Don't report unused exports — public API surface is intentionally broad
  exclude: ['exports', 'types'],
};

export default config;
