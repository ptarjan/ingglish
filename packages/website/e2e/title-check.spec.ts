import { expect, test } from '@playwright/test';

test('non-docs pages have correct titles', async ({ page }) => {
  await page.goto('/text');
  await expect(page).toHaveTitle('Text Translator | Ingglish');

  await page.goto('/challenge');
  await expect(page).toHaveTitle('Reading Challenge | Ingglish');
});

test('docs pages have per-doc titles', async ({ page }) => {
  await page.goto('/docs/design-decisions');
  await expect(page).toHaveTitle('Design Decisions | Ingglish Docs');
});

test('docs title updates when navigating between docs', async ({ page }) => {
  await page.goto('/docs/design-decisions');
  await page.waitForSelector('.docs-content');

  await page.click('a.docs-nav-item:has-text("Architecture")');
  await expect(page).toHaveTitle('Architecture | Ingglish Docs');
});
