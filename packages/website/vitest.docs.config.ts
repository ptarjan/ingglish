import { defineConfig } from 'vitest/config';

// Minimal config for Docs.test.ts which needs generated docs
export default defineConfig({
  test: {
    include: ['src/components/Docs.test.ts'],
  },
});
