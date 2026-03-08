import { useState, useCallback, useRef, useEffect } from 'react';
import { renderScoreCard } from '../../challenge/render-score-card';
import type { OriginDetectiveQuestion } from '../../data/origin-detective-data';
import { pickQuiz } from '../../data/origin-detective-data';
import { copyCanvasToClipboard, downloadCanvas } from '../../games/share-helpers';
import { useGameSpeech } from '../../hooks/useGameSpeech';
import { SpeakerIcon, SpeakerMutedIcon } from '../Icons';
import '../../styles/spelling-rule-quiz.css';

type Phase = 'intro' | 'playing' | 'results';

interface RoundResult {
  correct: boolean;
  question: OriginDetectiveQuestion;
  selectedAnswer: string;
  timeTaken: number;
}

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
  const [phase, setPhase] = useState<Phase>('intro');
  const [seed, setSeed] = useState(() => Date.now());
  const [questions, setQuestions] = useState<OriginDetectiveQuestion[]>([]);
  const [round, setRound] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<null | string>(null);
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
    (choice: string) => {
      if (selectedChoice !== null) {
        return;
      }
      const question = questions[round];
      if (!question) {
        return;
      }
      const elapsed = Math.round((Date.now() - roundStartRef.current) / 1000);
      const isCorrect = choice === question.correctOrigin;
      setSelectedChoice(choice);
      setResults((prev) => [
        ...prev,
        { correct: isCorrect, question, selectedAnswer: choice, timeTaken: elapsed },
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
      if (e.key === 'm' || e.key === 'M') {
        toggleMute();
        return;
      }
      if (selectedChoice === null) {
        const choices = questions[round]?.choices;
        if (choices) {
          const idx = Number.parseInt(e.key, 10) - 1;
          if (idx >= 0 && idx < choices.length) {
            handleChoiceClick(choices[idx]!);
          }
        }
      } else if (e.key === 'Enter') {
        handleNext();
      }
    },
    [selectedChoice, handleNext, questions, round, handleChoiceClick, toggleMute]
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
    const choiceList = q.choices.map((c, i) => `${i + 1}, ${c}`).join('. ');
    speak(`${q.word}. Clue: ${q.spellingClue}. ${choiceList}`);
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
    if (selectedChoice === q.correctOrigin) {
      speak(`Correct! ${q.explanation}`);
    } else {
      speak(`Not quite, it's ${q.correctOrigin}. ${q.explanation}`);
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
        { footerUrl: 'ingglish.com/games/origin-detective', gameTitle: 'ORIGIN DETECTIVE' }
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
    copyCanvasToClipboard(getScoreCanvas(), showCopied, 'origin-detective-score.png');
  }, [getScoreCanvas, showCopied]);

  const handleSaveImage = useCallback(() => {
    downloadCanvas(getScoreCanvas(), 'origin-detective-score.png');
  }, [getScoreCanvas]);

  if (phase === 'intro') {
    return (
      <div className="game-page">
        <div className="game-intro">
          <h2>Origin Detective</h2>
          <p>
            English borrowed words from many languages, and the weird spellings are often clues to
            where a word came from. Can you guess the origin?
          </p>
          <ol className="card game-rules">
            <li>See a word and a spelling clue</li>
            <li>Guess whether it came from Germanic, French, Latin, or Greek</li>
            <li>10 rounds, from obvious to surprising</li>
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
          <h2>Case Closed!</h2>
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
                <span className="sr-round-word">{r.question.word}</span>
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
        <div className="label-caps game-card-label">Clue: {currentQ.spellingClue}</div>
        <div className="sr-word">{currentQ.word}</div>
      </div>

      <div className="sr-choices">
        {currentQ.choices.map((choice) => {
          let className = 'sr-choice';
          if (answered) {
            if (choice === currentQ.correctOrigin) {
              className += ' sr-choice-correct';
            } else if (choice === selectedChoice) {
              className += ' sr-choice-incorrect';
            } else {
              className += ' sr-choice-dimmed';
            }
          }
          return (
            <button
              className={className}
              disabled={answered}
              key={choice}
              onClick={() => {
                handleChoiceClick(choice);
              }}
            >
              {choice}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="sr-feedback">
          {selectedChoice === currentQ.correctOrigin ? (
            <div className="sr-feedback-correct">Correct!</div>
          ) : (
            <div className="sr-feedback-incorrect">
              Not quite — it{'\u2019'}s <strong>{currentQ.correctOrigin}</strong>
            </div>
          )}
          <div className="sr-explanation">{currentQ.explanation}</div>
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

export default OriginDetective;
