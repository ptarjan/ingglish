import { expect, test } from '@playwright/test';

// Install a MutationObserver on <title> before the page navigates,
// so we can assert that no unwanted intermediate titles appear.
async function trackTitleChanges(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    (window as unknown as { __titleChanges: string[] }).__titleChanges = [];
    new MutationObserver(() => {
      (window as unknown as { __titleChanges: string[] }).__titleChanges.push(document.title);
    }).observe(document.querySelector('title')!, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  });
}

async function getTitleChanges(page: import('@playwright/test').Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { __titleChanges: string[] }).__titleChanges);
}

test('non-docs pages have correct titles', async ({ page }) => {
  await page.goto('/text');
  await expect(page).toHaveTitle('Text Translator | Ingglish');

  await page.goto('/games');
  await expect(page).toHaveTitle('Games | Ingglish');
});

test('docs page title loads without flash', async ({ page }) => {
  await trackTitleChanges(page);
  await page.goto('/docs/design-decisions');
  await expect(page).toHaveTitle('Design Decisions | Ingglish Docs');

  const changes = await getTitleChanges(page);
  // Title should never be blank or show the generic "Documentation | Ingglish"
  for (const title of changes) {
    expect(title, `unexpected intermediate title: "${title}"`).not.toBe('');
    expect(title, `unexpected intermediate title: "${title}"`).not.toBe('Documentation | Ingglish');
  }
});

test('docs title updates when navigating between docs', async ({ page }) => {
  await page.goto('/docs/design-decisions');
  await page.waitForSelector('.docs-content');

  const navLink = page.locator('a.docs-nav-item:has-text("Architecture")');
  await navLink.scrollIntoViewIfNeeded();
  await navLink.click();
  await expect(page).toHaveTitle('Architecture | Ingglish Docs');
});
