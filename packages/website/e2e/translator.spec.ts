import { type BrowserContext, expect, type Page, test } from '@playwright/test';

import { blockExternalNetwork } from './test-utils';

interface CLSData {
  entries: { sources: string[]; time: number; value: number }[];
  total: number;
}

interface INPData {
  interactions: { duration: number; name: string }[];
  worst: number;
}

interface LargestContentfulPaintEntry extends PerformanceEntry {
  element: Element | null;
  renderTime: number;
  size: number;
}

interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput: boolean;
  sources: LayoutShiftSource[];
  value: number;
}

// Minimal types for the LayoutShift PerformanceObserver API (Chromium-only, not in lib.dom)
interface LayoutShiftSource {
  currentRect: DOMRectReadOnly;
  node: Element | null;
  previousRect: DOMRectReadOnly;
}

interface LCPData {
  element: string;
  value: number;
}

declare global {
  interface Window {
    __cls?: CLSData;
    __inp?: INPData;
    __lcp?: LCPData;
  }
}

/**
 * Helper: wait for the app to fully load (header visible, spinner gone).
 * Dictionary load can take 10-15s on slow CI webkit, so we use generous timeouts.
 */
async function waitForAppLoad(page: Page) {
  await expect(page.locator('.header h1')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.loading-spinner')).not.toBeVisible({ timeout: 20_000 });
}

// Web Vitals tests need fresh pages to test loading behavior — keep isolated
test.describe('Web Vitals', () => {
  test('app shell is present during dictionary loading', async ({ page }) => {
    await blockExternalNetwork(page);

    // Navigate and immediately check — don't wait for dictionary
    await page.goto('/');

    // The .app wrapper and header should be present from the start (static shell in index.html)
    await expect(page.locator('.app')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.header h1')).toBeVisible();
    await expect(page.locator('.logo')).toBeVisible();

    // Loading spinner should be inside .app > .main, not replacing the whole layout
    const spinner = page.locator('.loading-spinner');
    if (await spinner.isVisible()) {
      // Spinner should be a descendant of .app, not a sibling
      await expect(page.locator('.app .loading-spinner')).toBeVisible();
    }

    // Wait for dictionary to finish loading
    await expect(spinner).not.toBeVisible({ timeout: 20_000 });

    // After loading, .app wrapper and header should still be the same elements
    await expect(page.locator('.app')).toBeVisible();
    await expect(page.locator('.header h1')).toHaveText('Ingglish');
  });

  // PerformanceObserver layout-shift is Chromium-only; skip on WebKit
  test('CLS is below 0.1 during page load', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('safari'), 'WebKit has no layout-shift API');
    await blockExternalNetwork(page);

    // Install CLS observer BEFORE navigating.
    // Uses PerformanceObserver LayoutShift API (Chromium-only, not in lib.dom).
    await page.addInitScript(() => {
      (globalThis as unknown as { __cls: CLSData }).__cls = { entries: [], total: 0 };
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as LayoutShiftEntry;
          if (!shift.hadRecentInput) {
            const sources = shift.sources.map((s) => {
              const n = s.node;
              if (!n) {
                return '(null)';
              }
              const name = n.nodeName + (n.className ? '.' + n.className.split(' ').join('.') : '');
              const px = String(Math.round(s.previousRect.x));
              const py = String(Math.round(s.previousRect.y));
              const cx = String(Math.round(s.currentRect.x));
              const cy = String(Math.round(s.currentRect.y));
              return `${name} [${px}x${py} → ${cx}x${cy}]`;
            });
            (globalThis as unknown as { __cls: CLSData }).__cls.total += shift.value;
            (globalThis as unknown as { __cls: CLSData }).__cls.entries.push({
              sources,
              time: Math.round(entry.startTime),
              value: shift.value,
            });
          }
        }
      });
      observer.observe({ buffered: true, type: 'layout-shift' });
    });

    await page.goto('/');
    await waitForAppLoad(page);

    // Wait for any post-load layout shifts to settle
    await page.waitForTimeout(500);

    // Collect CLS score
    const result = await page.evaluate(() => {
      return (globalThis as unknown as { __cls: CLSData }).__cls;
    });
    console.log(`CLS: ${result.total.toFixed(4)}`);
    for (const entry of result.entries) {
      console.log(`  shift ${entry.value.toFixed(4)} @ ${String(entry.time)}ms:`);
      for (const source of entry.sources) {
        console.log(`    ${source}`);
      }
    }

    // Good CLS is < 0.1 per Web Vitals
    expect(result.total).toBeLessThan(0.1);
  });

  // Test CLS on every page route (Chromium-only — WebKit has no layout-shift API)
  for (const route of [
    '/text',
    '/url',
    '/extension',
    '/guide',
    '/docs',
    '/explore',
    '/experiment',
    '/challenge',
  ]) {
    test(`CLS is below 0.1 on ${route}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name.includes('safari'), 'WebKit has no layout-shift API');
      await blockExternalNetwork(page);

      // Install CLS observer BEFORE navigating
      await page.addInitScript(() => {
        (globalThis as unknown as { __cls: CLSData }).__cls = { entries: [], total: 0 };
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const shift = entry as LayoutShiftEntry;
            if (!shift.hadRecentInput) {
              const sources = shift.sources.map((s) => {
                const n = s.node;
                if (!n) {
                  return '(null)';
                }
                const name =
                  n.nodeName + (n.className ? '.' + n.className.split(' ').join('.') : '');
                const px = String(Math.round(s.previousRect.x));
                const py = String(Math.round(s.previousRect.y));
                const cx = String(Math.round(s.currentRect.x));
                const cy = String(Math.round(s.currentRect.y));
                return `${name} [${px}x${py} → ${cx}x${cy}]`;
              });
              (globalThis as unknown as { __cls: CLSData }).__cls.total += shift.value;
              (globalThis as unknown as { __cls: CLSData }).__cls.entries.push({
                sources,
                time: Math.round(entry.startTime),
                value: shift.value,
              });
            }
          }
        });
        observer.observe({ buffered: true, type: 'layout-shift' });
      });

      await page.goto(route);
      await waitForAppLoad(page);
      await page.waitForTimeout(500);

      const result = await page.evaluate(() => {
        return (globalThis as unknown as { __cls: CLSData }).__cls;
      });
      console.log(`CLS on ${route}: ${result.total.toFixed(4)}`);
      for (const entry of result.entries) {
        console.log(`  shift ${entry.value.toFixed(4)} @ ${String(entry.time)}ms:`);
        for (const source of entry.sources) {
          console.log(`    ${source}`);
        }
      }

      expect(result.total).toBeLessThan(0.1);
    });
  }

  // Test header position stability across load on every page route
  for (const route of [
    '/text',
    '/url',
    '/extension',
    '/guide',
    '/docs',
    '/explore',
    '/experiment',
    '/challenge',
  ]) {
    test(`header position stable across load on ${route}`, async ({ page }) => {
      await blockExternalNetwork(page);
      await page.goto(route);

      // Wait for header to be visible
      await expect(page.locator('.header')).toBeVisible({ timeout: 20_000 });

      const boxBefore = await page.locator('.header').boundingBox();
      expect(boxBefore).not.toBeNull();

      // Wait for full load
      await waitForAppLoad(page);

      const boxAfter = await page.locator('.header').boundingBox();
      expect(boxAfter).not.toBeNull();

      if (boxBefore && boxAfter) {
        expect(Math.abs(boxAfter.y - boxBefore.y)).toBeLessThanOrEqual(1);
      }
    });
  }

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
    const nextButton = page.locator('.progressive-btn-next');
    for (let index = 0; index < 6; index++) {
      await nextButton.click();
      await page.waitForTimeout(150);
    }

    const boxAfter = await controls.boundingBox();
    expect(boxAfter).not.toBeNull();
    if (boxBefore && boxAfter) {
      // Allow 1px tolerance for sub-pixel rendering differences across browsers
      expect(Math.abs(boxAfter.y - boxBefore.y)).toBeLessThanOrEqual(1);
    }
  });

  // FCP tests — works on all browsers via Paint Timing API
  for (const route of [
    '/',
    '/text',
    '/url',
    '/extension',
    '/guide',
    '/docs',
    '/explore',
    '/experiment',
    '/challenge',
  ]) {
    test(`FCP is below 1800ms on ${route}`, async ({ page }) => {
      await blockExternalNetwork(page);
      await page.goto(route);
      await waitForAppLoad(page);

      const fcp = await page.evaluate(
        () => performance.getEntriesByName('first-contentful-paint')[0]?.startTime
      );
      console.log(`FCP on ${route}: ${String(Math.round(fcp ?? 0))}ms`);
      expect(fcp).toBeDefined();
      expect(fcp).toBeLessThan(1800);
    });
  }

  // LCP tests — Chromium only (WebKit doesn't support largest-contentful-paint)
  for (const route of [
    '/',
    '/text',
    '/url',
    '/extension',
    '/guide',
    '/docs',
    '/explore',
    '/experiment',
    '/challenge',
  ]) {
    test(`LCP is below 2500ms on ${route}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name.includes('safari'), 'WebKit has no LCP API');
      await blockExternalNetwork(page);

      // Install LCP observer BEFORE navigating
      await page.addInitScript(() => {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const lcp = entry as LargestContentfulPaintEntry;
            (globalThis as unknown as { __lcp: LCPData }).__lcp = {
              element: lcp.element?.tagName ?? '(none)',
              value: lcp.startTime,
            };
          }
        });
        observer.observe({ buffered: true, type: 'largest-contentful-paint' });
      });

      await page.goto(route);
      await waitForAppLoad(page);

      const result = await page.evaluate(
        () => (globalThis as unknown as { __lcp?: LCPData }).__lcp
      );
      console.log(
        `LCP on ${route}: ${String(Math.round(result?.value ?? 0))}ms (element: ${result?.element ?? 'none'})`
      );
      expect(result).toBeDefined();
      expect(result?.value).toBeLessThan(2500);
    });
  }

  // INP test — Chromium only, /text page (most interaction-heavy)
  test('INP is below 200ms on /text', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.includes('safari'), 'WebKit has no Event Timing API');
    await blockExternalNetwork(page);

    // Install INP observer BEFORE navigating
    await page.addInitScript(() => {
      (globalThis as unknown as { __inp: INPData }).__inp = { interactions: [], worst: 0 };
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const inp = (globalThis as unknown as { __inp: INPData }).__inp;
          inp.interactions.push({ duration: entry.duration, name: entry.name });
          if (entry.duration > inp.worst) {
            inp.worst = entry.duration;
          }
        }
      });
      observer.observe({ durationThreshold: 16, type: 'event' } as PerformanceObserverInit);
    });

    await page.goto('/text');
    await waitForAppLoad(page);

    // Type into the English textarea to trigger interactions
    const englishInput = page.locator('textarea.text-input').first();
    await englishInput.fill('hello world');

    // Wait for interaction entries to settle
    await page.waitForTimeout(300);

    const result = await page.evaluate(() => (globalThis as unknown as { __inp?: INPData }).__inp);
    console.log(
      `INP on /text: worst=${String(result?.worst ?? 0)}ms, interactions=${String(result?.interactions.length ?? 0)}`
    );
    expect(result).toBeDefined();
    expect(result?.worst).toBeLessThan(200);
  });
});

// Share a single page across tests to avoid re-loading the 10MB dictionary each time.
// Tests run serially and clear state between runs.
test.describe('Text Translator', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }, workerInfo) => {
    context = await browser.newContext(workerInfo.project.use);
    page = await context.newPage();
    await blockExternalNetwork(page);
    await page.goto('/text');
    await waitForAppLoad(page);
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.beforeEach(async () => {
    // Clear inputs between tests
    const englishInput = page.locator('textarea.text-input').first();
    await englishInput.fill('');
  });

  test('displays header with logo and title', async () => {
    await expect(page.locator('.logo')).toBeVisible();
    await expect(page.locator('.header h1')).toHaveText('Ingglish');
  });

  test('translates text when typed', async () => {
    // With bidirectional translation, we have two text-input textareas
    const englishInput = page.locator('textarea.text-input').first();
    const ingglishInput = page.locator('textarea.text-input').last();

    await englishInput.fill('hello');
    await expect(ingglishInput).toHaveValue('haloh');
  });

  test('preserves capitalization', async () => {
    const englishInput = page.locator('textarea.text-input').first();
    const ingglishInput = page.locator('textarea.text-input').last();

    await englishInput.fill('Hello');
    await expect(ingglishInput).toHaveValue('Haloh');
  });

  test('handles sample text button', async () => {
    // Click the Random button (English side)
    await page.locator('.input-section').first().locator('button:has-text("Random")').click();
    const englishInput = page.locator('textarea.text-input').first();
    await expect(englishInput).not.toBeEmpty();
  });

  test('clears text with clear button', async () => {
    const englishInput = page.locator('textarea.text-input').first();
    await englishInput.fill('test');
    await page.locator('.input-section').first().locator('button:has-text("Clear")').click();
    await expect(englishInput).toBeEmpty();
  });

  test('English text does not flash empty when focusing Ingglish after sample', async () => {
    // Load sample text
    await page.locator('.input-section').first().locator('button:has-text("Random")').click();

    const englishInput = page.locator('textarea.text-input').first();
    const ingglishInput = page.locator('textarea.text-input').last();

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

  test('reverse translation works', async () => {
    const ingglishInput = page.locator('textarea.text-input').last();
    const englishInput = page.locator('textarea.text-input').first();

    // Focus Ingglish input and type a known word
    await ingglishInput.focus();
    await ingglishInput.fill('haloh');

    // Wait for reverse translation to complete
    await expect(englishInput).toHaveValue('hello');
  });

  test('handles unknown words not in dictionary', async () => {
    const englishInput = page.locator('textarea.text-input').first();
    const ingglishInput = page.locator('textarea.text-input').last();

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
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }, workerInfo) => {
    context = await browser.newContext(workerInfo.project.use);
    page = await context.newPage();
    await blockExternalNetwork(page);
    await page.goto('/text');
    await waitForAppLoad(page);
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('switches to URL translator tab', async () => {
    await page.click('.tab:has-text("Translate URL")');
    await expect(page.locator('.url-translator')).toBeVisible();
  });

  test('switches to spelling guide tab', async () => {
    await page.click('.tab:has-text("Spelling Guide")');
    await expect(page.locator('.spelling-guide')).toBeVisible();
  });

  test('subtitle link opens spelling guide', async () => {
    test.skip(test.info().project.name.includes('mobile'), 'subtitle link is hidden on mobile');
    // Navigate back to text tab first
    await page.click('.tab:has-text("Translate Text")');
    await page.click('.subtitle-link');
    await expect(page.locator('.spelling-guide')).toBeVisible();
  });
});
