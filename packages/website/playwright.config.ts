import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // More workers since tests are I/O-bound (waiting for pages, not CPU)
  workers: process.env.CI ? 4 : undefined,
  reporter: 'list',
  // Fast timeouts - local server should respond quickly
  timeout: 5000,
  expect: {
    timeout: 1000,
  },
  use: {
    baseURL: 'http://localhost:3000',
    // Only trace on retry to save time
    trace: 'on-first-retry',
    // Fast timeouts
    actionTimeout: 1000,
    navigationTimeout: 1000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    // Faster server startup detection
    timeout: 60000,
  },
});
