import { useState, useCallback, useRef, useEffect } from 'react';
import { renderScoreCard } from '../../challenge/render-score-card';
import type { QuizQuestion } from '../../data/homophone-quiz-data';
import { pickQuiz } from '../../data/homophone-quiz-data';
import { copyCanvasToClipboard, downloadCanvas } from '../../games/share-helpers';
import { useGameSpeech } from '../../hooks/useGameSpeech';
import '../../styles/homophones-quiz.css';
import { SpeakerIcon, SpeakerMutedIcon } from '../Icons';

type Phase = 'intro' | 'playing' | 'results';

interface RoundResult {
  correct: boolean;
  question: QuizQuestion;
  selectedAnswer: string;
  timeTaken: number;
}

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

function HomophonesQuiz() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [seed, setSeed] = useState(() => Date.now());
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
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

  // Auto-focus Start button
  useEffect(() => {
    if (phase === 'intro') {
      startRef.current?.focus();
    }
  }, [phase]);

  // Auto-focus Next button when feedback appears
  useEffect(() => {
    if (selectedChoice !== null) {
      setTimeout(() => nextRef.current?.focus(), 0);
    }
  }, [selectedChoice]);

  // Auto-focus Share button on results screen
  useEffect(() => {
    if (phase === 'results') {
      setTimeout(() => shareRef.current?.focus(), 0);
    }
  }, [phase]);

  const startQuiz = useCallback(
    (newSeed: number) => {
      stop();
      setSeed(newSeed);
      const picked = pickQuiz(newSeed);
      setQuestions(picked);
      setRound(0);
      setResults([]);
      setSelectedChoice(null);
      roundStartRef.current = Date.now();
      setPhase('playing');
    },
    [stop]
  );

  const handleStart = useCallback(() => {
    startQuiz(seed);
  }, [startQuiz, seed]);

  const handleChoiceClick = useCallback(
    (choice: string) => {
      if (selectedChoice !== null) {
        return;
      } // already answered
      const question = questions[round];
      if (!question) {
        return;
      }

      const elapsed = Math.round((Date.now() - roundStartRef.current) / 1000);
      const isCorrect = question.correctAnswers.some(
        (a) => a.toLowerCase() === choice.toLowerCase()
      );

      setSelectedChoice(choice);
      setResults((prev) => [
        ...prev,
        { correct: isCorrect, question, selectedAnswer: choice, timeTaken: elapsed },
      ]);
    },
    [selectedChoice, questions, round]
  );

  const handleNext = useCallback(() => {
    const nextRound = round + 1;
    if (nextRound >= questions.length) {
      setPhase('results');
    } else {
      setRound(nextRound);
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
    speak(`What English word is this? ${q.correctAnswers[0]}. ${choiceList}`);
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
    const correct = q.correctAnswers.some((a) => a.toLowerCase() === selectedChoice.toLowerCase());
    const answers = q.correctAnswers.join(', ');
    const verb = q.correctAnswers.length > 1 ? 'are all' : 'is';
    if (correct) {
      speak(`Correct! ${answers} ${verb} spelled the same in Ingglish.`);
    } else {
      speak(`Not quite! The answer is ${answers}.`);
    }
  }, [selectedChoice, questions, round, speak]);

  const overallScore =
    results.length > 0 ? results.filter((r) => r.correct).length / results.length : 0;
  const overallPct = Math.round(overallScore * 100);

  const getScoreCanvas = useCallback(
    () =>
      renderScoreCard(
        results.map((r) => ({ score: r.correct ? 1 : 0, timeTaken: r.timeTaken })),
        overallPct,
        { footerUrl: 'ingglish.com/games/homophones', gameTitle: 'INGGLISH HOMOPHONES QUIZ' }
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
    const canvas = getScoreCanvas();
    copyCanvasToClipboard(canvas, showCopied, 'ingglish-homophones-score.png');
  }, [getScoreCanvas, showCopied]);

  const handleSaveImage = useCallback(() => {
    const canvas = getScoreCanvas();
    downloadCanvas(canvas, 'ingglish-homophones-score.png');
  }, [getScoreCanvas]);

  // --- Intro ---
  if (phase === 'intro') {
    return (
      <div className="game-page">
        <div className="game-intro">
          <h2>Homophones Quiz</h2>
          <p>
            In Ingglish, words that sound the same are spelled the same. Can you figure out which
            English word an Ingglish spelling represents?
          </p>
          <ol className="card game-rules">
            <li>See an Ingglish word</li>
            <li>Pick which English word it could be</li>
            <li>10 rounds, from obvious to tricky</li>
          </ol>
          <button className="btn-primary" onClick={handleStart} ref={startRef}>
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  // --- Results ---
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
            {results.map((r, i) => {
              const pct = r.correct ? 100 : 0;
              const fillClass = r.correct ? 'game-round-fill-good' : 'game-round-fill-bad';
              return (
                <div className="game-round-row" key={i}>
                  <span className="game-round-label">Q{i + 1}</span>
                  <div className="game-round-bar">
                    <div className={`game-round-fill ${fillClass}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="homophones-round-word">{r.question.ingglish}</span>
                  <span className="game-round-time">{r.timeTaken}s</span>
                </div>
              );
            })}
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

  // --- Playing ---
  const currentQ = questions[round];
  if (!currentQ) {
    return null;
  }

  const answered = selectedChoice !== null;
  const isCorrectAnswer = (choice: string) =>
    currentQ.correctAnswers.some((a) => a.toLowerCase() === choice.toLowerCase());

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
        <div className="label-caps game-card-label">What English word is this?</div>
        <div className="homophones-prompt">{currentQ.ingglish}</div>
      </div>

      <div className="homophones-choices">
        {currentQ.choices.map((choice) => {
          let className = 'homophones-choice';
          if (answered) {
            if (isCorrectAnswer(choice)) {
              className += ' homophones-choice-correct';
            } else if (choice === selectedChoice) {
              className += ' homophones-choice-incorrect';
            } else {
              className += ' homophones-choice-dimmed';
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
        <div className="card homophones-feedback">
          {isCorrectAnswer(selectedChoice) ? (
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
            <button className="btn-primary" onClick={handleNext} ref={nextRef}>
              {round + 1 >= questions.length ? 'See Results' : 'Next'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomophonesQuiz;
