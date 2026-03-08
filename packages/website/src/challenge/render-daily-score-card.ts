/**
 * Canvas score card for the Ingglish Wordle Daily Challenge.
 * Renders the guess grid as colored tiles (green/yellow/gray),
 * attempt count, streak, and date.
 */

import type { LetterResult } from '../data/daily-challenge-data';
import { CARD_BG, CARD_MUTED, CARD_TEXT, roundRect } from './canvas-utils';

const W = 600;
const H = 420;
const GREEN = '#538d4e';
const YELLOW = '#b59f3b';
const GRAY = '#3a3a4c';
const TILE_SIZE = 44;
const TILE_GAP = 6;

interface WordleScoreCardOptions {
  dateKey: string;
  guessResults: LetterResult[][]; // each row is 5 LetterResults
  streak: number;
  won: boolean;
}

/** Build the emoji grid string for text sharing. */
export function buildEmojiGrid(guessResults: LetterResult[][]): string {
  return guessResults
    .map((row) => row.map((r) => (r === 'correct' ? '🟩' : r === 'present' ? '🟨' : '⬛')).join(''))
    .join('\n');
}

export function renderDailyScoreCard(options: WordleScoreCardOptions): HTMLCanvasElement {
  const { dateKey, guessResults, streak, won } = options;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = CARD_BG;
  ctx.fillRect(0, 0, W, H);

  // Title
  ctx.fillStyle = CARD_MUTED;
  ctx.font = '600 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('INGGLISH WORDLE', W / 2, 36);

  // Date
  ctx.fillStyle = CARD_MUTED;
  ctx.font = '400 13px system-ui, sans-serif';
  ctx.fillText(dateKey, W / 2, 56);

  // Attempt count
  const attemptText = won ? `${guessResults.length}/6` : 'X/6';
  ctx.fillStyle = CARD_TEXT;
  ctx.font = '700 48px system-ui, sans-serif';
  ctx.fillText(attemptText, W / 2, 108);

  // Grid of colored tiles
  const gridW = 5 * TILE_SIZE + 4 * TILE_GAP;
  const gridStartX = (W - gridW) / 2;
  const gridStartY = 130;

  for (const [row, results] of guessResults.entries()) {
    for (const [col, result] of results.entries()) {
      const x = gridStartX + col * (TILE_SIZE + TILE_GAP);
      const y = gridStartY + row * (TILE_SIZE + TILE_GAP);
      ctx.fillStyle = result === 'correct' ? GREEN : result === 'present' ? YELLOW : GRAY;
      roundRect(ctx, x, y, TILE_SIZE, TILE_SIZE, 4);
      ctx.fill();
    }
  }

  // Streak
  const streakY = gridStartY + guessResults.length * (TILE_SIZE + TILE_GAP) + 20;
  if (streak > 0) {
    ctx.fillStyle = CARD_TEXT;
    ctx.font = '600 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${streak} day streak`, W / 2, streakY);
  }

  // Footer
  ctx.fillStyle = CARD_MUTED;
  ctx.font = '400 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ingglish.com/games/daily', W / 2, H - 20);

  return canvas;
}
