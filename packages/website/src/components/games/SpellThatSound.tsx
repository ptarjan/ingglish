import { useEffect } from 'react';
import type { SpellThatSoundQuestion } from '../../data/spell-that-sound-data';
import { pickQuiz } from '../../data/spell-that-sound-data';
import { getTierLabel } from '../../games/game-utils';
import { useQuizGame } from '../../hooks/useQuizGame';
import '../../styles/spelling-rule-quiz.css';
import { GameIntro } from './GameIntro';
import { GameProgressBar } from './GameProgressBar';
import { GameResultActions } from './GameResultActions';
import { QuizChoices } from './QuizChoices';
import { QuizFeedback } from './QuizFeedback';

function getScoreLabel(pct: number): string {
  if (pct >= 90) {
    return 'Spelling champion!';
  }
  if (pct >= 70) {
    return 'Great spelling instincts!';
  }
  if (pct >= 50) {
    return 'English spelling is tough — nice work!';
  }
  return 'English has too many ways to spell the same sound!';
}

function SpellThatSound() {
  const game = useQuizGame<SpellThatSoundQuestion>({
    getChoices: (q) => q.choices,
    isCorrect: (choice, q) => choice === q.correctSpelling,
    pickQuiz,
    scoreCard: {
      filename: 'spell-that-sound-score.png',
      footerUrl: 'ingglish.com/games/spell-that-sound',
      gameTitle: 'SPELL THAT SOUND',
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
    const choiceList = q.choices
      .map((c, i) => `${i + 1}, ${q.wordBefore}${c}${q.wordAfter}`)
      .join('. ');
    speak(`Fill in the ${q.soundDescription}. ${q.wordBefore} blank ${q.wordAfter}. ${choiceList}`);
  }, [game.phase, game.round, game.selectedChoice, game.currentQuestion, speak]);

  useEffect(() => {
    if (game.selectedChoice === null) {
      return;
    }
    const q = game.currentQuestion;
    if (!q) {
      return;
    }
    if (game.selectedChoice === q.correctSpelling) {
      speak(`Correct! ${q.explanation}`);
    } else {
      speak(`Not quite, it's ${q.correctSpelling}. ${q.explanation}`);
    }
  }, [game.selectedChoice, game.currentQuestion, game.round, speak]);

  if (game.phase === 'intro') {
    return (
      <div className="game-page">
        <GameIntro
          buttonLabel="Start Quiz"
          description="English has multiple ways to spell the same sound. Can you pick the right spelling for each word?"
          onStart={game.handleStart}
          rules={[
            'See a sound and a word with a missing spelling',
            'Pick the correct letters to complete the word',
            '10 rounds, from common patterns to tricky ones',
          ]}
          startRef={game.startRef}
          title="Spell That Sound"
        />
      </div>
    );
  }

  if (game.phase === 'results') {
    return (
      <div className="game-page">
        <div className="game-results">
          <h2>Quiz Complete!</h2>
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
                <span className="quiz-round-word">
                  {r.question.wordBefore}_{r.question.wordAfter}
                </span>
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
        <div className="label-caps game-card-label">Fill in the {currentQ.soundDescription}</div>
        <div className="quiz-word">
          {currentQ.wordBefore}
          <span className="sr-highlight">{game.answered ? currentQ.correctSpelling : '___'}</span>
          {currentQ.wordAfter}
        </div>
      </div>

      <QuizChoices
        answered={game.answered}
        choices={currentQ.choices}
        isCorrectAnswer={(choice) => choice === currentQ.correctSpelling}
        onChoiceClick={game.handleChoiceClick}
        renderContent={(choice) => (
          <>
            {currentQ.wordBefore}
            <strong>{choice}</strong>
            {currentQ.wordAfter}
          </>
        )}
        selectedChoice={game.selectedChoice}
      />

      {game.answered && (
        <QuizFeedback
          correct={game.selectedChoice === currentQ.correctSpelling}
          explanation={currentQ.explanation}
          incorrectMessage={
            <>
              Not quite — it{'\u2019'}s <strong>{currentQ.correctSpelling}</strong>
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

export default SpellThatSound;
