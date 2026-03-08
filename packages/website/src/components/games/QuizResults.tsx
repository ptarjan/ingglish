import type React from 'react';
import type { ReactNode } from 'react';
import type { QuizGameReturn } from '../../hooks/useQuizGame';
import { GameResultActions } from './GameResultActions';

interface QuizResultsProps<Q> {
  game: QuizGameReturn<Q>;
  getScoreLabel: (pct: number) => string;
  heading?: string;
  renderWordLabel: (question: Q) => ReactNode;
}

export function QuizResults<Q>({
  game,
  getScoreLabel,
  heading = 'Quiz Complete!',
  renderWordLabel,
}: QuizResultsProps<Q>): React.JSX.Element {
  return (
    <div className="game-page">
      <div className="game-results">
        <h2>{heading}</h2>
        <div className="game-overall-score">
          {game.correctCount}/{game.results.length}
        </div>
        <p className="game-score-label">{getScoreLabel(game.overallPct)}</p>
        <div className="game-round-bars">
          {game.results.map((r, i) => (
            <div className="game-round-row" key={i}>
              <span className="game-round-label">Q{i + 1}</span>
              <div className="game-round-bar">
                <div
                  className={`game-round-fill ${r.correct ? 'game-round-fill-good' : 'game-round-fill-bad'}`}
                  style={{ width: `${r.correct ? 100 : 0}%` }}
                />
              </div>
              <span className="quiz-round-word">{renderWordLabel(r.question)}</span>
              <span className="game-round-time">{r.timeTaken}s</span>
            </div>
          ))}
        </div>
        <GameResultActions
          copied={game.copied}
          newGameLabel="New Quiz"
          onNewGame={() => {
            game.startQuiz(Date.now());
          }}
          onSave={game.handleSave}
          onShare={game.handleShare}
          onTryAgain={() => {
            game.startQuiz(game.seed);
          }}
          shareRef={game.shareRef}
        />
      </div>
    </div>
  );
}
