import { useEffect } from 'react';
import type { OriginDetectiveQuestion } from '../../data/origin-detective-data';
import { pickQuiz } from '../../data/origin-detective-data';
import { getTierLabel } from '../../games/game-utils';
import { useQuizGame } from '../../hooks/useQuizGame';
import { GameIntro } from './GameIntro';
import { GameProgressBar } from './GameProgressBar';
import { GameResultActions } from './GameResultActions';
import { QuizChoices } from './QuizChoices';
import { QuizFeedback } from './QuizFeedback';

function getScoreLabel(pct: number): string {
  if (pct >= 90) {
    return 'True etymology detective!';
  }
  if (pct >= 70) {
    return 'Great instincts for word origins!';
  }
  if (pct >= 50) {
    return 'Word origins are fascinating but tricky!';
  }
  return 'English borrowed from everywhere!';
}

function OriginDetective() {
  const game = useQuizGame<OriginDetectiveQuestion>({
    getChoices: (q) => q.choices,
    isCorrect: (choice, q) => choice === q.correctOrigin,
    pickQuiz,
    scoreCard: {
      filename: 'origin-detective-score.png',
      footerUrl: 'ingglish.com/games/origin-detective',
      gameTitle: 'ORIGIN DETECTIVE',
    },
  });

  const { speak } = game.speech;

  useEffect(() => {
    if (game.phase !== 'playing' || game.selectedChoice !== null) {
      return;
    }
    const q = game.currentQuestion;
    if (!q) {
      return;
    }
    const choiceList = q.choices.map((c, i) => `${i + 1}, ${c}`).join('. ');
    speak(`${q.word}. Clue: ${q.spellingClue}. ${choiceList}`);
  }, [game.phase, game.round, game.selectedChoice, game.currentQuestion, speak]);

  useEffect(() => {
    if (game.selectedChoice === null) {
      return;
    }
    const q = game.currentQuestion;
    if (!q) {
      return;
    }
    if (game.selectedChoice === q.correctOrigin) {
      speak(`Correct! ${q.explanation}`);
    } else {
      speak(`Not quite, it's ${q.correctOrigin}. ${q.explanation}`);
    }
  }, [game.selectedChoice, game.currentQuestion, game.round, speak]);

  if (game.phase === 'intro') {
    return (
      <div className="game-page">
        <GameIntro
          buttonLabel="Start Quiz"
          description="English borrowed words from many languages, and the weird spellings are often clues to where a word came from. Can you guess the origin?"
          onStart={game.handleStart}
          rules={[
            'See a word and a spelling clue',
            'Guess whether it came from Germanic, French, Latin, or Greek',
            '10 rounds, from obvious to surprising',
          ]}
          startRef={game.startRef}
          title="Origin Detective"
        />
      </div>
    );
  }

  if (game.phase === 'results') {
    return (
      <div className="game-page">
        <div className="game-results">
          <h2>Case Closed!</h2>
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
                <span className="quiz-round-word">{r.question.word}</span>
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

  const currentQ = game.currentQuestion;
  if (!currentQ) {
    return null;
  }

  return (
    <div className="game-page" onKeyDown={game.handleKeyDown}>
      <GameProgressBar
        current={game.round + 1}
        muted={game.speech.muted}
        onToggleMute={game.speech.toggleMute}
        supported={game.speech.supported}
        tierLabel={getTierLabel(currentQ.tier)}
        total={game.questions.length}
      />

      <div className="card game-card">
        <div className="label-caps game-card-label">Clue: {currentQ.spellingClue}</div>
        <div className="quiz-word">{currentQ.word}</div>
      </div>

      <QuizChoices
        answered={game.answered}
        choices={currentQ.choices}
        isCorrectAnswer={(choice) => choice === currentQ.correctOrigin}
        onChoiceClick={game.handleChoiceClick}
        selectedChoice={game.selectedChoice}
      />

      {game.answered && (
        <QuizFeedback
          correct={game.selectedChoice === currentQ.correctOrigin}
          explanation={currentQ.explanation}
          incorrectMessage={
            <>
              Not quite — it{'\u2019'}s <strong>{currentQ.correctOrigin}</strong>
            </>
          }
          isLast={game.round + 1 >= game.questions.length}
          nextRef={game.nextRef}
          onNext={game.handleNext}
        />
      )}
    </div>
  );
}

export default OriginDetective;
