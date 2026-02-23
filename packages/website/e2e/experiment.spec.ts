import { expect, type Page, test } from '@playwright/test';

import { blockExternalNetwork } from './test-utils';

async function waitForAppLoad(page: Page) {
  await expect(page.locator('.header h1')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.loading-spinner')).not.toBeVisible({ timeout: 20_000 });
}

test.describe('Experiment presets', () => {
  test('IPA preset should not capitalize output', async ({ page }) => {
    await blockExternalNetwork(page);
    await page.goto('/experiment');
    await waitForAppLoad(page);

    // Type some text in the experiment input
    const textarea = page.locator('.experiment-input');
    await textarea.fill('But the plural of ox becomes oxen.');

    // Wait for initial translation to appear
    await expect(page.locator('.experiment-output')).toBeVisible({ timeout: 10_000 });

    // Click the IPA preset
    await page.click('.preset-link:has-text("IPA")');

    // Wait for translation to update
    await page.waitForTimeout(500);

    // Get the translated text
    const output = page.locator('.experiment-words');
    const text = await output.textContent();

    // IPA output should NOT start with a capital letter
    // "But" -> "bʌt" not "Bʌt"
    expect(text).not.toMatch(/^[A-Z]/);
    // Check that "bʌt" appears (lowercase b)
    expect(text).toContain('bʌt');
    // Should NOT contain "Bʌt" (capital B)
    expect(text).not.toContain('Bʌt');
  });
});
