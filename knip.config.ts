import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  ignoreWorkspaces: ['packages/cors-proxy'],
  workspaces: {
    '.': {
      entry: ['scripts/*.{js,ts}'],
    },
    'packages/core': {
      entry: ['src/index.ts', 'scripts/**/*.{js,ts}'],
    },
    'packages/dictionary': {
      entry: ['src/index.ts', 'scripts/**/*.{js,ts}'],
    },
    'packages/dom': {
      entry: ['src/index.ts', 'scripts/**/*.{js,ts}'],
    },
    'packages/*': {
      entry: ['src/index.ts'],
    },
    'packages/website': {
      entry: ['src/main.tsx', 'e2e/**/*.ts'],
    },
    'packages/extension': {
      entry: ['src/background.ts', 'src/content-script.ts', 'src/popup.ts'],
    },
  },
  ignore: [
    // Website bookmarklet (standalone script)
    'packages/website/src/bookmarklet.ts',
    // Detect module re-exports (barrel file)
    'packages/core/src/detect/index.ts',
    // Extension test files (vitest runs them but they're not entry points)
    'packages/extension/src/*.test.ts',
  ],
  ignoreDependencies: [
    'eslint-plugin-prettier', // required by eslint-config-prettier
    'jsdom', // vitest test environment
    'esbuild', // vite internal dep
    '@ingglish/*', // workspace packages resolved via npm workspaces
  ],
  ignoreBinaries: ['playwright', 'vite-node'],
  ignoreExportsUsedInFile: true,
  // Don't report unused exports — public API surface is intentionally broad
  exclude: ['exports', 'types'],
};

export default config;
