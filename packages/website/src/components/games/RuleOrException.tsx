import type { RuleOrExceptionQuestion } from '../../data/rule-or-exception-data';
import { pickQuiz } from '../../data/rule-or-exception-data';
import { getTierLabel } from '../../games/game-utils';
import { useQuizGame } from '../../hooks/useQuizGame';
import { GameIntro } from './GameIntro';
import { GameProgressBar } from './GameProgressBar';
import { QuizFeedback } from './QuizFeedback';
import { QuizResults } from './QuizResults';

function getScoreLabel(pct: number): string {
  if (pct >= 90) {
    return 'You really know your spelling rules!';
  }
  if (pct >= 70) {
    return 'Great instincts for English patterns!';
  }
  if (pct >= 50) {
    return 'English has a lot of exceptions — nice effort!';
  }
  return 'English spelling is full of surprises!';
}

function RuleOrException() {
  const game = useQuizGame<RuleOrExceptionQuestion>({
    getChoices: () => ['false', 'true'],
    isCorrect: (choice, q) => (choice === 'true') === q.isException,
    pickQuiz,
    scoreCard: {
      filename: 'rule-or-exception-score.png',
      footerUrl: 'ingglish.com/games/rule-or-exception',
      gameTitle: 'RULE OR EXCEPTION?',
    },
    speakFeedback: (q, _selectedChoice, correct) =>
      correct
        ? `Correct! ${q.explanation}`
        : `Not quite, it's ${q.isException ? 'an exception' : 'a rule follower'}. ${q.explanation}`,
    speakQuestion: (q) => `${q.word}. Rule: ${q.rule}. 1, Follows Rule. 2, Exception.`,
  });

  if (game.phase === 'intro') {
    return (
      <div className="game-page">
        <GameIntro
          buttonLabel="Start Quiz"
          description="English spelling has rules, but also lots of exceptions. Can you tell which is which?"
          onStart={game.handleStart}
          rules={[
            'See a word and a spelling rule',
            'Decide: does the word follow the rule, or is it an exception?',
            '10 rounds, from obvious to tricky',
          ]}
          startRef={game.startRef}
          title="Rule or Exception?"
        />
      </div>
    );
  }

  if (game.phase === 'results') {
    return (
      <QuizResults game={game} getScoreLabel={getScoreLabel} renderWordLabel={(q) => q.word} />
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
        <div className="label-caps game-card-label">Rule: {currentQ.rule}</div>
        <div className="quiz-word">{currentQ.word}</div>
      </div>

      <div className="quiz-choices">
        <button
          className={`quiz-choice${game.answered ? (currentQ.isException ? ' quiz-choice-incorrect' : ' quiz-choice-correct') : ''}`}
          disabled={game.answered}
          onClick={() => {
            game.handleChoiceClick('false');
          }}
        >
          Follows Rule
        </button>
        <button
          className={`quiz-choice${game.answered ? (currentQ.isException ? ' quiz-choice-correct' : ' quiz-choice-incorrect') : ''}`}
          disabled={game.answered}
          onClick={() => {
            game.handleChoiceClick('true');
          }}
        >
          Exception!
        </button>
      </div>

      {game.answered && (
        <QuizFeedback
          correct={(game.selectedChoice === 'true') === currentQ.isException}
          explanation={currentQ.explanation}
          incorrectMessage={
            <>
              Not quite — it{'\u2019'}s {currentQ.isException ? 'an exception' : 'a rule follower'}!
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

export default RuleOrException;
