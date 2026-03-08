import type { ReactNode } from 'react';

export interface GameRoundBarRow {
  data?: ReactNode;
  fillPct: number;
  label: string;
  time?: number;
}

export function GameRoundBars({ rows }: { rows: GameRoundBarRow[] }) {
  return (
    <div className="game-round-bars">
      {rows.map((row, i) => (
        <div className="game-round-row" key={i}>
          <span className="game-round-label">{row.label}</span>
          <div className="game-round-bar">
            <div
              className={`game-round-fill ${getFillClass(row.fillPct)}`}
              style={{ width: `${row.fillPct}%` }}
            />
          </div>
          {row.data}
          {row.time !== undefined && <span className="game-round-time">{row.time}s</span>}
        </div>
      ))}
    </div>
  );
}

function getFillClass(pct: number): string {
  if (pct >= 80) {
    return 'game-round-fill-good';
  }
  if (pct >= 50) {
    return 'game-round-fill-ok';
  }
  return 'game-round-fill-bad';
}
