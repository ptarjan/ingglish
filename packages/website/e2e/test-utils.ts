import type { Page } from '@playwright/test';

// Mock HTML pages for testing - no external dependencies
export const MOCK_PAGE_A_HTML = `<!DOCTYPE html>
<html>
<head><title>Page A</title></head>
<body>
  <h1>This is Page A</h1>
  <p>Some text to translate on page A.</p>
  <a href="https://example.com/page-b">Go to Page B</a>
  <a href="https://example.com/another-page">Another link</a>
</body>
</html>`;

export const MOCK_PAGE_B_HTML = `<!DOCTYPE html>
<html>
<head><title>Page B</title></head>
<body>
  <h1>This is Page B</h1>
  <p>Different text to translate on page B.</p>
  <a href="https://example.com/page-a">Go back to Page A</a>
</body>
</html>`;

// Helper to set up mock proxy responses
export async function setupMockProxy(page: Page) {
  // Intercept all proxy requests and return mock HTML
  await page.route('**/api.allorigins.win/**', async (route) => {
    const url = route.request().url();
    if (url.includes('page-b') || url.includes('another-page')) {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: MOCK_PAGE_B_HTML,
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: MOCK_PAGE_A_HTML,
      });
    }
  });

  // Also intercept custom proxy if configured
  await page.route('**/ingglish-cors-proxy**', async (route) => {
    const url = route.request().url();
    if (url.includes('page-b') || url.includes('another-page')) {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: MOCK_PAGE_B_HTML,
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: MOCK_PAGE_A_HTML,
      });
    }
  });
}
