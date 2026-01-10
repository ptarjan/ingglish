import { test, expect } from '@playwright/test';
import { setupMockProxy } from './test-utils';

test.describe('URL Translator with Mocked Responses', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockProxy(page);
    await page.goto('/');
    await expect(page.locator('.header h1')).toBeVisible({ timeout: 10000 });
    await page.click('.tab:has-text("Translate URL")');
    await expect(page.locator('.url-translator')).toBeVisible();
  });

  test('mobile tap navigates to new page and translates it', async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name.includes('mobile');
    const isWebkit = testInfo.project.name.includes('safari');
    test.skip(!isMobile, 'This test is only for mobile');
    // Skip webkit - Playwright has issues with touchscreen.tap() in iframes on webkit
    test.skip(isWebkit, 'Webkit touchscreen.tap() does not work reliably in iframes');

    // Load Page A
    const input = page.locator('.url-input');
    await input.fill('https://example.com/page-a');
    await page.click('button[type="submit"]');

    // Wait for page to load and translate
    await expect(page.locator('.page-iframe--ready')).toBeVisible({ timeout: 30000 });

    const iframe = page.frameLocator('.page-iframe');

    // Verify Page A content is translated
    await expect(iframe.locator('h1')).toHaveAttribute('data-ingglish-original', /Page A/);
    const wordCountA = await iframe.locator('.ingglish-word').count();
    expect(wordCountA).toBeGreaterThan(0);

    // Find the link to Page B
    const link = iframe.locator('a[href*="page-b"]');
    await expect(link).toBeVisible();

    // TAP the link - tests touch event handling
    const box = await link.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    }

    // Wait for URL to change to Page B
    await expect(input).toHaveValue(/page-b/, { timeout: 10000 });

    // Wait for new page to load
    await expect(page.locator('.page-iframe--ready')).toBeVisible({ timeout: 30000 });

    // Verify Page B content is translated
    await expect(iframe.locator('h1')).toHaveAttribute('data-ingglish-original', /Page B/);
    const wordCountB = await iframe.locator('.ingglish-word').count();
    expect(wordCountB).toBeGreaterThan(0);
  });

  test('desktop click navigates to new page and translates it', async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name.includes('mobile');
    test.skip(isMobile, 'This test is only for desktop');

    // Load Page A
    const input = page.locator('.url-input');
    await input.fill('https://example.com/page-a');
    await page.click('button[type="submit"]');

    // Wait for page to load and translate
    await expect(page.locator('.page-iframe--ready')).toBeVisible({ timeout: 30000 });

    const iframe = page.frameLocator('.page-iframe');

    // Verify Page A content is translated (check original text stored in data attribute)
    await expect(iframe.locator('h1')).toHaveAttribute('data-ingglish-original', /Page A/);
    const wordCountA = await iframe.locator('.ingglish-word').count();
    expect(wordCountA).toBeGreaterThan(0);

    // Find and click the link to Page B
    const link = iframe.locator('a[href*="page-b"]');
    await expect(link).toBeVisible();
    await link.click();

    // Wait for URL to change to Page B
    await expect(input).toHaveValue(/page-b/, { timeout: 10000 });

    // Wait for new page to load
    await expect(page.locator('.page-iframe--ready')).toBeVisible({ timeout: 30000 });

    // Verify Page B content is translated
    await expect(iframe.locator('h1')).toHaveAttribute('data-ingglish-original', /Page B/);
    const wordCountB = await iframe.locator('.ingglish-word').count();
    expect(wordCountB).toBeGreaterThan(0);
  });

  test('back button loads previous page with translation', async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name.includes('mobile');
    const isWebkit = testInfo.project.name.includes('safari');
    // Skip webkit - click events don't work reliably in iframes on webkit in Playwright
    test.skip(isWebkit, 'Webkit has issues with click events in iframes in Playwright');

    // Load Page A
    const input = page.locator('.url-input');
    await input.fill('https://example.com/page-a');
    await page.click('button[type="submit"]');

    // Wait for page to load
    await expect(page.locator('.page-iframe--ready')).toBeVisible({ timeout: 30000 });

    const iframe = page.frameLocator('.page-iframe');
    await expect(iframe.locator('h1')).toHaveAttribute('data-ingglish-original', /Page A/);

    // Navigate to Page B
    const link = iframe.locator('a[href*="page-b"]');
    await expect(link).toBeVisible();

    // Use tap for mobile, click for desktop
    if (isMobile) {
      const box = await link.boundingBox();
      expect(box).toBeTruthy();
      if (box) {
        await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      }
    } else {
      await link.click();
    }

    // Wait for Page B to load
    await expect(input).toHaveValue(/page-b/, { timeout: 10000 });
    await expect(page.locator('.page-iframe--ready')).toBeVisible({ timeout: 30000 });
    await expect(iframe.locator('h1')).toHaveAttribute('data-ingglish-original', /Page B/);

    // Click browser back button
    await page.evaluate(() => {
      history.back();
    });
    await page.waitForTimeout(100); // Wait for popstate to fire

    // Should go back to Page A URL
    await expect(input).toHaveValue(/page-a/, { timeout: 10000 });

    // Should reload and translate Page A
    await expect(page.locator('.page-iframe--ready')).toBeVisible({ timeout: 30000 });
    await expect(iframe.locator('h1')).toHaveAttribute('data-ingglish-original', /Page A/);

    // Should have translated content
    const wordCount = await iframe.locator('.ingglish-word').count();
    expect(wordCount).toBeGreaterThan(0);
  });
});
