import { useState, useCallback, useRef, useEffect } from 'react';
import { renderScoreCard } from '../../challenge/render-score-card';
import type { RuleOrExceptionQuestion } from '../../data/rule-or-exception-data';
import { pickQuiz } from '../../data/rule-or-exception-data';
import { getTierLabel } from '../../games/game-utils';
import { useAutoFocus } from '../../hooks/useAutoFocus';
import { useGameSpeech } from '../../hooks/useGameSpeech';
import { useShareActions } from '../../hooks/useShareActions';
import { GameIntro } from './GameIntro';
import { GameProgressBar } from './GameProgressBar';
import { GameResultActions } from './GameResultActions';
import { QuizFeedback } from './QuizFeedback';

type Phase = 'intro' | 'playing' | 'results';

interface RoundResult {
  correct: boolean;
  question: RuleOrExceptionQuestion;
  selectedAnswer: boolean;
  timeTaken: number;
}

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
  const [phase, setPhase] = useState<Phase>('intro');
  const [seed, setSeed] = useState(() => Date.now());
  const [questions, setQuestions] = useState<RuleOrExceptionQuestion[]>([]);
  const [round, setRound] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<boolean | null>(null);
  const roundStartRef = useRef(0);
  const startRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const shareRef = useRef<HTMLButtonElement>(null);
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
    },
    [stop]
  );

  const handleChoiceClick = useCallback(
    (isException: boolean) => {
      if (selectedChoice !== null) {
        return;
      }
      const question = questions[round];
      if (!question) {
        return;
      }
      const elapsed = Math.round((Date.now() - roundStartRef.current) / 1000);
      const isCorrect = isException === question.isException;
      setSelectedChoice(isException);
      setResults((prev) => [
        ...prev,
        { correct: isCorrect, question, selectedAnswer: isException, timeTaken: elapsed },
      ]);
    },
    [selectedChoice, questions, round]
  );

  const handleNext = useCallback(() => {
    if (round + 1 >= questions.length) {
      setPhase('results');
    } else {
      setRound(round + 1);
      setSelectedChoice(null);
      roundStartRef.current = Date.now();
    }
  }, [round, questions]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (handleMuteKey(e)) {
        return;
      }
      if (selectedChoice === null) {
        if (e.key === '1') {
          handleChoiceClick(false);
        } else if (e.key === '2') {
          handleChoiceClick(true);
        }
      } else if (e.key === 'Enter') {
        handleNext();
      }
    },
    [selectedChoice, handleNext, handleChoiceClick, handleMuteKey]
  );

  useEffect(() => {
    if (phase !== 'playing' || selectedChoice !== null) {
      return;
    }
    const q = questions[round];
    if (!q) {
      return;
    }
    speak(`${q.word}. Rule: ${q.rule}. 1, Follows Rule. 2, Exception.`);
  }, [phase, round, selectedChoice, questions, speak]);

  useEffect(() => {
    if (selectedChoice === null) {
      return;
    }
    const q = questions[round];
    if (!q) {
      return;
    }
    if (selectedChoice === q.isException) {
      speak(`Correct! ${q.explanation}`);
    } else {
      speak(
        `Not quite, it's ${q.isException ? 'an exception' : 'a rule follower'}. ${q.explanation}`
      );
    }
  }, [selectedChoice, questions, round, speak]);

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

  const { copied, handleSave, handleShare } = useShareActions(
    getScoreCanvas,
    'rule-or-exception-score.png'
  );

  if (phase === 'intro') {
    return (
      <div className="game-page">
        <GameIntro
          buttonLabel="Start Quiz"
          description="English spelling has rules, but also lots of exceptions. Can you tell which is which?"
          onStart={() => {
            startQuiz(seed);
          }}
          rules={[
            'See a word and a spelling rule',
            'Decide: does the word follow the rule, or is it an exception?',
            '10 rounds, from obvious to tricky',
          ]}
          startRef={startRef}
          title="Rule or Exception?"
        />
      </div>
    );
  }

  if (phase === 'results') {
    const correctCount = results.filter((r) => r.correct).length;
    return (
      <div className="game-page">
        <div className="game-results">
          <h2>Quiz Complete!</h2>
          <div className="game-overall-score">
            {correctCount}/{results.length}
          </div>
          <p className="game-score-label">{getScoreLabel(overallPct)}</p>
          <div className="game-round-bars">
            {results.map((r, i) => (
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
            copied={copied}
            newGameLabel="New Quiz"
            onNewGame={() => {
              startQuiz(Date.now());
            }}
            onSave={handleSave}
            onShare={handleShare}
            onTryAgain={() => {
              startQuiz(seed);
            }}
            shareRef={shareRef}
          />
        </div>
      </div>
    );
  }

  const currentQ = questions[round];
  if (!currentQ) {
    return null;
  }
  const answered = selectedChoice !== null;

  return (
    <div className="game-page" onKeyDown={handleKeyDown}>
      <GameProgressBar
        current={round + 1}
        muted={muted}
        onToggleMute={toggleMute}
        supported={supported}
        tierLabel={getTierLabel(currentQ.tier)}
        total={questions.length}
      />

      <div className="card game-card">
        <div className="label-caps game-card-label">Rule: {currentQ.rule}</div>
        <div className="quiz-word">{currentQ.word}</div>
      </div>

      <div className="quiz-choices">
        <button
          className={`quiz-choice${answered ? (currentQ.isException ? ' quiz-choice-incorrect' : ' quiz-choice-correct') + (!selectedChoice && answered ? '' : '') : ''}`}
          disabled={answered}
          onClick={() => {
            handleChoiceClick(false);
          }}
        >
          Follows Rule
        </button>
        <button
          className={`quiz-choice${answered ? (currentQ.isException ? ' quiz-choice-correct' : ' quiz-choice-incorrect') : ''}`}
          disabled={answered}
          onClick={() => {
            handleChoiceClick(true);
          }}
        >
          Exception!
        </button>
      </div>

      {answered && (
        <QuizFeedback
          correct={selectedChoice === currentQ.isException}
          explanation={currentQ.explanation}
          incorrectMessage={
            <>
              Not quite — it{'\u2019'}s {currentQ.isException ? 'an exception' : 'a rule follower'}!
            </>
          }
          isLast={round + 1 >= questions.length}
          nextRef={nextRef}
          onNext={handleNext}
        />
      )}
    </div>
  );
}

export default RuleOrException;
