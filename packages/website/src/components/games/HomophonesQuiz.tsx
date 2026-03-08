import { useEffect } from 'react';
import type { QuizQuestion } from '../../data/homophone-quiz-data';
import { pickQuiz } from '../../data/homophone-quiz-data';
import { getTierLabel } from '../../games/game-utils';
import { useQuizGame } from '../../hooks/useQuizGame';
import '../../styles/homophones-quiz.css';
import { GameIntro } from './GameIntro';
import { GameProgressBar } from './GameProgressBar';
import { GameResultActions } from './GameResultActions';
import { QuizChoices } from './QuizChoices';

function getScoreLabel(pct: number): string {
  if (pct >= 90) {
    return 'Perfect ear! You know your homophones!';
  }
  if (pct >= 70) {
    return 'Great job! You understand Ingglish well!';
  }
  if (pct >= 50) {
    return 'Not bad! Homophones are tricky.';
  }
  return "Keep practicing — you'll get there!";
}

const isCorrect = (choice: string, question: QuizQuestion) =>
  question.correctAnswers.some((a) => a.toLowerCase() === choice.toLowerCase());

function HomophonesQuiz() {
  const game = useQuizGame<QuizQuestion>({
    getChoices: (q) => q.choices,
    isCorrect,
    pickQuiz,
    scoreCard: {
      filename: 'ingglish-homophones-score.png',
      footerUrl: 'ingglish.com/games/homophones',
      gameTitle: 'INGGLISH HOMOPHONES QUIZ',
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
    speak(`What English word is this? ${q.correctAnswers[0]}. ${choiceList}`);
  }, [game.phase, game.round, game.selectedChoice, game.currentQuestion, speak]);

  useEffect(() => {
    if (game.selectedChoice === null) {
      return;
    }
    const q = game.currentQuestion;
    if (!q) {
      return;
    }
    const correct = isCorrect(game.selectedChoice, q);
    const answers = q.correctAnswers.join(', ');
    const verb = q.correctAnswers.length > 1 ? 'are all' : 'is';
    if (correct) {
      speak(`Correct! ${answers} ${verb} spelled the same in Ingglish.`);
    } else {
      speak(`Not quite! The answer is ${answers}.`);
    }
  }, [game.selectedChoice, game.currentQuestion, game.round, speak]);

  if (game.phase === 'intro') {
    return (
      <div className="game-page">
        <GameIntro
          buttonLabel="Start Quiz"
          description="In Ingglish, words that sound the same are spelled the same. Can you figure out which English word an Ingglish spelling represents?"
          onStart={game.handleStart}
          rules={[
            'See an Ingglish word',
            'Pick which English word it could be',
            '10 rounds, from obvious to tricky',
          ]}
          startRef={game.startRef}
          title="Homophones Quiz"
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
            {game.results.map((r, i) => {
              const pct = r.correct ? 100 : 0;
              const fillClass = r.correct ? 'game-round-fill-good' : 'game-round-fill-bad';
              return (
                <div className="game-round-row" key={i}>
                  <span className="game-round-label">Q{i + 1}</span>
                  <div className="game-round-bar">
                    <div className={`game-round-fill ${fillClass}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="quiz-round-word">{r.question.ingglish}</span>
                  <span className="game-round-time">{r.timeTaken}s</span>
                </div>
              );
            })}
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
        <div className="label-caps game-card-label">What English word is this?</div>
        <div className="homophones-prompt">{currentQ.ingglish}</div>
      </div>

      <QuizChoices
        answered={game.answered}
        choices={currentQ.choices}
        isCorrectAnswer={(choice) => isCorrect(choice, currentQ)}
        onChoiceClick={game.handleChoiceClick}
        selectedChoice={game.selectedChoice}
      />

      {game.answered && (
        <div className="card homophones-feedback">
          {isCorrect(game.selectedChoice!, currentQ) ? (
            <div className="homophones-feedback-correct">Correct!</div>
          ) : (
            <div className="homophones-feedback-incorrect">Not quite!</div>
          )}
          <div className="homophones-feedback-all">
            <strong>{currentQ.correctAnswers.join(', ')}</strong>{' '}
            {currentQ.correctAnswers.length > 1 ? 'are all' : 'is'} spelled "{currentQ.ingglish}" in
            Ingglish.
          </div>
          <div className="game-actions">
            <button className="btn-primary" onClick={game.handleNext} ref={game.nextRef}>
              {game.round + 1 >= game.questions.length ? 'See Results' : 'Next'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomophonesQuiz;
