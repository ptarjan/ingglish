import type { ReactNode } from 'react';
import type { QuizGameReturn } from '../../hooks/useQuizGame';
import { GameResultActions } from './GameResultActions';
import { GameResults } from './GameResults';
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
    <GameResults
      heading={heading}
      score={
        <>
          {game.correctCount}/{game.results.length}
        </>
      }
      scoreLabel={getScoreLabel(game.overallPct)}
    >
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
    </GameResults>
  );
}
