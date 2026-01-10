import { test, expect } from '@playwright/test';
import { setupMockProxy } from './test-utils';

test.describe('URL Translator', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockProxy(page);
    await page.goto('/');
    await expect(page.locator('.header h1')).toBeVisible({ timeout: 10000 });
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

    await expect(page.locator('.page-iframe--ready')).toBeVisible({ timeout: 30000 });

    const iframe = page.frameLocator('.page-iframe');
    await expect(iframe.locator('h1')).toHaveAttribute('data-ingglish-original', /Page A/);
    const wordCount = await iframe.locator('.ingglish-word').count();
    expect(wordCount).toBeGreaterThan(0);
  });
});

test.describe('URL Translator Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockProxy(page);
    await page.goto('/');
    await expect(page.locator('.header h1')).toBeVisible({ timeout: 10000 });
    await page.click('.tab:has-text("Translate URL")');
    await expect(page.locator('.url-translator')).toBeVisible();
  });

  test('desktop click navigates and translates', async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name.includes('mobile');
    test.skip(isMobile, 'Desktop-only test');

    const input = page.locator('.url-input');
    await input.fill('https://example.com/page-a');
    await page.click('button[type="submit"]');

    await expect(page.locator('.page-iframe--ready')).toBeVisible({ timeout: 30000 });

    const iframe = page.frameLocator('.page-iframe');
    await expect(iframe.locator('h1')).toHaveAttribute('data-ingglish-original', /Page A/);

    const link = iframe.locator('a[href*="page-b"]');
    await expect(link).toBeVisible();
    await link.click();

    await expect(input).toHaveValue(/page-b/, { timeout: 10000 });
    await expect(page.locator('.page-iframe--ready')).toBeVisible({ timeout: 30000 });
    await expect(iframe.locator('h1')).toHaveAttribute('data-ingglish-original', /Page B/);
  });

  // Note: Playwright's webkit engine cannot properly dispatch click/tap events
  // to elements inside iframes. This is a known Playwright limitation, not a code issue.
  // The code works on real Safari - test manually on actual iOS devices.
  test('mobile tap navigates and translates', async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name.includes('mobile');
    const isWebkit = testInfo.project.name.includes('safari');
    test.skip(!isMobile, 'Mobile-only test');
    test.skip(isWebkit, 'Playwright webkit cannot dispatch events in iframes');

    const input = page.locator('.url-input');
    await input.fill('https://example.com/page-a');
    await page.click('button[type="submit"]');

    await expect(page.locator('.page-iframe--ready')).toBeVisible({ timeout: 30000 });

    const iframe = page.frameLocator('.page-iframe');
    await expect(iframe.locator('h1')).toHaveAttribute('data-ingglish-original', /Page A/);

    const link = iframe.locator('a[href*="page-b"]');
    await expect(link).toBeVisible();

    const box = await link.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    }

    await expect(input).toHaveValue(/page-b/, { timeout: 10000 });
    await expect(page.locator('.page-iframe--ready')).toBeVisible({ timeout: 30000 });
    await expect(iframe.locator('h1')).toHaveAttribute('data-ingglish-original', /Page B/);

    const wordCount = await iframe.locator('.ingglish-word').count();
    expect(wordCount).toBeGreaterThan(0);
  });

  test('back button returns to previous page', async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name.includes('mobile');
    const isWebkit = testInfo.project.name.includes('safari');
    test.skip(isWebkit, 'Playwright webkit cannot dispatch events in iframes');

    const input = page.locator('.url-input');
    await input.fill('https://example.com/page-a');
    await page.click('button[type="submit"]');

    await expect(page.locator('.page-iframe--ready')).toBeVisible({ timeout: 30000 });

    const iframe = page.frameLocator('.page-iframe');
    await expect(iframe.locator('h1')).toHaveAttribute('data-ingglish-original', /Page A/);

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
});
