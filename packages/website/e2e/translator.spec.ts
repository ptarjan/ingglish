import { test, expect } from '@playwright/test';

test.describe('Text Translator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for dictionary to load
    await expect(page.locator('.header h1')).toBeVisible();
  });

  test('displays header with logo and title', async ({ page }) => {
    await expect(page.locator('.logo')).toBeVisible();
    await expect(page.locator('.header h1')).toHaveText('Ingglish');
  });

  test('translates text when typed', async ({ page }) => {
    const input = page.locator('.text-input');
    const output = page.locator('.text-output');

    await input.fill('hello');
    await expect(output).toContainText('hulo');
  });

  test('preserves capitalization', async ({ page }) => {
    const input = page.locator('.text-input');
    const output = page.locator('.text-output');

    await input.fill('Hello');
    await expect(output).toContainText('Hulo');
  });

  test('handles sample text button', async ({ page }) => {
    await page.click('button:has-text("Sample")');
    const input = page.locator('.text-input');
    await expect(input).not.toBeEmpty();
  });

  test('clears text with clear button', async ({ page }) => {
    const input = page.locator('.text-input');
    await input.fill('test');
    await page.click('button:has-text("Clear")');
    await expect(input).toBeEmpty();
  });
});

test.describe('Tab Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.header h1')).toBeVisible();
  });

  test('switches to URL translator tab', async ({ page }) => {
    await page.click('.tab:has-text("Translate URL")');
    await expect(page.locator('.url-translator')).toBeVisible();
  });

  test('switches to spelling guide tab', async ({ page }) => {
    await page.click('.tab:has-text("Spelling Guide")');
    await expect(page.locator('.spelling-guide')).toBeVisible();
  });

  test('subtitle link opens spelling guide', async ({ page }) => {
    await page.click('.subtitle-link');
    await expect(page.locator('.spelling-guide')).toBeVisible();
  });
});

test.describe('Spelling Guide', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.header h1')).toBeVisible();
    await page.click('.tab:has-text("Spelling Guide")');
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
