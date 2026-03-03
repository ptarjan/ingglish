import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // More workers since tests are I/O-bound (waiting for pages, not CPU)
  workers: process.env.CI ? 4 : undefined,
  reporter: 'list',
  // Timeouts: dictionary load + React hydration can take 10-15s on slow CI webkit
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: 'http://localhost:3000',
    // Capture on failure for debugging
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Allow time for React to render + dictionary load
    actionTimeout: 10000,
    navigationTimeout: 15000,
    // Disable service worker so it doesn't interfere with route mocking
    serviceWorkers: 'block',
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
