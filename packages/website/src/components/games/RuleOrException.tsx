import { useEffect } from 'react';
import type { RuleOrExceptionQuestion } from '../../data/rule-or-exception-data';
import { pickQuiz } from '../../data/rule-or-exception-data';
import { getTierLabel } from '../../games/game-utils';
import { useQuizGame } from '../../hooks/useQuizGame';
import { GameIntro } from './GameIntro';
import { GameProgressBar } from './GameProgressBar';
import { GameResultActions } from './GameResultActions';
import { QuizFeedback } from './QuizFeedback';

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
<<<<<<< HEAD
  const game = useQuizGame<RuleOrExceptionQuestion>({
    getChoices: () => ['false', 'true'],
    isCorrect: (choice, q) => (choice === 'true') === q.isException,
    pickQuiz,
    scoreCard: {
      filename: 'rule-or-exception-score.png',
      footerUrl: 'ingglish.com/games/rule-or-exception',
      gameTitle: 'RULE OR EXCEPTION?',
=======
  const [phase, setPhase] = useState<Phase>('intro');
  const [seed, setSeed] = useState(() => Date.now());
  const [questions, setQuestions] = useState<RuleOrExceptionQuestion[]>([]);
  const [round, setRound] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<boolean | null>(null);
  const roundStartRef = useRef(0);
  const startRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const { handleMuteKey, muted, speak, stop, supported, toggleMute } = useGameSpeech();

  useAutoFocus(startRef, phase === 'intro');
  useAutoFocus(nextRef, selectedChoice !== null);
  useAutoFocus(shareRef, phase === 'results');

  const startQuiz = useCallback(
    (newSeed: number) => {
      stop();
      setSeed(newSeed);
      setQuestions(pickQuiz(newSeed));
      setRound(0);
      setResults([]);
      setSelectedChoice(null);
      roundStartRef.current = Date.now();
      setPhase('playing');
>>>>>>> f900b321 (fix: sort useGameShare imports alphabetically to satisfy lint)
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
    speak(`${q.word}. Rule: ${q.rule}. 1, Follows Rule. 2, Exception.`);
  }, [game.phase, game.round, game.selectedChoice, game.currentQuestion, speak]);

  useEffect(() => {
    if (game.selectedChoice === null) {
      return;
    }
    const q = game.currentQuestion;
    if (!q) {
      return;
    }
    const correct = (game.selectedChoice === 'true') === q.isException;
    if (correct) {
      speak(`Correct! ${q.explanation}`);
    } else {
      speak(
        `Not quite, it's ${q.isException ? 'an exception' : 'a rule follower'}. ${q.explanation}`
      );
    }
  }, [game.selectedChoice, game.currentQuestion, game.round, speak]);

<<<<<<< HEAD
  if (game.phase === 'intro') {
=======
  const overallPct =
    results.length > 0
      ? Math.round((results.filter((r) => r.correct).length / results.length) * 100)
      : 0;

  const getScoreCanvas = useCallback(
    () =>
      renderScoreCard(
        results.map((r) => ({ score: r.correct ? 1 : 0, timeTaken: r.timeTaken })),
        overallPct,
        { footerUrl: 'ingglish.com/games/rule-or-exception', gameTitle: 'RULE OR EXCEPTION?' }
      ),
    [results, overallPct]
  );

  const { copied, handleSave, handleShare, shareRef } = useGameShare(
    getScoreCanvas,
    'rule-or-exception-score.png'
  );

  if (phase === 'intro') {
>>>>>>> f900b321 (fix: sort useGameShare imports alphabetically to satisfy lint)
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
