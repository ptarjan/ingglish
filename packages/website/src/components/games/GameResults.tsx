import type { ReactNode } from 'react';

interface GameResultsProps {
  children: ReactNode;
  heading: string;
  score: ReactNode;
  scoreLabel?: string;
}

/** Shared layout wrapper for all game results screens. */
export function GameResults({ children, heading, score, scoreLabel }: GameResultsProps) {
  return (
    <div className="game-page">
      <div className="game-results">
        <h2>{heading}</h2>
        <div className="game-overall-score">{score}</div>
        {scoreLabel && <p className="game-score-label">{scoreLabel}</p>}
        {children}
      </div>
    </div>
  );
}
