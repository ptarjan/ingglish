import type { RuleOrExceptionQuestion } from '../../data/rule-or-exception-data';
import { pickQuiz } from '../../data/rule-or-exception-data';
import { getTierLabel, makeScoreLabel } from '../../games/game-utils';
import { useQuizGame } from '../../hooks/useQuizGame';
import { GameIntro } from './GameIntro';
import { GameProgressBar } from './GameProgressBar';
import { QuizChoices } from './QuizChoices';
import { QuizFeedback } from './QuizFeedback';
import { QuizResults } from './QuizResults';

const getScoreLabel = makeScoreLabel({
  good: 'Great instincts for English patterns!',
  great: 'You really know your spelling rules!',
  low: 'English spelling is full of surprises!',
  ok: 'English has a lot of exceptions — nice effort!',
});

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
    speakQuestion: (q) => `${q.word}. Rule: ${q.rule} ... 1. Follows Rule ... 2. Exception.`,
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

      <QuizChoices
        answered={game.answered}
        choices={['Follows Rule', 'Exception!']}
        isCorrectAnswer={(c) => (c === 'Exception!') === currentQ.isException}
        onChoiceClick={(c) => {
          game.handleChoiceClick(c === 'Exception!' ? 'true' : 'false');
        }}
        selectedChoice={
          game.selectedChoice === 'false'
            ? 'Follows Rule'
            : game.selectedChoice === 'true'
              ? 'Exception!'
              : null
        }
      />

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
