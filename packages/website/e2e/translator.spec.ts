import { type BrowserContext, expect, type Locator, type Page, test } from '@playwright/test';

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

/** Move the mouse to the center of a locator's bounding box. */
async function hoverAt(page: Page, locator: Locator): Promise<void> {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by assertion above
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
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

  test('overlay text aligns with textarea text on /text', async ({ page }) => {
    await blockExternalNetwork(page);
    await page.goto('/text');
    await waitForAppLoad(page);

    // Load sample text so there's content to compare
    await page
      .locator('.input-section')
      .first()
      .getByRole('button', { name: 'Random sample' })
      .click();
    const englishInput = page.locator('textarea.text-input').first();
    await expect(englishInput).not.toBeEmpty();

    // Wait for overlay to render
    await page.waitForTimeout(200);

    // Compare character positions: get bounding rect of first word in overlay
    // vs where that text would render in the textarea
    const misalignment = await page.evaluate(() => {
      const container = document.querySelector('.overlay-textarea');
      if (!container) return { error: 'no container' };
      const textarea = container.querySelector('textarea');
      const overlay = container.querySelector('.overlay-textarea-display');
      if (!textarea || !overlay) return { error: 'no textarea or overlay' };

      // Create a temporary span in the textarea's position to measure where
      // the textarea text starts. We use a mirror div approach.
      const style = getComputedStyle(textarea);
      const mirror = document.createElement('div');
      mirror.style.position = 'absolute';
      mirror.style.visibility = 'hidden';
      mirror.style.whiteSpace = 'pre-wrap';
      mirror.style.overflowWrap = 'break-word';
      // Copy all relevant text-layout properties
      for (const property of [
        'font-family',
        'font-size',
        'font-weight',
        'line-height',
        'letter-spacing',
        'word-spacing',
        'padding-top',
        'padding-left',
        'padding-right',
        'padding-bottom',
        'border-top-width',
        'border-left-width',
        'border-right-width',
        'border-bottom-width',
        'width',
      ] as const) {
        mirror.style.setProperty(property, style.getPropertyValue(property));
      }
      mirror.style.boxSizing = 'border-box';

      // Insert a marker at the start of the text
      const marker = document.createElement('span');
      marker.textContent = textarea.value.charAt(0);
      mirror.append(marker);
      container.append(mirror);

      const mirrorRect = marker.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const mirrorX = mirrorRect.left - containerRect.left;
      const mirrorY = mirrorRect.top - containerRect.top;

      mirror.remove();

      // Get first word token position in overlay
      const firstToken = overlay.querySelector('.word-token');
      if (!firstToken) return { error: 'no word token' };
      const tokenRect = firstToken.getBoundingClientRect();
      const tokenX = tokenRect.left - containerRect.left;
      const tokenY = tokenRect.top - containerRect.top;

      return {
        dx: Math.abs(tokenX - mirrorX),
        dy: Math.abs(tokenY - mirrorY),
        mirrorX,
        mirrorY,
        tokenX,
        tokenY,
      };
    });

    console.log('Overlay alignment:', JSON.stringify(misalignment));
    expect(misalignment).not.toHaveProperty('error');
    if ('dx' in misalignment) {
      // Allow 3px tolerance for sub-pixel rendering (mobile-safari can exceed 2px)
      expect(misalignment.dx).toBeLessThanOrEqual(3);
      expect(misalignment.dy).toBeLessThanOrEqual(3);
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
    await page
      .locator('.input-section')
      .first()
      .getByRole('button', { name: 'Random sample' })
      .click();
    const englishInput = page.locator('textarea.text-input').first();
    await expect(englishInput).not.toBeEmpty();
  });

  test('clears text with clear button', async () => {
    const englishInput = page.locator('textarea.text-input').first();
    await englishInput.fill('test');
    await page.locator('.input-section').first().getByRole('button', { name: 'Clear' }).click();
    await expect(englishInput).toBeEmpty();
  });

  test('English text does not flash empty when focusing Ingglish after sample', async () => {
    // Load sample text
    await page
      .locator('.input-section')
      .first()
      .getByRole('button', { name: 'Random sample' })
      .click();

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

  test('English pane does not flicker when focusing Ingglish pane', async () => {
    const englishInput = page.locator('textarea.text-input').first();
    const ingglishInput = page.locator('textarea.text-input').last();

    // Use fixed text (not Random) to avoid non-deterministic sample loading
    await englishInput.fill('The quick brown fox jumps over the lazy dog.');

    // Wait for the specific translation to appear (not just "not empty",
    // which could pass with stale text from a previous test)
    await expect(ingglishInput).toHaveValue(/kwik broun foks/, { timeout: 10_000 });

    // Install a frame-level monitor on BOTH panes' textarea values and overlay visibility
    await page.evaluate(() => {
      const left = document.querySelector('.input-section:first-child') as HTMLElement;
      const right = document.querySelector('.input-section:last-child') as HTMLElement;
      const leftTA = left.querySelector('textarea') as HTMLTextAreaElement;
      const rightTA = right.querySelector('textarea') as HTMLTextAreaElement;
      const elements = { left, leftTA, right, rightTA };
      const snapshots: {
        leftHasOverlay: boolean;
        leftValue: string;
        rightHasOverlay: boolean;
        rightValue: string;
      }[] = [];
      let stopped = false;
      function poll() {
        const leftOverlay = elements.left.querySelector('.overlay-textarea-display');
        const rightOverlay = elements.right.querySelector('.overlay-textarea-display');
        snapshots.push({
          leftHasOverlay: leftOverlay !== null && leftOverlay.children.length > 0,
          leftValue: elements.leftTA.value,
          rightHasOverlay: rightOverlay !== null && rightOverlay.children.length > 0,
          rightValue: elements.rightTA.value,
        });
        if (!stopped) {
          requestAnimationFrame(poll);
        }
      }
      requestAnimationFrame(poll);
      (globalThis as unknown as Record<string, unknown>).__flickerMonitor = {
        snapshots,
        stop: () => {
          stopped = true;
        },
      };
    });

    // Focus the Ingglish input (triggers the lastEdited flip)
    await ingglishInput.focus();

    // Wait a few frames for any flicker to occur
    await page.waitForTimeout(300);

    // Stop monitor and collect results
    const result = await page.evaluate(() => {
      const monitor = (globalThis as unknown as Record<string, unknown>).__flickerMonitor as {
        snapshots: {
          leftHasOverlay: boolean;
          leftValue: string;
          rightHasOverlay: boolean;
          rightValue: string;
        }[];
        stop: () => void;
      };
      monitor.stop();
      const { snapshots } = monitor;
      const leftEmpty = snapshots.filter((s) => s.leftValue.trim() === '').length;
      const leftOverlayDropped = snapshots.filter((s) => !s.leftHasOverlay).length;
      const rightEmpty = snapshots.filter((s) => s.rightValue.trim() === '').length;
      const rightOverlayDropped = snapshots.filter((s) => !s.rightHasOverlay).length;
      const leftUniqueValues = [...new Set(snapshots.map((s) => s.leftValue))];
      const rightUniqueValues = [...new Set(snapshots.map((s) => s.rightValue))];
      return {
        frames: snapshots.length,
        leftEmpty,
        leftOverlayDropped,
        leftUniqueValues,
        rightEmpty,
        rightOverlayDropped,
        rightUniqueValues,
      };
    });

    console.log(
      `Flicker monitor: ${String(result.frames)} frames | ` +
        `left: ${String(result.leftEmpty)} empty, ${String(result.leftOverlayDropped)} overlay-dropped, ${String(result.leftUniqueValues.length)} unique | ` +
        `right: ${String(result.rightEmpty)} empty, ${String(result.rightOverlayDropped)} overlay-dropped, ${String(result.rightUniqueValues.length)} unique`
    );

    // Neither pane's text should ever be empty during the focus transition
    expect(result.leftEmpty).toBe(0);
    expect(result.rightEmpty).toBe(0);

    // Neither pane's overlay should disappear (would cause a flash of invisible text)
    expect(result.leftOverlayDropped).toBe(0);
    expect(result.rightOverlayDropped).toBe(0);

    // Neither pane's value should change (stable content = no flicker)
    expect(result.leftUniqueValues).toHaveLength(1);
    expect(result.rightUniqueValues).toHaveLength(1);
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

  test('hovering output word highlights corresponding input word', async () => {
    test.skip(
      test.info().project.name.includes('mobile'),
      'hover is not supported on touch devices'
    );
    const englishInput = page.locator('textarea.text-input').first();
    await englishInput.fill('hello world');

    // Wait for translation overlay to render
    const outputOverlay = page.locator('.ingglish-section .overlay-textarea-display');
    await expect(outputOverlay.locator('.word-token').first()).toBeVisible();

    // Move mouse to the first word's position (hover is detected via textarea
    // onMouseMove + elementFromPoint, so we need to move to the coordinates)
    await hoverAt(page, outputOverlay.locator('.word-token').first());

    // The first word in the INPUT overlay should get the highlighted class
    const inputOverlay = page.locator('.input-section .overlay-textarea-display');
    await expect(inputOverlay.locator('.word-token').first()).toHaveClass(/highlighted/);

    // The second word in the input should NOT be highlighted
    await expect(inputOverlay.locator('.word-token').nth(1)).not.toHaveClass(/highlighted/);
  });

  test('hovering input word highlights corresponding output word', async () => {
    test.skip(
      test.info().project.name.includes('mobile'),
      'hover is not supported on touch devices'
    );
    const englishInput = page.locator('textarea.text-input').first();
    await englishInput.fill('hello world');

    // Wait for output overlay to render
    const outputOverlay = page.locator('.ingglish-section .overlay-textarea-display');
    await expect(outputOverlay.locator('.word-token').first()).toBeVisible();

    // Move mouse to the second input word's position
    const inputOverlay = page.locator('.input-section .overlay-textarea-display');
    await hoverAt(page, inputOverlay.locator('.word-token').nth(1));

    // The second word in the OUTPUT overlay should get the highlighted class
    await expect(outputOverlay.locator('.word-token').nth(1)).toHaveClass(/highlighted/);

    // The first word in the output should NOT be highlighted
    await expect(outputOverlay.locator('.word-token').first()).not.toHaveClass(/highlighted/);
  });

  test('highlight clears when mouse leaves pane', async () => {
    test.skip(
      test.info().project.name.includes('mobile'),
      'hover is not supported on touch devices'
    );
    const englishInput = page.locator('textarea.text-input').first();
    await englishInput.fill('hello world');

    const outputOverlay = page.locator('.ingglish-section .overlay-textarea-display');
    await expect(outputOverlay.locator('.word-token').first()).toBeVisible();

    // Move mouse to word position to activate highlight
    await hoverAt(page, outputOverlay.locator('.word-token').first());
    const inputOverlay = page.locator('.input-section .overlay-textarea-display');
    await expect(inputOverlay.locator('.word-token').first()).toHaveClass(/highlighted/);

    // Move mouse away from the pane (hover the header)
    await page.locator('.header').hover();

    // Highlight should be cleared
    await expect(inputOverlay.locator('.word-token.highlighted')).toHaveCount(0);
  });

  test('left and right panes have equal height in English mode', async () => {
    test.skip(test.info().project.name.includes('mobile'), 'panes stack vertically on mobile');
    const englishInput = page.locator('textarea.text-input').first();
    await englishInput.fill('hello world');
    await page.waitForTimeout(200);

    const left = page.locator('.input-section').first();
    const right = page.locator('.input-section').last();
    const leftBox = await left.boundingBox();
    const rightBox = await right.boundingBox();
    expect(leftBox).not.toBeNull();
    expect(rightBox).not.toBeNull();
    if (leftBox && rightBox) {
      // Allow 1px tolerance for sub-pixel rendering
      expect(Math.abs(leftBox.height - rightBox.height)).toBeLessThanOrEqual(1);
    }
  });

  test('left and right panes have equal height in target language mode', async () => {
    test.skip(test.info().project.name.includes('mobile'), 'panes stack vertically on mobile');
    // Switch to Swedish
    await page.locator('.language-select').selectOption('sv');

    // Wait for dict to load (target output pane appears instead of textarea)
    const targetOutput = page.locator('.target-output');
    await expect(targetOutput).toBeVisible({ timeout: 15_000 });

    // Type Swedish text to trigger translation
    const englishInput = page.locator('textarea.text-input').first();
    await englishInput.fill('Hej världen');

    // Wait for translated content to render
    await expect(targetOutput.locator('.word-token').first()).toBeVisible({ timeout: 15_000 });

    const left = page.locator('.input-section').first();
    const right = page.locator('.input-section').last();
    const leftBox = await left.boundingBox();
    const rightBox = await right.boundingBox();
    expect(leftBox).not.toBeNull();
    expect(rightBox).not.toBeNull();
    if (leftBox && rightBox) {
      // Allow 1px tolerance for sub-pixel rendering
      expect(Math.abs(leftBox.height - rightBox.height)).toBeLessThanOrEqual(1);
    }

    // Switch back to English for subsequent tests
    await page.locator('.language-select').selectOption('en');
    await page.locator('textarea.text-input').first().fill('');
  });

  test('Khmer sample texts have no untranslated words', async () => {
    // Switch to Khmer
    await page.locator('.language-select').selectOption('km');

    const targetOutput = page.locator('.target-output');
    await expect(targetOutput).toBeVisible({ timeout: 15_000 });

    const englishInput = page.locator('textarea.text-input').first();
    const sampleSelect = page.locator('.sample-select');

    // Get number of Khmer samples
    const optionCount = await sampleSelect.locator('option').count();
    // First option is the placeholder ("Select a passage...")
    const sampleCount = optionCount - 1;

    for (let i = 0; i < sampleCount; i++) {
      await sampleSelect.selectOption(String(i));
      // Wait for input to have text
      await expect(englishInput).not.toHaveValue('', { timeout: 5000 });
      // Wait for translation to render
      await expect(targetOutput.locator('.word-token').first()).toBeVisible({ timeout: 15_000 });

      // Check that no words are untranslated
      const notFound = targetOutput.locator('.target-not-found');
      const notFoundCount = await notFound.count();
      if (notFoundCount > 0) {
        // Collect the untranslated words for a useful error message
        const words = await notFound.allTextContents();
        const label = (await sampleSelect.locator('option:checked').textContent()) ?? '?';
        expect(notFoundCount, `${label}: untranslated words: ${words.join(', ')}`).toBe(0);
      }
    }

    // Switch back to English for subsequent tests
    await page.locator('.language-select').selectOption('en');
    await englishInput.fill('');
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
