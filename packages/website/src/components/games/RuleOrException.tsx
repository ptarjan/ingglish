import { useState, useCallback, useRef, useEffect } from 'react';
import { renderScoreCard } from '../../challenge/render-score-card';
import type { RuleOrExceptionQuestion } from '../../data/rule-or-exception-data';
import { pickQuiz } from '../../data/rule-or-exception-data';
import { copyCanvasToClipboard, downloadCanvas } from '../../games/share-helpers';
import { useGameSpeech } from '../../hooks/useGameSpeech';
import '../../styles/spelling-rule-quiz.css';
import { SpeakerIcon, SpeakerMutedIcon } from '../Icons';

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
  const [copiedShare, setCopiedShare] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { muted, speak, stop, supported, toggleMute } = useGameSpeech();

  useEffect(
    () => () => {
      clearTimeout(copiedTimerRef.current);
    },
    []
  );
  useEffect(() => {
    if (phase === 'intro') {
      startRef.current?.focus();
    }
  }, [phase]);
  useEffect(() => {
    if (selectedChoice !== null) {
      setTimeout(() => nextRef.current?.focus(), 0);
    }
  }, [selectedChoice]);
  useEffect(() => {
    if (phase === 'results') {
      setTimeout(() => shareRef.current?.focus(), 0);
    }
  }, [phase]);

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
      if (e.key === 'm') {
        toggleMute();
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
    [selectedChoice, handleNext, handleChoiceClick, toggleMute]
  );

  // Speak question when round changes
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

  // Speak feedback when answer is selected
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

  const showCopied = useCallback(() => {
    setCopiedShare(true);
    clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => {
      setCopiedShare(false);
    }, 1500);
  }, []);

  const handleShareResult = useCallback(() => {
    copyCanvasToClipboard(getScoreCanvas(), showCopied, 'rule-or-exception-score.png');
  }, [getScoreCanvas, showCopied]);

  const handleSaveImage = useCallback(() => {
    downloadCanvas(getScoreCanvas(), 'rule-or-exception-score.png');
  }, [getScoreCanvas]);

  if (phase === 'intro') {
    return (
      <div className="game-page">
        <div className="game-intro">
          <h2>Rule or Exception?</h2>
          <p>
            English spelling has rules, but also lots of exceptions. Can you tell which is which?
          </p>
          <ol className="card game-rules">
            <li>See a word and a spelling rule</li>
            <li>Decide: does the word follow the rule, or is it an exception?</li>
            <li>10 rounds, from obvious to tricky</li>
          </ol>
          <button
            className="btn-primary"
            onClick={() => {
              startQuiz(seed);
            }}
            ref={startRef}
          >
            Start Quiz
          </button>
        </div>
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
          <div className="game-result-actions">
            <button
              className="btn-secondary"
              onClick={() => {
                startQuiz(seed);
              }}
            >
              Try Again
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                startQuiz(Date.now());
              }}
            >
              New Quiz
            </button>
            <button
              className={`btn-primary ${copiedShare ? 'btn-copied' : ''}`}
              onClick={handleShareResult}
              ref={shareRef}
            >
              {copiedShare ? 'Copied!' : 'Share Result'}
            </button>
            <button className="btn-secondary" onClick={handleSaveImage}>
              Save
            </button>
          </div>
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
      <div className="game-progress">
        <span>
          {round + 1} / {questions.length}
        </span>
        <div className="game-progress-bar">
          <div
            className="game-progress-fill"
            style={{ width: `${((round + 1) / questions.length) * 100}%` }}
          />
        </div>
        <span className="label-caps game-tier-badge">
          {currentQ.tier === 1 ? 'Easy' : currentQ.tier === 2 ? 'Medium' : 'Hard'}
        </span>
        {supported && (
          <button
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="btn-reset game-sound-toggle"
            onClick={toggleMute}
            title={muted ? 'Sound on (m)' : 'Sound off (m)'}
          >
            {muted ? <SpeakerMutedIcon /> : <SpeakerIcon />}
          </button>
        )}
      </div>

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
        <div className="quiz-feedback">
          {selectedChoice === currentQ.isException ? (
            <div className="quiz-feedback-correct">Correct!</div>
          ) : (
            <div className="quiz-feedback-incorrect">
              Not quite — it{'\u2019'}s {currentQ.isException ? 'an exception' : 'a rule follower'}!
            </div>
          )}
          <div className="quiz-explanation">{currentQ.explanation}</div>
          <div className="game-actions">
            <button className="btn-primary" onClick={handleNext} ref={nextRef}>
              {round + 1 >= questions.length ? 'See Results' : 'Next'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RuleOrException;
