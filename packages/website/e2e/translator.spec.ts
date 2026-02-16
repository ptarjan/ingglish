import { test, expect } from '@playwright/test';
import { blockExternalNetwork } from './test-utils';

/**
 * Helper: wait for the app to fully load (header visible, spinner gone).
 * Dictionary load can take 10-15s on slow CI webkit, so we use generous timeouts.
 */
async function waitForAppLoad(page: import('@playwright/test').Page) {
  await expect(page.locator('.header h1')).toBeVisible({ timeout: 20000 });
  await expect(page.locator('.loading-spinner')).not.toBeVisible({ timeout: 20000 });
}

test.describe('Layout Stability (CLS)', () => {
  test('app shell is present during dictionary loading', async ({ page }) => {
    await blockExternalNetwork(page);

    // Navigate and immediately check — don't wait for dictionary
    await page.goto('/');

    // The .app wrapper and header should be present from the start (static shell in index.html)
    await expect(page.locator('.app')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('.header h1')).toBeVisible();
    await expect(page.locator('.logo')).toBeVisible();

    // Loading spinner should be inside .app > .main, not replacing the whole layout
    const spinner = page.locator('.loading-spinner');
    if (await spinner.isVisible()) {
      // Spinner should be a descendant of .app, not a sibling
      await expect(page.locator('.app .loading-spinner')).toBeVisible();
    }

    // Wait for dictionary to finish loading
    await expect(spinner).not.toBeVisible({ timeout: 20000 });

    // After loading, .app wrapper and header should still be the same elements
    await expect(page.locator('.app')).toBeVisible();
    await expect(page.locator('.header h1')).toHaveText('Ingglish');
  });

  // PerformanceObserver layout-shift is Chromium-only; skip on WebKit
  test('CLS is below 0.1 during page load', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('safari'), 'WebKit has no layout-shift API');
    await blockExternalNetwork(page);

    // Install CLS observer BEFORE navigating.
    // Uses PerformanceObserver LayoutShift API (not yet in TypeScript's lib.dom).
    /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access,
       @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call,
       @typescript-eslint/no-unsafe-argument, @typescript-eslint/restrict-plus-operands,
       @typescript-eslint/restrict-template-expressions, @typescript-eslint/prefer-nullish-coalescing */
    await page.addInitScript(() => {
      (window as any).__cls = { total: 0, entries: [] as any[] };
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as any;
          if (!shift.hadRecentInput) {
            const sources = (shift.sources || []).map((s: any) => {
              const n = s.node;
              if (!n) {
                return '(null)';
              }
              const name = n.nodeName + (n.className ? '.' + n.className.split(' ').join('.') : '');
              return `${name} [${Math.round(s.previousRect?.x)}x${Math.round(s.previousRect?.y)} → ${Math.round(s.currentRect?.x)}x${Math.round(s.currentRect?.y)}]`;
            });
            (window as any).__cls.total += shift.value;
            (window as any).__cls.entries.push({
              value: shift.value,
              time: Math.round(entry.startTime),
              sources,
            });
          }
        }
      });
      observer.observe({ type: 'layout-shift', buffered: true });
    });

    await page.goto('/');
    await waitForAppLoad(page);

    // Wait for any post-load layout shifts to settle
    await page.waitForTimeout(500);

    // Collect CLS score
    const result = await page.evaluate(() => {
      return (window as any).__cls as {
        total: number;
        entries: { value: number; time: number; sources: string[] }[];
      };
    });
    console.log(`CLS: ${result.total.toFixed(4)}`);
    for (const entry of result.entries) {
      console.log(`  shift ${entry.value.toFixed(4)} @ ${String(entry.time)}ms:`);
      for (const src of entry.sources) {
        console.log(`    ${src}`);
      }
    }
    /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access,
       @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call,
       @typescript-eslint/no-unsafe-argument, @typescript-eslint/restrict-plus-operands,
       @typescript-eslint/restrict-template-expressions, @typescript-eslint/prefer-nullish-coalescing */

    // Good CLS is < 0.1 per Web Vitals
    expect(result.total).toBeLessThan(0.1);
  });

  test('progressive controls do not shift when stepping', async ({ page }) => {
    await blockExternalNetwork(page);
    await page.goto('/');
    await waitForAppLoad(page);

    // Scroll to the progressive section
    const controls = page.locator('.progressive-controls');
    await controls.scrollIntoViewIfNeeded();
    await expect(controls).toBeVisible();

    const boxBefore = await controls.boundingBox();
    expect(boxBefore).not.toBeNull();

    // Click Next through all steps
    const nextBtn = page.locator('.progressive-btn-next');
    for (let i = 0; i < 6; i++) {
      await nextBtn.click();
      await page.waitForTimeout(150);
    }

    const boxAfter = await controls.boundingBox();
    expect(boxAfter).not.toBeNull();
    if (boxBefore && boxAfter) {
      // Allow 1px tolerance for sub-pixel rendering differences across browsers
      expect(Math.abs(boxAfter.y - boxBefore.y)).toBeLessThanOrEqual(1);
    }
  });
});

test.describe('Text Translator', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternalNetwork(page);
    await page.goto('/text');
    await waitForAppLoad(page);
  });

  test('displays header with logo and title', async ({ page }) => {
    await expect(page.locator('.logo')).toBeVisible();
    await expect(page.locator('.header h1')).toHaveText('Ingglish');
  });

  test('translates text when typed', async ({ page }) => {
    // With bidirectional translation, we have two text-input textareas
    const englishInput = page.locator('.text-input').first();
    const ingglishInput = page.locator('.text-input').last();

    await englishInput.fill('hello');
    await expect(ingglishInput).toHaveValue('huloh');
  });

  test('preserves capitalization', async ({ page }) => {
    const englishInput = page.locator('.text-input').first();
    const ingglishInput = page.locator('.text-input').last();

    await englishInput.fill('Hello');
    await expect(ingglishInput).toHaveValue('Huloh');
  });

  test('handles sample text button', async ({ page }) => {
    // Click the first Sample button (English side)
    await page.locator('.input-section').first().locator('button:has-text("Sample")').click();
    const englishInput = page.locator('.text-input').first();
    await expect(englishInput).not.toBeEmpty();
  });

  test('clears text with clear button', async ({ page }) => {
    const englishInput = page.locator('.text-input').first();
    await englishInput.fill('test');
    await page.locator('.input-section').first().locator('button:has-text("Clear")').click();
    await expect(englishInput).toBeEmpty();
  });

  test('English text does not flash empty when focusing Ingglish after sample', async ({
    page,
  }) => {
    // Load sample text
    await page.locator('.input-section').first().locator('button:has-text("Sample")').click();

    const englishInput = page.locator('.text-input').first();
    const ingglishInput = page.locator('.text-input').last();

    // Wait for translation to complete
    await expect(ingglishInput).not.toBeEmpty();

    // Store the English text before focus change
    const englishBefore = await englishInput.inputValue();
    expect(englishBefore.length).toBeGreaterThan(0);

    // Focus the Ingglish input
    await ingglishInput.focus();

    // English text should still be visible (not empty)
    await expect(englishInput).not.toBeEmpty();
  });

  test('reverse translation works', async ({ page }) => {
    const ingglishInput = page.locator('.text-input').last();
    const englishInput = page.locator('.text-input').first();

    // Focus Ingglish input and type a known word
    await ingglishInput.focus();
    await ingglishInput.fill('huloh');

    // Wait for reverse translation to complete
    await expect(englishInput).toHaveValue('hello');
  });

  test('handles unknown words not in dictionary', async ({ page }) => {
    const englishInput = page.locator('.text-input').first();
    const ingglishInput = page.locator('.text-input').last();

    // "kubernetes" is not in CMU dictionary, should use rule-based fallback
    await englishInput.fill('kubernetes');

    // Should produce some output (not throw or be empty)
    await expect(ingglishInput).not.toBeEmpty();
    // The output should be a string (rule-based G2P output)
    const value = await ingglishInput.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });
});

test.describe('Tab Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternalNetwork(page);
    await page.goto('/text');
    await waitForAppLoad(page);
  });

  test('switches to URL translator tab', async ({ page }) => {
    await page.click('.tab:has-text("Translate URL")');
    await expect(page.locator('.url-translator')).toBeVisible();
  });

  test('switches to spelling guide tab', async ({ page }) => {
    await page.click('.tab:has-text("Spelling Guide")');
    await expect(page.locator('.spelling-guide')).toBeVisible();
  });

  test('subtitle link opens spelling guide', async ({ page, isMobile }) => {
    test.skip(isMobile, 'subtitle link is hidden on mobile');
    await page.click('.subtitle-link');
    await expect(page.locator('.spelling-guide')).toBeVisible();
  });

  test('old hash URL redirects to path URL', async ({ page }) => {
    await page.goto('/#guide');
    await waitForAppLoad(page);
    await expect(page.locator('.spelling-guide')).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/guide');
  });
});

test.describe('Spelling Guide', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternalNetwork(page);
    await page.goto('/guide');
    await waitForAppLoad(page);
    // Wait for spelling guide content to render
    await expect(page.locator('.spelling-guide')).toBeVisible();
  });

  test('displays vowel mappings table', async ({ page }) => {
    await expect(page.locator('h3:has-text("Vowels")')).toBeVisible();
    await expect(page.locator('.mapping-table').first()).toBeVisible();
  });

  test('displays consonant mappings table', async ({ page }) => {
    await expect(page.locator('h3:has-text("Consonants")')).toBeVisible();
  });

  test('displays key principles', async ({ page }) => {
    await expect(page.locator('h3:has-text("Key Principles")')).toBeVisible();
    await expect(page.locator('.principles-list li')).toHaveCount(4);
  });
});
