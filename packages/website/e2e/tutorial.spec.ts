import { type BrowserContext, expect, type Page, test } from '@playwright/test';

import { blockExternalNetwork, waitForAppLoad } from './test-utils';

test.describe('Tutorial Auto-Typing Demo', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }, workerInfo) => {
    context = await browser.newContext(workerInfo.project.use);
    page = await context.newPage();
    await blockExternalNetwork(page);
    await page.goto('/');
    await waitForAppLoad(page);
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('auto-types demo sentence when scrolled into view', async () => {
    const tryItSection = page.locator('.tutorial-try-it');
    const input = tryItSection.locator('.try-it-input');

    // Input should be empty before section is visible
    await expect(input).toHaveValue('');

    // Scroll the section into view
    await tryItSection.scrollIntoViewIfNeeded();

    // Wait for auto-typing to complete (36 chars × 60ms ≈ 2.2s + buffer)
    await expect(input).toHaveValue('The knight thought through the night', { timeout: 5000 });

    // Translation output should be visible
    await expect(tryItSection.locator('.try-it-output')).toBeVisible();
  });

  test('clicking input clears demo text', async () => {
    const tryItSection = page.locator('.tutorial-try-it');
    const input = tryItSection.locator('.try-it-input');

    // Input should have the demo sentence from previous test
    await expect(input).toHaveValue('The knight thought through the night');

    // Click the input to interact
    await input.click();

    // Demo text should be cleared
    await expect(input).toHaveValue('');

    // Translation output should be gone
    await expect(tryItSection.locator('.try-it-output')).not.toBeVisible();
  });

  test('user can type freely after clearing demo', async () => {
    const tryItSection = page.locator('.tutorial-try-it');
    const input = tryItSection.locator('.try-it-input');

    // Type custom text
    await input.fill('hello world');
    await expect(input).toHaveValue('hello world');

    // Translation should appear
    await expect(tryItSection.locator('.try-it-output')).toBeVisible();
  });
});
