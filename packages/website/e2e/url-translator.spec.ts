import { test, expect } from '@playwright/test';
import { setupMockProxy } from './test-utils';

test.describe('URL Translator', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockProxy(page);
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

  test('loads and translates a page', async ({ page }) => {
    const input = page.locator('.url-input');
    await input.fill('https://example.com/page-a');
    await page.click('button[type="submit"]');

    // Wait for page to load
    await expect(page.locator('.page-iframe--ready')).toBeVisible({ timeout: 30000 });

    // Verify content is translated
    const iframe = page.frameLocator('.page-iframe');
    await expect(iframe.locator('h1')).toHaveAttribute('data-ingglish-original', /Page A/);
    const wordCount = await iframe.locator('.ingglish-word').count();
    expect(wordCount).toBeGreaterThan(0);
  });
});

test.describe('URL Translator Link Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockProxy(page);
    await page.goto('/');
    await expect(page.locator('.header h1')).toBeVisible({ timeout: 10000 });
    await page.click('.tab:has-text("Translate URL")');
    await expect(page.locator('.url-translator')).toBeVisible();
  });

  test('clicking a link navigates and translates', async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name.includes('mobile');
    const isWebkit = testInfo.project.name.includes('safari');
    // Skip webkit - click/tap events don't work reliably in iframes in Playwright webkit
    test.skip(isWebkit, 'Webkit has issues with events in iframes in Playwright');

    // Load initial page
    const input = page.locator('.url-input');
    await input.fill('https://example.com/page-a');
    await page.click('button[type="submit"]');

    // Wait for page to load
    await expect(page.locator('.page-iframe--ready')).toBeVisible({ timeout: 30000 });

    const iframe = page.frameLocator('.page-iframe');

    // Verify initial page is translated
    await expect(iframe.locator('h1')).toHaveAttribute('data-ingglish-original', /Page A/);
    const wordCountBefore = await iframe.locator('.ingglish-word').count();
    expect(wordCountBefore).toBeGreaterThan(0);

    // Find a link
    const link = iframe.locator('a[href*="page-b"]');
    await expect(link).toBeVisible();

    // Click/tap the link
    if (isMobile) {
      const box = await link.boundingBox();
      expect(box).toBeTruthy();
      if (box) {
        await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      }
    } else {
      await link.click();
    }

    // Wait for URL to change
    await expect(input).toHaveValue(/page-b/, { timeout: 10000 });

    // Wait for new page to load
    await expect(page.locator('.page-iframe--ready')).toBeVisible({ timeout: 30000 });

    // Verify new page is translated
    await expect(iframe.locator('h1')).toHaveAttribute('data-ingglish-original', /Page B/);
    const wordCountAfter = await iframe.locator('.ingglish-word').count();
    expect(wordCountAfter).toBeGreaterThan(0);
  });

  test('back button returns to previous page', async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name.includes('mobile');
    const isWebkit = testInfo.project.name.includes('safari');
    // Skip webkit - click/tap events don't work reliably in iframes in Playwright webkit
    test.skip(isWebkit, 'Webkit has issues with events in iframes in Playwright');

    // Load initial page
    const input = page.locator('.url-input');
    await input.fill('https://example.com/page-a');
    await page.click('button[type="submit"]');

    // Wait for page to load
    await expect(page.locator('.page-iframe--ready')).toBeVisible({ timeout: 30000 });

    const iframe = page.frameLocator('.page-iframe');
    await expect(iframe.locator('h1')).toHaveAttribute('data-ingglish-original', /Page A/);

    // Click a link to navigate
    const link = iframe.locator('a[href*="page-b"]');
    await expect(link).toBeVisible();

    if (isMobile) {
      const box = await link.boundingBox();
      expect(box).toBeTruthy();
      if (box) {
        await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      }
    } else {
      await link.click();
    }

    // Wait for new page
    await expect(input).toHaveValue(/page-b/, { timeout: 10000 });
    await expect(page.locator('.page-iframe--ready')).toBeVisible({ timeout: 30000 });
    await expect(iframe.locator('h1')).toHaveAttribute('data-ingglish-original', /Page B/);

    // Go back
    await page.evaluate(() => {
      history.back();
    });
    await page.waitForTimeout(100);

    // Should return to original page
    await expect(input).toHaveValue(/page-a/, { timeout: 10000 });
    await expect(page.locator('.page-iframe--ready')).toBeVisible({ timeout: 30000 });
    await expect(iframe.locator('h1')).toHaveAttribute('data-ingglish-original', /Page A/);

    // Should still have translated content
    const wordCount = await iframe.locator('.ingglish-word').count();
    expect(wordCount).toBeGreaterThan(0);
  });
});
