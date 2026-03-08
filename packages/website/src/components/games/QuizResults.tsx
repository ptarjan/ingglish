import type { ReactNode } from 'react';
import type { QuizGameReturn } from '../../hooks/useQuizGame';
import { GameResultActions } from './GameResultActions';
import { GameRoundBars } from './GameRoundBars';

interface QuizResultsProps<Q> {
  game: QuizGameReturn<Q>;
  getScoreLabel: (pct: number) => string;
  heading?: string;
  newGameLabel?: string;
  renderWordLabel: (question: Q) => ReactNode;
}

export function QuizResults<Q>({
  game,
  getScoreLabel,
  heading = 'Quiz Complete!',
  newGameLabel = 'New Quiz',
  renderWordLabel,
}: QuizResultsProps<Q>): ReactNode {
  return (
    <div className="game-page">
      <div className="game-results">
        <h2>{heading}</h2>
        <div className="game-overall-score">
          {game.correctCount}/{game.results.length}
        </div>
        <p className="game-score-label">{getScoreLabel(game.overallPct)}</p>

        <GameRoundBars
          rows={game.results.map((r, i) => ({
            data: <span className="quiz-round-word">{renderWordLabel(r.question)}</span>,
            fillPct: r.correct ? 100 : 0,
            label: `Q${i + 1}`,
            time: r.timeTaken,
          }))}
        />

        <GameResultActions
          copied={game.copied}
          newGameLabel={newGameLabel}
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
