import { test, expect, type Locator } from '@playwright/test';
import { setupMockProxy } from './test-utils';

test.describe('URL Translator', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockProxy(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator('.header h1')).toBeVisible();
    await page.click('.tab:has-text("Translate URL")');
    await expect(page.locator('.url-translator')).toBeVisible();
  });

  test('displays URL input form', async ({ page }) => {
    await expect(page.locator('.url-input')).toBeVisible();
    await expect(page.locator('.url-form button[type="submit"]')).toBeVisible();
  });

  test('displays example URLs', async ({ page }) => {
    await expect(page.locator('.example-urls')).toBeVisible();
    await expect(page.locator('.example-link')).toHaveCount(9);
  });

  test('can enter a URL', async ({ page }) => {
    const input = page.locator('.url-input');
    await input.fill('https://example.com');
    await expect(input).toHaveValue('https://example.com');
  });

  test('clear button clears URL and content', async ({ page }) => {
    const input = page.locator('.url-input');
    await input.fill('https://example.com');
    await page.click('button:has-text("Clear")');
    await expect(input).toHaveValue('');
  });

  test('loads and translates a page', async ({ page }) => {
    const input = page.locator('.url-input');
    await input.fill('https://example.com/page-a');
    await page.click('button[type="submit"]');

    await expect(page.locator('.page-iframe--ready')).toBeVisible({ timeout: 30000 });

    const iframe = page.frameLocator('.page-iframe');
    await expect(iframe.locator('h1')).toHaveAttribute('data-ingglish-original', /Page A/);
    const wordCount = await iframe.locator('.ingglish-word').count();
    expect(wordCount).toBeGreaterThan(0);
  });

  test('clicking example URL fills input and translates', async ({ page }) => {
    const input = page.locator('.url-input');
    await expect(input).toHaveValue('');

    // Click first example link
    await page.click('.example-link >> nth=0');

    // Input should be filled with a URL
    await expect(input).not.toHaveValue('');

    // Should start loading
    await expect(page.locator('.page-iframe--ready')).toBeVisible({ timeout: 30000 });
  });

  test('shows loading state while translating', async ({ page }) => {
    const input = page.locator('.url-input');
    await input.fill('https://example.com/page-a');

    // Start translation
    await page.click('button[type="submit"]');

    // Should show loading button state
    await expect(page.locator('.btn-loading')).toBeVisible();

    // Wait for completion
    await expect(page.locator('.page-iframe--ready')).toBeVisible({ timeout: 30000 });

    // Loading should be gone
    await expect(page.locator('.btn-loading')).not.toBeVisible();
  });
});

test.describe('URL Translator Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockProxy(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator('.header h1')).toBeVisible();
    await page.click('.tab:has-text("Translate URL")');
    await expect(page.locator('.url-translator')).toBeVisible();
  });

  // Helper to click a link using direct event dispatch (works on all platforms)
  async function clickLink(link: Locator) {
    await link.evaluate((el) => {
      // Dispatch touchstart
      const touchStart = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: [new Touch({ identifier: 0, target: el, clientX: 0, clientY: 0 })],
      });
      el.dispatchEvent(touchStart);

      // Dispatch touchend
      const touchEnd = new TouchEvent('touchend', {
        bubbles: true,
        cancelable: true,
        changedTouches: [new Touch({ identifier: 0, target: el, clientX: 0, clientY: 0 })],
      });
      el.dispatchEvent(touchEnd);
    });
  }

  test('click handler script is injected', async ({ page }) => {
    const input = page.locator('.url-input');
    await input.fill('https://example.com/page-a');
    await page.click('button[type="submit"]');

    await expect(page.locator('.page-iframe--ready')).toBeVisible({ timeout: 30000 });

    const iframeElement = page.locator('.page-iframe');
    const hasScript = await iframeElement.evaluate((el: HTMLIFrameElement) => {
      const doc = el.contentDocument;
      if (!doc) return false;
      const scripts = doc.querySelectorAll('script');
      return Array.from(scripts).some((s) => s.textContent.includes('ingglish-link-click'));
    });
    expect(hasScript).toBe(true);
  });

  // Playwright's WebKit cannot create TouchEvent objects (Illegal constructor error)
  // Real iOS Safari works fine - this is a Playwright limitation
  test('link click navigates and translates', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name.includes('safari'),
      'Playwright WebKit cannot create TouchEvent'
    );
    const input = page.locator('.url-input');
    await input.fill('https://example.com/page-a');
    await page.click('button[type="submit"]');

    await expect(page.locator('.page-iframe--ready')).toBeVisible({ timeout: 30000 });

    const iframe = page.frameLocator('.page-iframe');
    await expect(iframe.locator('h1')).toHaveAttribute('data-ingglish-original', /Page A/);

    const link = iframe.locator('a[href*="page-b"]');
    await expect(link).toBeVisible();
    await clickLink(link);

    await expect(input).toHaveValue(/page-b/, { timeout: 10000 });
    await expect(page.locator('.page-iframe--ready')).toBeVisible({ timeout: 30000 });
    await expect(iframe.locator('h1')).toHaveAttribute('data-ingglish-original', /Page B/);

    const wordCount = await iframe.locator('.ingglish-word').count();
    expect(wordCount).toBeGreaterThan(0);
  });

  // Playwright's WebKit cannot create TouchEvent objects (Illegal constructor error)
  // Real iOS Safari works fine - this is a Playwright limitation
  test('back button returns to previous page', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name.includes('safari'),
      'Playwright WebKit cannot create TouchEvent'
    );
    const input = page.locator('.url-input');
    await input.fill('https://example.com/page-a');
    await page.click('button[type="submit"]');

    await expect(page.locator('.page-iframe--ready')).toBeVisible({ timeout: 30000 });

    const iframe = page.frameLocator('.page-iframe');
    await expect(iframe.locator('h1')).toHaveAttribute('data-ingglish-original', /Page A/);

    const link = iframe.locator('a[href*="page-b"]');
    await expect(link).toBeVisible();
    await clickLink(link);

    await expect(input).toHaveValue(/page-b/, { timeout: 10000 });
    await expect(page.locator('.page-iframe--ready')).toBeVisible({ timeout: 30000 });
    await expect(iframe.locator('h1')).toHaveAttribute('data-ingglish-original', /Page B/);

    await page.evaluate(() => {
      history.back();
    });
    await page.waitForTimeout(500);

    await expect(input).toHaveValue(/page-a/, { timeout: 10000 });
    await expect(page.locator('.page-iframe--ready')).toBeVisible({ timeout: 30000 });
    await expect(iframe.locator('h1')).toHaveAttribute('data-ingglish-original', /Page A/);

    const wordCount = await iframe.locator('.ingglish-word').count();
    expect(wordCount).toBeGreaterThan(0);
  });

  test('anchor link scrolls without refetching', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name.includes('safari'),
      'Playwright WebKit cannot create TouchEvent'
    );
    const input = page.locator('.url-input');
    await input.fill('https://example.com/page-a');
    await page.click('button[type="submit"]');

    await expect(page.locator('.page-iframe--ready')).toBeVisible({ timeout: 30000 });

    const iframe = page.frameLocator('.page-iframe');
    // Verify page is translated
    await expect(iframe.locator('h1')).toHaveAttribute('data-ingglish-original', /Page A/);
    const initialWordCount = await iframe.locator('.ingglish-word').count();
    expect(initialWordCount).toBeGreaterThan(0);

    // Track network requests to the proxy after initial load
    let proxyRequestCount = 0;
    page.on('request', (request) => {
      if (request.url().includes('allorigins.win')) {
        proxyRequestCount++;
      }
    });

    // Click anchor link (with absolute URL - this sends postMessage, unlike pure #hash links)
    const anchorLink = iframe.locator('a[href="https://example.com/page-a#section-two"]');
    await expect(anchorLink).toBeVisible();
    await anchorLink.click();

    // URL should update to include the hash
    await expect(input).toHaveValue(/page-a#section-two/, { timeout: 5000 });

    // Wait a bit to catch any delayed requests
    await page.waitForTimeout(500);

    // No new proxy requests should have been made (this is the key assertion)
    expect(proxyRequestCount).toBe(0);

    // Page should still be translated
    const afterWordCount = await iframe.locator('.ingglish-word').count();
    expect(afterWordCount).toBe(initialWordCount);

    // Section should still be translated
    await expect(iframe.locator('#section-two h2')).toHaveAttribute(
      'data-ingglish-original',
      /Section Two/
    );
  });

  // Note: Pure hash link scrolling within srcdoc iframes is handled by the click handler script
  // but cannot be reliably tested with Playwright due to how it handles clicks in srcdoc iframes.
  // The click handler is verified in the 'click handler script is injected' test above.
});
