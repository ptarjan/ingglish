/**
 * Wordle-style canvas score card for the Daily Challenge.
 * Shows 5 colored squares + overall score + streak.
 */

const W = 600;
const H = 340;
const BG = '#1a1a2e';
const TEXT = '#e8e8f0';
const MUTED = '#8888aa';
const GREEN = '#22c55e';
const YELLOW = '#eab308';
const RED = '#ef4444';
const ACCENT = '#6366f1';

interface DailyScoreCardOptions {
  dateKey: string;
  overallPct: number;
  roundScores: number[]; // 0-1 per round
  streak: number;
}

export function renderDailyScoreCard(options: DailyScoreCardOptions): HTMLCanvasElement {
  const { dateKey, overallPct, roundScores, streak } = options;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Title
  ctx.fillStyle = MUTED;
  ctx.font = '600 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('INGGLISH DAILY CHALLENGE', W / 2, 36);

  // Date
  ctx.fillStyle = MUTED;
  ctx.font = '400 13px system-ui, sans-serif';
  ctx.fillText(dateKey, W / 2, 56);

  // Overall score
  ctx.fillStyle = ACCENT;
  ctx.font = '700 64px system-ui, sans-serif';
  ctx.fillText(`${overallPct}%`, W / 2, 125);

  // Colored squares
  const squareSize = 48;
  const gap = 12;
  const totalW = roundScores.length * squareSize + (roundScores.length - 1) * gap;
  const startX = (W - totalW) / 2;
  const squareY = 150;

  for (const [i, score] of roundScores.entries()) {
    const x = startX + i * (squareSize + gap);
    ctx.fillStyle = squareColor(score);
    roundRect(ctx, x, squareY, squareSize, squareSize, 6);
    ctx.fill();

    // Percentage inside square
    ctx.fillStyle = BG;
    ctx.font = '700 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(score * 100)}`, x + squareSize / 2, squareY + squareSize / 2);
  }

  ctx.textBaseline = 'alphabetic';

  // Streak
  if (streak > 0) {
    ctx.fillStyle = TEXT;
    ctx.font = '600 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${streak} day streak`, W / 2, 240);
  }

  // Footer
  ctx.fillStyle = MUTED;
  ctx.font = '400 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ingglish.com/games/daily', W / 2, H - 20);

  return canvas;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function squareColor(score: number): string {
  return score >= 0.8 ? GREEN : score >= 0.5 ? YELLOW : RED;
}
