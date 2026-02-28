import { expect, type Page, test } from '@playwright/test';

import { blockExternalNetwork } from './test-utils';

async function waitForAppLoad(page: Page) {
  await expect(page.locator('.header h1')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.loading-spinner')).not.toBeVisible({ timeout: 20_000 });
}

test.describe('Experiment presets', () => {
  // Dictionary load can take 15-20s on slow CI webkit, so allow extra time
  test('IPA preset should not capitalize output', async ({ page }) => {
    test.setTimeout(60_000);
    await blockExternalNetwork(page);
    await page.goto('/experiment');
    await waitForAppLoad(page);

    // Type some text in the experiment input
    const textarea = page.locator('.experiment-input');
    await textarea.scrollIntoViewIfNeeded();
    await expect(textarea).toBeEditable({ timeout: 10_000 });
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
