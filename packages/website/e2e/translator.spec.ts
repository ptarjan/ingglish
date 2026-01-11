import { test, expect } from '@playwright/test';
import { blockExternalNetwork } from './test-utils';

test.describe('Text Translator', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternalNetwork(page);
    await page.goto('/', { waitUntil: 'networkidle' });
    // Wait for dictionary to load
    await expect(page.locator('.header h1')).toBeVisible();
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
    await page.goto('/', { waitUntil: 'networkidle' });
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
    await blockExternalNetwork(page);
    await page.goto('/', { waitUntil: 'networkidle' });
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
