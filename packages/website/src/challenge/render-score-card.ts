import { CARD_BG, CARD_MUTED, CARD_TEXT, roundRect } from './canvas-utils';

export interface RoundData {
  score: number; // 0-1
  timeTaken: number; // seconds
}

interface ScoreCardOptions {
  footerUrl?: string;
  gameTitle?: string;
}

const W = 600;
const H = 400;
const GREEN = '#22c55e';
const YELLOW = '#eab308';
const RED = '#ef4444';
const ACCENT = '#6366f1';

/**
 * Render a score card to an offscreen canvas.
 * Returns an HTMLCanvasElement ready for toBlob()/toDataURL().
 */
export function renderScoreCard(
  rounds: RoundData[],
  overallPct: number,
  options?: ScoreCardOptions
): HTMLCanvasElement {
  const gameTitle = options?.gameTitle ?? 'INGGLISH READING CHALLENGE';
  const footerUrl = options?.footerUrl ?? 'ingglish.com/games/reading';
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
  ctx.fillText(gameTitle, W / 2, 36);

  // Overall score
  ctx.fillStyle = ACCENT;
  ctx.font = '700 72px system-ui, sans-serif';
  ctx.fillText(`${overallPct}%`, W / 2, 110);

  // Divider line
  ctx.strokeStyle = '#2a2a4e';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, 130);
  ctx.lineTo(W - 60, 130);
  ctx.stroke();

  // Round bars
  const barX = 120;
  const barW = 320;
  const barH = 16;
  const startY = 152;
  const rowH = 22;

  ctx.textBaseline = 'middle';

  for (const [i, round] of rounds.entries()) {
    const y = startY + i * rowH;
    const mid = y + barH / 2;
    const pct = Math.round(round.score * 100);

    // Round label
    ctx.fillStyle = CARD_MUTED;
    ctx.font = '500 12px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${i + 1}`, barX - 16, mid);

    // Bar background
    ctx.fillStyle = '#2a2a4e';
    roundRect(ctx, barX, y, barW, barH, 3);
    ctx.fill();

    // Bar fill
    if (pct > 0) {
      ctx.fillStyle = barColor(pct);
      const fillW = Math.max(6, (pct / 100) * barW);
      roundRect(ctx, barX, y, fillW, barH, 3);
      ctx.fill();
    }

    // Percentage
    ctx.fillStyle = CARD_TEXT;
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${pct}%`, barX + barW + 36, mid);

    // Time
    ctx.fillStyle = CARD_MUTED;
    ctx.font = '400 11px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${round.timeTaken}s`, barX + barW + 70, mid);
  }

  // Footer
  ctx.fillStyle = CARD_MUTED;
  ctx.font = '400 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(footerUrl, W / 2, H - 20);

  return canvas;
}

function barColor(pct: number): string {
  return pct >= 80 ? GREEN : pct >= 50 ? YELLOW : RED;
}
