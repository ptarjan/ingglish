import type { OriginDetectiveQuestion } from '../../data/origin-detective-data';
import { pickQuiz } from '../../data/origin-detective-data';
import { getTierLabel, makeScoreLabel } from '../../games/game-utils';
import { useQuizGame } from '../../hooks/useQuizGame';
import { GameIntro } from './GameIntro';
import { GameProgressBar } from './GameProgressBar';
import { QuizChoices } from './QuizChoices';
import { QuizFeedback } from './QuizFeedback';
import { QuizResults } from './QuizResults';

const getScoreLabel = makeScoreLabel({
  good: 'Great instincts for word origins!',
  great: 'True etymology detective!',
  low: 'English borrowed from everywhere!',
  ok: 'Word origins are fascinating but tricky!',
});

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
    speakFeedback: (q, selectedChoice, _correct) =>
      selectedChoice === q.correctOrigin
        ? `Correct! ${q.explanation}`
        : `Not quite, it's ${q.correctOrigin}. ${q.explanation}`,
    speakQuestion: (q) => {
      const choiceList = q.choices.map((c, i) => `${i + 1}. ${c}`).join(' ... ');
      return `${q.word} ... Clue: ${q.spellingClue} ... ${choiceList}`;
    },
  });

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
      <QuizResults
        game={game}
        getScoreLabel={getScoreLabel}
        heading="Case Closed!"
        renderWordLabel={(q) => q.word}
      />
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
