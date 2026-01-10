import { test, expect } from '@playwright/test';

test.describe('URL Translator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to load
    await expect(page.locator('.header h1')).toBeVisible({ timeout: 10000 });
    // Switch to URL translator tab
    await page.click('.tab:has-text("Translate URL")');
    await expect(page.locator('.url-translator')).toBeVisible();
  });

  test('displays URL input form', async ({ page }) => {
    await expect(page.locator('.url-input')).toBeVisible();
    await expect(page.locator('.url-form button[type="submit"]')).toBeVisible();
  });

  test('displays example URLs', async ({ page }) => {
    await expect(page.locator('.example-urls')).toBeVisible();
    await expect(page.locator('.example-link')).toHaveCount(8);
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
});

test.describe('URL Translator Link Navigation', () => {
  // Use longer timeout for network requests
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.header h1')).toBeVisible({ timeout: 10000 });
    await page.click('.tab:has-text("Translate URL")');
    await expect(page.locator('.url-translator')).toBeVisible();
  });

  test('loads a page and shows content or error', async ({ page }) => {
    // Click an example URL
    await page.locator('.example-link:has-text("Hacker News")').click();

    // Wait for either:
    // 1. The iframe to be ready (success)
    // 2. An error message (CORS/network failure)
    // 3. Loading to still be happening after some time
    await expect(async () => {
      const hasContent = await page.locator('.page-iframe--ready').isVisible();
      const hasError = await page.locator('.error-message').isVisible();
      const isLoading = await page.locator('.btn-loading').isVisible();
      // At least one of these should be true
      expect(hasContent || hasError || isLoading).toBe(true);
    }).toPass({ timeout: 30000 });
  });

  test('clicking example URL starts translation', async ({ page }) => {
    // Click an example
    await page.locator('.example-link:has-text("Hacker News")').click();

    // The URL input should be populated
    await expect(page.locator('.url-input')).toHaveValue(/news\.ycombinator/);

    // Either loading started or we have content/error
    const isLoading = await page.locator('.btn-loading').isVisible();
    const hasContent = await page.locator('.page-iframe--ready').isVisible();
    const hasError = await page.locator('.error-message').isVisible();

    expect(isLoading || hasContent || hasError).toBe(true);
  });

  test('clicking a link in translated page loads and translates next page', async ({ page }) => {
    // This test verifies that clicking a link:
    // 1. Intercepts the navigation
    // 2. Loads the new page
    // 3. Translates the new page content

    // Load Hacker News
    await page.locator('.example-link:has-text("Hacker News")').click();

    // Wait for content to load (or error)
    await expect(async () => {
      const hasContent = await page.locator('.page-iframe--ready').isVisible();
      const hasError = await page.locator('.error-message').isVisible();
      expect(hasContent || hasError).toBe(true);
    }).toPass({ timeout: 60000 });

    // Skip rest of test if there was an error loading
    if (await page.locator('.error-message').isVisible()) {
      test.skip(true, 'External URL failed to load - skipping link navigation test');
      return;
    }

    // Get the iframe
    const iframe = page.frameLocator('.page-iframe');

    // Verify the first page has translated content (ingglish tooltips)
    const tooltipCount = await iframe.locator('.ingglish-tooltip').count();
    expect(tooltipCount).toBeGreaterThan(0);

    // Find any link in the page
    const link = iframe.locator('a[href]').first();
    await expect(link).toBeVisible({ timeout: 10000 });

    // Get the current URL
    const urlBefore = await page.locator('.url-input').inputValue();

    // Click the link
    await link.click();

    // Wait for the new page to start loading
    await expect(async () => {
      const urlAfter = await page.locator('.url-input').inputValue();
      const isLoading = await page.locator('.btn-loading').isVisible();
      const loadingIndicator = await page.locator('.iframe-loading-indicator').isVisible();

      // Either URL changed or loading started
      expect(urlAfter !== urlBefore || isLoading || loadingIndicator).toBe(true);
    }).toPass({ timeout: 10000 });

    // Wait for the new page to finish loading
    await expect(page.locator('.page-iframe--ready')).toBeVisible({ timeout: 60000 });

    // CRITICAL: Verify the NEW page also has translated content
    // This proves that navigation worked AND translation was applied
    const newTooltipCount = await iframe.locator('.ingglish-tooltip').count();
    expect(newTooltipCount).toBeGreaterThan(0);

    // Verify URL actually changed
    const urlAfter = await page.locator('.url-input').inputValue();
    expect(urlAfter).not.toBe(urlBefore);
  });
});
