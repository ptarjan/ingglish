import type { QuizQuestion } from '../../data/homophone-quiz-data';
import { pickQuiz } from '../../data/homophone-quiz-data';
import { getTierLabel } from '../../games/game-utils';
import { useQuizGame } from '../../hooks/useQuizGame';
import '../../styles/homophones-quiz.css';
import { GameIntro } from './GameIntro';
import { GameProgressBar } from './GameProgressBar';
import { QuizChoices } from './QuizChoices';
import { QuizResults } from './QuizResults';

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
    speakFeedback: (q, _selectedChoice, correct) => {
      const answers = q.correctAnswers.join(', ');
      const verb = q.correctAnswers.length > 1 ? 'are all' : 'is';
      return correct
        ? `Correct! ${answers} ${verb} spelled the same in Ingglish.`
        : `Not quite! The answer is ${answers}.`;
    },
    speakQuestion: (q) => {
      const choiceList = q.choices.map((c, i) => `${i + 1}, ${c}`).join('. ');
      return `What English word is this? ${q.correctAnswers[0]}. ${choiceList}`;
    },
  });

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
      <QuizResults game={game} getScoreLabel={getScoreLabel} renderWordLabel={(q) => q.ingglish} />
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
