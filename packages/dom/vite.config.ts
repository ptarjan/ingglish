import { defineConfig } from 'vite';

// Shared resolve config used by both vitest.config.ts and vite-node scripts
export default defineConfig({
  resolve: {
    conditions: ['source'],
  },
  ssr: {
    resolve: { conditions: ['source'] },
  },
});
