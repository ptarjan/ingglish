import { type BrowserContext, expect, type Page, test } from '@playwright/test';

import { blockExternalNetwork } from './test-utils';

async function waitForAppLoad(page: Page) {
  await expect(page.locator('.header h1')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.loading-spinner')).not.toBeVisible({ timeout: 20_000 });
}

// Share a single page to avoid re-loading the dictionary each time.
test.describe('Experiment presets', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }, workerInfo) => {
    context = await browser.newContext(workerInfo.project.use);
    page = await context.newPage();
    await blockExternalNetwork(page);
    await page.goto('/experiment');
    await waitForAppLoad(page);
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('IPA preset should not capitalize output', async () => {
    // Type some text in the experiment input
    const textarea = page.locator('.experiment-input');
    await textarea.scrollIntoViewIfNeeded();
    await textarea.fill('But the plural of ox becomes oxen.');

    // Wait for initial translation to appear
    await expect(page.locator('.experiment-output')).toBeVisible({ timeout: 10_000 });

    // Click the IPA preset — use locator with explicit scroll since on mobile
    // the textarea is far below the presets (mapping table between them), and
    // WebKit can fail the scroll+click in one action
    const ipaLink = page.locator('.preset-link:has-text("IPA")');
    await ipaLink.scrollIntoViewIfNeeded();
    await ipaLink.click();

    // Wait for IPA translation to appear (replaces fixed timeout with assertion-based wait)
    const output = page.locator('.experiment-words');
    await expect(output).toContainText('bʌt', { timeout: 10_000 });

    const text = await output.textContent();

    // IPA output should NOT start with a capital letter
    // "But" -> "bʌt" not "Bʌt"
    expect(text).not.toMatch(/^[A-Z]/);
    // Should NOT contain "Bʌt" (capital B)
    expect(text).not.toContain('Bʌt');
  });
});
