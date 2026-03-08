import { useState, useCallback, useRef, useEffect } from 'react';
import { renderScoreCard } from '../../challenge/render-score-card';
import type { SpellingRuleQuestion } from '../../data/spelling-rule-quiz-data';
import { pickQuiz } from '../../data/spelling-rule-quiz-data';
import { copyCanvasToClipboard, downloadCanvas } from '../../games/share-helpers';
import '../../styles/spelling-rule-quiz.css';
import { useGameSpeech } from '../../hooks/useGameSpeech';
import { SpeakerIcon, SpeakerMutedIcon } from '../Icons';

type Phase = 'intro' | 'playing' | 'results';

interface RoundResult {
  correct: boolean;
  question: SpellingRuleQuestion;
  selectedAnswer: string;
  timeTaken: number;
}

function getScoreLabel(pct: number): string {
  if (pct >= 90) {
    return 'Amazing! You really know English spelling rules!';
  }
  if (pct >= 70) {
    return 'Great job! English spelling is tricky but you handle it well.';
  }
  if (pct >= 50) {
    return 'Not bad! English spelling trips up even native speakers.';
  }
  return 'English spelling is wild — keep practicing!';
}

/**
 * Renders a word with a specific pattern highlighted.
 * Handles patterns like "a_e" (split digraph) where the underscore represents
 * the consonant(s) between the vowel and silent e.
 */
function HighlightedWord({
  pattern,
  patternStart,
  word,
}: {
  pattern: string;
  patternStart: number;
  word: string;
}) {
  // Handle split digraph patterns like "a_e", "i_e", "o_e", "u_e"
  const splitMatch = /^._(.+)$/.exec(pattern);
  if (splitMatch) {
    const lastChars = splitMatch[1]!;
    // Find the end: patternStart is where the first char is, the last char(s) are at the end of the relevant segment
    // For "cake" with pattern "a_e" and patternStart 1: highlight 'a' at index 1 and 'e' at index 3
    const endIndex = word.length; // silent E is at the end
    const lastLen = lastChars.length;
    return (
      <div className="sr-word">
        {patternStart > 0 && word.slice(0, patternStart)}
        <span className="sr-highlight">{word[patternStart]}</span>
        {word.slice(patternStart + 1, endIndex - lastLen)}
        <span className="sr-highlight">{word.slice(endIndex - lastLen)}</span>
      </div>
    );
  }

  // Normal pattern: contiguous substring
  const before = word.slice(0, patternStart);
  const highlighted = word.slice(patternStart, patternStart + pattern.length);
  const after = word.slice(patternStart + pattern.length);
  return (
    <div className="sr-word">
      {before}
      <span className="sr-highlight">{highlighted}</span>
      {after}
    </div>
  );
}

function SpellingRuleQuiz() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [seed, setSeed] = useState(() => Date.now());
  const [questions, setQuestions] = useState<SpellingRuleQuestion[]>([]);
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
      }
      const question = questions[round];
      if (!question) {
        return;
      }

      const elapsed = Math.round((Date.now() - roundStartRef.current) / 1000);
      const isCorrect = choice === question.correctSound;

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
    speak(`What sound does the highlighted pattern make in ${q.word}? ${choiceList}`);
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
    if (selectedChoice === q.correctSound) {
      speak(`Correct! ${q.explanation}`);
    } else {
      speak(`Not quite, it's ${q.correctSound}. ${q.explanation}`);
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
        { footerUrl: 'ingglish.com/games/spelling-rules', gameTitle: 'ENGLISH SPELLING RULE QUIZ' }
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
    copyCanvasToClipboard(canvas, showCopied, 'spelling-rule-quiz-score.png');
  }, [getScoreCanvas, showCopied]);

  const handleSaveImage = useCallback(() => {
    const canvas = getScoreCanvas();
    downloadCanvas(canvas, 'spelling-rule-quiz-score.png');
  }, [getScoreCanvas]);

  // --- Intro ---
  if (phase === 'intro') {
    return (
      <div className="game-page">
        <div className="game-intro">
          <h2>Spelling Rule Quiz</h2>
          <p>
            English uses the same letters for different sounds depending on word origin and context.
            Can you predict what sound a letter pattern makes?
          </p>
          <ol className="game-rules">
            <li>See a word with a highlighted spelling pattern</li>
            <li>Pick what sound that pattern makes in the word</li>
            <li>10 rounds, from common rules to tricky exceptions</li>
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
                  <span className="sr-round-word">{r.question.word}</span>
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
        <span className="game-tier-badge">
          {currentQ.tier === 1 ? 'Easy' : currentQ.tier === 2 ? 'Medium' : 'Hard'}
        </span>
        {supported && (
          <button
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="game-sound-toggle"
            onClick={toggleMute}
            title={muted ? 'Sound on (m)' : 'Sound off (m)'}
          >
            {muted ? <SpeakerMutedIcon /> : <SpeakerIcon />}
          </button>
        )}
      </div>

      <div className="game-card">
        <div className="game-card-label">What sound does the highlighted pattern make?</div>
        <HighlightedWord
          pattern={currentQ.pattern}
          patternStart={currentQ.patternStart}
          word={currentQ.word}
        />
      </div>

      <div className="sr-choices">
        {currentQ.choices.map((choice) => {
          let className = 'sr-choice';
          if (answered) {
            if (choice === currentQ.correctSound) {
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
          {selectedChoice === currentQ.correctSound ? (
            <div className="sr-feedback-correct">Correct!</div>
          ) : (
            <div className="sr-feedback-incorrect">
              Not quite — it&apos;s {currentQ.correctSound}
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

export default SpellingRuleQuiz;
