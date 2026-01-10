import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Use 2 workers in CI for faster tests
  workers: process.env.CI ? 2 : undefined,
  reporter: 'list',
  // Faster timeouts
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  use: {
    baseURL: 'http://localhost:3000',
    // Only trace on retry to save time
    trace: 'on-first-retry',
    // Faster navigation
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Mobile tests only run locally (CI only has chromium installed)
    ...(!process.env.CI
      ? [
          {
            name: 'mobile-safari',
            use: { ...devices['iPhone 14'] },
          },
          {
            name: 'mobile-chrome',
            use: { ...devices['Pixel 7'] },
          },
        ]
      : []),
  ],
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    // Faster server startup detection
    timeout: 60000,
  },
});
