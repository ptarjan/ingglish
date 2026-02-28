import { expect, type Page } from '@playwright/test';

/**
 * Block all external network requests by default.
 * Only allows requests to localhost (the test server).
 * Mocks common external resources (fonts, etc).
 * Any other unmocked external request will cause the test to fail.
 */
export async function blockExternalNetwork(page: Page) {
  await mockExternalResources(page);
}

/**
 * Wait for the app to fully load (header visible, spinner gone).
 * Dictionary load can take 10-15s on slow CI webkit, so we use generous timeouts.
 */
export async function waitForAppLoad(page: Page) {
  await expect(page.locator('.header h1')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.loading-spinner')).not.toBeVisible({ timeout: 20_000 });
}

/**
 * Mock common external resources (fonts, analytics) and block everything else.
 * Returns the route handler so callers can layer additional mocks on top.
 */
async function mockExternalResources(
  page: Page,
  handleProxy?: (url: string, route: import('@playwright/test').Route) => Promise<boolean>
) {
  await page.route('**/*', async (route) => {
    const url = route.request().url();

    const { hostname } = new URL(url);

    // Allow localhost requests (the test server)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      await route.continue();
      return;
    }

    // Mock Google Fonts - return empty CSS
    if (hostname === 'fonts.googleapis.com') {
      await route.fulfill({
        body: '/* Mocked font CSS */',
        contentType: 'text/css',
        status: 200,
      });
      return;
    }

    // Mock Google Fonts static files
    if (hostname === 'fonts.gstatic.com') {
      await route.fulfill({
        body: '',
        contentType: 'font/woff2',
        status: 200,
      });
      return;
    }

    // Mock Google Analytics / Tag Manager
    if (
      hostname === 'googletagmanager.com' ||
      hostname.endsWith('.googletagmanager.com') ||
      hostname === 'google-analytics.com' ||
      hostname.endsWith('.google-analytics.com')
    ) {
      await route.fulfill({
        body: '/* Mocked GA */',
        contentType: 'application/javascript',
        status: 200,
      });
      return;
    }

    // Delegate to proxy handler if provided
    if (handleProxy) {
      const handled = await handleProxy(url, route);
      if (handled) {
        return;
      }
    }

    // Block all other external requests with a clear error
    await route.abort('blockedbyclient');
    throw new Error(
      `Unmocked external network request: ${route.request().method()} ${url}\n` +
        'Add a mock for this URL in test-utils.ts or use setupMockProxy()'
    );
  });
}

// Mock HTML pages for testing - no external dependencies
export const MOCK_PAGE_A_HTML = `<!DOCTYPE html>
<html>
<head><title>Page A</title></head>
<body>
  <h1>This is Page A</h1>
  <p>Some text to translate on page A.</p>
  <nav>
    <a href="#section-one">Jump to Section One (relative)</a>
    <a href="https://example.com/page-a#section-two">Jump to Section Two (absolute)</a>
  </nav>
  <a href="https://example.com/page-b">Go to Page B</a>
  <a href="https://example.com/another-page">Another link</a>
  <section id="section-one" style="margin-top: 500px;">
    <h2>Section One</h2>
    <p>Content in section one.</p>
  </section>
  <section id="section-two" style="margin-top: 500px;">
    <h2>Section Two</h2>
    <p>Content in section two.</p>
  </section>
</body>
</html>`;

// Mock page with overflow:hidden containers (like HN's table layout)
export const MOCK_PAGE_OVERFLOW_HTML = `<!DOCTYPE html>
<html>
<head><title>Overflow Test</title></head>
<body>
  <table>
    <tr>
      <td style="overflow: hidden; height: 20px; line-height: 20px;">
        <a class="titlelink">Beautiful morning sunshine weather today</a>
      </td>
    </tr>
    <tr>
      <td style="overflow: hidden; height: 20px; line-height: 20px;">
        <a class="titlelink">Another wonderful headline about something</a>
      </td>
    </tr>
  </table>
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

/**
 * Set up mock proxy responses for URL translator tests.
 * Also blocks all other external network requests.
 */
export async function setupMockProxy(page: Page) {
  await mockExternalResources(page, async (url, route) => {
    const { hostname } = new URL(url);
    if (
      !hostname.endsWith('allorigins.win') &&
      !hostname.endsWith('ingglish-cors-proxy.workers.dev')
    ) {
      return false;
    }

    if (url.includes('overflow-test')) {
      await route.fulfill({
        body: MOCK_PAGE_OVERFLOW_HTML,
        contentType: 'text/html',
        status: 200,
      });
    } else if (url.includes('page-b') || url.includes('another-page')) {
      await route.fulfill({
        body: MOCK_PAGE_B_HTML,
        contentType: 'text/html',
        status: 200,
      });
    } else {
      await route.fulfill({
        body: MOCK_PAGE_A_HTML,
        contentType: 'text/html',
        status: 200,
      });
    }
    return true;
  });
}
