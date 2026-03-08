import { expect, type Page, test } from '@playwright/test';

import { blockExternalNetwork, waitForAppLoad } from './test-utils';

/**
 * Play rounds for quiz-style games (click choice → click Next → repeat).
 * Loops until the results screen appears, up to maxRounds iterations.
 */
async function playQuizRounds(page: Page, maxRounds: number) {
  for (let i = 0; i < maxRounds; i++) {
    // Click first available choice
    await page.locator('.quiz-choice').first().click();

    // Click the Next/See Results button in feedback
    const nextBtn = page.locator('.quiz-feedback .btn-primary');
    await nextBtn.click();

    // If results appeared, stop
    if (await page.locator('.game-results').isVisible()) return;
  }
}

/**
 * Play rounds for text-input games (fill input → Check → Next → repeat).
 * Works for Reading Challenge, Reverse Spelling, and Learn to Read quiz.
 */
async function playInputRounds(page: Page, maxRounds: number, answer = 'test') {
  for (let i = 0; i < maxRounds; i++) {
    // Fill the input
    const input = page.locator('.game-input');
    await input.fill(answer);

    // Click Check button
    await page.locator('.game-actions .btn-primary').click();

    // Wait for feedback to appear (check or next button now says Next/See Results)
    await page
      .locator('.game-feedback, .reverse-feedback-comparison')
      .waitFor({ state: 'visible' });

    // Click Next/See Results button
    await page.locator('.game-actions .btn-primary').click();

    // If results appeared, stop
    if (await page.locator('.game-results').isVisible()) return;
  }
}

/**
 * Play Speed Match through all rounds until results appear.
 * For each unmatched left item, systematically tries unmatched right items.
 * Tracks tried combinations by text content to avoid retrying wrong pairs.
 */
async function playSpeedMatch(page: Page) {
  const leftCol = page.locator('.speed-match-column').first();
  const rightCol = page.locator('.speed-match-column').nth(1);

  let currentLeftText = '';
  let triedRightTexts = new Set<string>();

  for (let safety = 0; safety < 200; safety++) {
    if (await page.locator('.game-results').isVisible()) return;

    const unmatchedLeft = leftCol.locator('.speed-match-word:not(.speed-match-word-matched)');
    const leftCount = await unmatchedLeft.count();

    if (leftCount === 0) {
      // All matched — wait for round transition or results
      await page.waitForTimeout(500);
      currentLeftText = '';
      triedRightTexts.clear();
      continue;
    }

    const leftText = await unmatchedLeft.first().textContent();
    if (leftText !== currentLeftText) {
      currentLeftText = leftText!;
      triedRightTexts = new Set();
    }

    await unmatchedLeft.first().click();

    // Find an untried right item
    const unmatchedRight = rightCol.locator('.speed-match-word:not(.speed-match-word-matched)');
    const rightCount = await unmatchedRight.count();
    let clicked = false;

    for (let r = 0; r < rightCount; r++) {
      const rightText = await unmatchedRight.nth(r).textContent();
      if (triedRightTexts.has(rightText!)) continue;
      triedRightTexts.add(rightText!);
      await unmatchedRight.nth(r).click();
      clicked = true;
      break;
    }

    if (!clicked) break;
    await page.waitForTimeout(400);
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Games — play to completion', () => {
  // --- Group A: Quiz games (click .quiz-choice → Next → repeat) ---
  const quizGames = [
    { name: 'Spelling Rule Quiz', rounds: 10, url: '/games/spelling-rules' },
    { name: 'Origin Detective', rounds: 10, url: '/games/origin-detective' },
    { name: 'Spell That Sound', rounds: 10, url: '/games/spell-that-sound' },
    { name: 'Rule or Exception', rounds: 10, url: '/games/rule-or-exception' },
    { name: 'Homophones Quiz', rounds: 10, url: '/games/homophones' },
    { name: 'Pattern Sort', rounds: 24, url: '/games/pattern-sort' },
  ];

  for (const game of quizGames) {
    test(`${game.name} — plays to completion`, async ({ page }) => {
      await blockExternalNetwork(page);
      await page.goto(game.url);
      await waitForAppLoad(page);

      // Start the game
      await page.locator('.game-intro .btn-primary').click();

      // Play all rounds
      await playQuizRounds(page, game.rounds);

      // Verify results screen
      await expect(page.locator('.game-results')).toBeVisible();
      await expect(page.locator('.game-overall-score')).toBeVisible();
      await expect(page.locator('.game-result-actions')).toBeVisible();
    });
  }

  // --- Group B: Text input games ---
  test('Reading Challenge — plays to completion', async ({ page }) => {
    test.setTimeout(60_000); // dictionary load + 10 timed rounds
    await blockExternalNetwork(page);
    await page.goto('/games/reading');
    await waitForAppLoad(page);

    // Start (button is disabled until reverse dictionary loads)
    await page.locator('.game-intro .btn-primary').click({ timeout: 20_000 });

    // Play 10 rounds — type "test" and check immediately to avoid timer
    await playInputRounds(page, 10);

    await expect(page.locator('.game-results')).toBeVisible();
    await expect(page.locator('.game-overall-score')).toBeVisible();
  });

  test('Reverse Spelling — plays to completion', async ({ page }) => {
    await blockExternalNetwork(page);
    await page.goto('/games/reverse');
    await waitForAppLoad(page);

    await page.locator('.game-intro .btn-primary').click();

    await playInputRounds(page, 10);

    await expect(page.locator('.game-results')).toBeVisible();
    await expect(page.locator('.game-overall-score')).toBeVisible();
  });

  // --- Group C: Speed Match ---
  test('Speed Match — plays to completion', async ({ page }) => {
    test.setTimeout(90_000); // brute-force matching across 3 rounds
    await blockExternalNetwork(page);
    await page.goto('/games/speedmatch');
    await waitForAppLoad(page);

    await page.locator('.game-intro .btn-primary').click();
    await playSpeedMatch(page);

    await expect(page.locator('.game-results')).toBeVisible();
    await expect(page.locator('.game-overall-score')).toBeVisible();
  });

  // --- Group D: Learn to Read ---
  test('Learn to Read — completes lesson quiz', async ({ page }) => {
    await blockExternalNetwork(page);
    await page.goto('/games/learn');
    await waitForAppLoad(page);

    // Click the first lesson card
    await page.locator('.learn-lesson-card').first().click();

    // Click "Take the Quiz"
    await page.locator('.learn-quiz-prompt .btn-primary').click();

    // Answer 5 quiz questions (Lesson 1 words stay the same, so "test" won't be correct
    // but the game still advances through all questions)
    for (let i = 0; i < 5; i++) {
      const input = page.locator('.game-input');
      await input.fill('test');

      // Click Check
      await page.locator('.game-actions .btn-primary').click();

      // Wait for feedback
      await page.locator('.game-feedback').waitFor({ state: 'visible' });

      // Click Next/See Results
      await page.locator('.game-feedback .btn-primary').click();
    }

    // Verify results screen
    await expect(page.locator('.game-results')).toBeVisible();
    await expect(page.locator('.game-overall-score')).toBeVisible();
  });

  // --- Group E: Daily Challenge (Wordle) ---
  test('Daily Challenge — loads and shows board', async ({ page }) => {
    test.setTimeout(60_000); // dictionary load
    await blockExternalNetwork(page);
    await page.goto('/games/daily');
    await waitForAppLoad(page);

    // Click Play
    await page.locator('.game-intro .btn-primary').click();

    // Wait for the board to appear (after dictionary loads)
    await expect(page.locator('.wordle-board')).toBeVisible({ timeout: 30_000 });

    // Verify keyboard is present
    await expect(page.locator('.wordle-keyboard')).toBeVisible();

    // Verify 6 rows of 5 tiles each
    const rows = page.locator('.wordle-row');
    await expect(rows).toHaveCount(6);
  });
});
