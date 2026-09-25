import { expect, type Locator, test } from '@playwright/test';

import { setupMockProxy, waitForAppLoad } from './test-utils';

// Regression test for the direction-toggle button ("Ingglish ⇅") wrapping onto
// two lines at tablet widths (e.g. Brave on an iPad, 810px wide). The label and
// arrow must stay on one line, matching the height of its sibling toolbar buttons.
// iPad portrait viewport — wide enough to skip the <=640px mobile column layout,
// narrow enough that unconstrained flex-shrink used to squeeze the toggle button
// until its label wrapped.
const IPAD_PORTRAIT = { height: 1080, width: 810 };

/** Lines of text in a button: its content-box height over its line height. */
async function labelLines(button: Locator): Promise<number> {
  return button.evaluate((el) => {
    const style = getComputedStyle(el);
    const [
      padTop = 0,
      padBottom = 0,
      borderTop = 0,
      borderBottom = 0,
      fontSize = 0,
      lineHeight = 0,
    ] = [
      style.paddingTop,
      style.paddingBottom,
      style.borderTopWidth,
      style.borderBottomWidth,
      style.fontSize,
      style.lineHeight,
    ].map((v) => Number.parseFloat(v) || 0);
    const content =
      el.getBoundingClientRect().height - padTop - padBottom - borderTop - borderBottom;
    return Math.round(content / (lineHeight > 0 ? lineHeight : fontSize * 1.2));
  });
}

test.describe('Toolbar layout at tablet width', () => {
  test('URL translator format-toggle button stays on one line', async ({ browser }) => {
    const context = await browser.newContext({ viewport: IPAD_PORTRAIT });
    const page = await context.newPage();
    await setupMockProxy(page);
    await page.goto('/url');
    await waitForAppLoad(page);
    await expect(page.locator('.url-translator')).toBeVisible();

    const formatToggle = page.locator('.url-form .format-toggle');
    const clearButton = page.locator('.url-form button:has-text("Clear")');

    const toggleBox = await formatToggle.boundingBox();
    const clearBox = await clearButton.boundingBox();
    expect(toggleBox).not.toBeNull();
    expect(clearBox).not.toBeNull();

    // Same base button styles (.btn-secondary), so an unwrapped label keeps them
    // the same height. A wrapped label makes the toggle noticeably taller.
    expect(toggleBox?.height).toBeCloseTo(clearBox?.height ?? 0, 0);
    expect(await labelLines(formatToggle)).toBe(1);

    await context.close();
  });

  test('Text translator format-toggle button stays on one line', async ({ browser }) => {
    const context = await browser.newContext({ viewport: IPAD_PORTRAIT });
    const page = await context.newPage();
    await page.goto('/text');
    await waitForAppLoad(page);
    await expect(page.locator('.text-translator')).toBeVisible();

    const formatToggle = page.locator('.format-toggle');
    expect(await labelLines(formatToggle)).toBe(1);

    await context.close();
  });
});
