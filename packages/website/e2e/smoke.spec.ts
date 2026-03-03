import { expect, test } from '@playwright/test';

import { blockExternalNetwork, waitForAppLoad } from './test-utils';

// Smoke tests: load every page, interact, and verify no console errors.
// Catches broken routes, missing dictionaries, and runtime crashes.

test.describe('Smoke Tests', () => {
  test('/ loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await blockExternalNetwork(page);
    await page.goto('/');
    await waitForAppLoad(page);
    expect(errors).toEqual([]);
  });

  test('/text loads and translates', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await blockExternalNetwork(page);
    await page.goto('/text');
    await waitForAppLoad(page);
    await page.locator('textarea.text-input').first().fill('hello world');
    await expect(page.locator('.word-token').first()).toBeVisible({ timeout: 10_000 });
    expect(errors).toEqual([]);
  });

  test('/text with non-English language loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await blockExternalNetwork(page);
    await page.goto('/text?lang=ja');
    await waitForAppLoad(page);
    // Wait for dictionary to load and sample to appear
    await expect(page.locator('textarea.text-input').first()).not.toHaveValue('', {
      timeout: 15_000,
    });
    expect(errors).toEqual([]);
  });

  test('/explore loads and shows results', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await blockExternalNetwork(page);
    await page.goto('/explore');
    await waitForAppLoad(page);
    await page.locator('.explorer-input').fill('hello');
    await expect(page.locator('.word-card').first()).toBeVisible({ timeout: 10_000 });
    expect(errors).toEqual([]);
  });

  test('/experiment loads and translates', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await blockExternalNetwork(page);
    await page.goto('/experiment');
    await waitForAppLoad(page);
    await page.locator('.experiment-input').fill('hello world');
    await expect(page.locator('.word-token').first()).toBeVisible({ timeout: 10_000 });
    expect(errors).toEqual([]);
  });

  test('/games loads and can open a game', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await blockExternalNetwork(page);
    await page.goto('/games');
    await waitForAppLoad(page);
    await expect(page.locator('.games-hub-card').first()).toBeVisible({ timeout: 15_000 });
    await page.locator('.games-hub-card').first().click();
    await waitForAppLoad(page);
    expect(errors).toEqual([]);
  });

  for (const game of ['reading', 'homophones', 'speedmatch', 'reverse', 'learn']) {
    test(`/games/${game} loads without errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await blockExternalNetwork(page);
      await page.goto(`/games/${game}`);
      await waitForAppLoad(page);
      expect(errors).toEqual([]);
    });
  }

  test('/guide loads', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await blockExternalNetwork(page);
    await page.goto('/guide');
    await waitForAppLoad(page);
    expect(errors).toEqual([]);
  });

  test('/docs loads', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await blockExternalNetwork(page);
    await page.goto('/docs');
    await waitForAppLoad(page);
    await expect(page.locator('.docs-content')).toBeVisible({ timeout: 10_000 });
    expect(errors).toEqual([]);
  });

  test('/extension loads', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await blockExternalNetwork(page);
    await page.goto('/extension');
    await waitForAppLoad(page);
    expect(errors).toEqual([]);
  });
});
