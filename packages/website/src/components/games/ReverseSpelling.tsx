import { useCallback, useEffect, useRef, useState } from 'react';
import { isCloseEnough } from '../../challenge/challenge-scoring';
import { renderScoreCard } from '../../challenge/render-score-card';
import type { ReverseWord } from '../../data/reverse-spelling-data';
import { pickReverseSpelling } from '../../data/reverse-spelling-data';
import { getTierLabel } from '../../games/game-utils';
import { useGameShare } from '../../games/useGameShare';
import { useAutoFocus } from '../../hooks/useAutoFocus';
import { useGameSpeech } from '../../hooks/useGameSpeech';
import { GameIntro } from './GameIntro';
import { GameProgressBar } from './GameProgressBar';
import { GameResultActions } from './GameResultActions';

import '../../styles/reverse-spelling.css';

type Phase = 'intro' | 'playing' | 'results';

interface RoundResult {
  /** 0 | 0.5 | 1 */
  score: number;
  timeTaken: number;
  word: ReverseWord;
}

const TIER_TIME_LIMITS: Record<1 | 2 | 3, number> = { 1: 30, 2: 25, 3: 20 };

function getScoreLabel(pct: number): string {
  if (pct >= 90) {
    return 'Amazing! You know Ingglish spelling inside-out!';
  }
  if (pct >= 70) {
    return 'Great job! You have a solid grasp of the rules!';
  }
  if (pct >= 50) {
    return 'Not bad! Phonetic spelling takes practice.';
  }
  return "Keep at it — you'll internalize the patterns!";
}

function ReverseSpelling() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [seed, setSeed] = useState(() => Date.now());
  const [words, setWords] = useState<ReverseWord[]>([]);
  const [round, setRound] = useState(0);
  const [input, setInput] = useState('');
  const [results, setResults] = useState<RoundResult[]>([]);
  const [currentResult, setCurrentResult] = useState<null | RoundResult>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const roundStartRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const { handleMuteKey, muted, speak, stop, supported, toggleMute } = useGameSpeech();

  const overallScore =
    results.length > 0 ? results.reduce((sum, r) => sum + r.score, 0) / results.length : 0;
  const overallPct = Math.round(overallScore * 100);

  const getScoreCanvas = useCallback(
    () =>
      renderScoreCard(
        results.map((r) => ({ score: r.score, timeTaken: r.timeTaken })),
        overallPct,
        { footerUrl: 'ingglish.com/games/reverse', gameTitle: 'INGGLISH REVERSE SPELLING' }
      ),
    [results, overallPct]
  );

  const { copied, handleSave, handleShare, shareRef } = useGameShare(
    getScoreCanvas,
    'ingglish-reverse-score.png'
  );

  useAutoFocus(startRef, phase === 'intro');
  useAutoFocus(nextRef, currentResult !== null);
  useAutoFocus(shareRef, phase === 'results');

  // Countdown timer
  useEffect(() => {
    if (phase !== 'playing' || currentResult !== null || timeLeft <= 0) {
      return;
    }
    const id = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => {
      clearInterval(id);
    };
  }, [phase, currentResult, timeLeft]);

  // Auto-submit on timer expiry
  useEffect(() => {
    if (phase !== 'playing' || currentResult !== null || timeLeft > 0) {
      return;
    }
    const word = words[round];
    if (!word) {
      return;
    }
    const score = scoreAnswer('', word.ingglish);
    const elapsed = TIER_TIME_LIMITS[word.tier];
    const result: RoundResult = { score, timeTaken: elapsed, word };
    setCurrentResult(result);
    setResults((prev) => [...prev, result]);
  }, [timeLeft, phase, currentResult, words, round]);

  const startGame = useCallback(
    (newSeed: number) => {
      stop();
      setSeed(newSeed);
      const picked = pickReverseSpelling(newSeed);
      setWords(picked);
      setRound(0);
      setResults([]);
      setCurrentResult(null);
      setInput('');
      setTimeLeft(TIER_TIME_LIMITS[picked[0]!.tier]);
      roundStartRef.current = Date.now();
      setPhase('playing');
      setTimeout(() => inputRef.current?.focus(), 0);
    },
    [stop]
  );

  const handleSubmit = useCallback(() => {
    const word = words[round];
    if (!word || !input.trim()) {
      return;
    }
    const elapsed = Math.round((Date.now() - roundStartRef.current) / 1000);
    const score = scoreAnswer(input.trim(), word.ingglish);
    const result: RoundResult = { score, timeTaken: elapsed, word };
    setCurrentResult(result);
    setResults((prev) => [...prev, result]);
  }, [words, round, input]);

  const handleNext = useCallback(() => {
    const nextRound = round + 1;
    if (nextRound >= words.length) {
      setPhase('results');
    } else {
      setRound(nextRound);
      setInput('');
      setCurrentResult(null);
      setTimeLeft(TIER_TIME_LIMITS[words[nextRound]!.tier]);
      roundStartRef.current = Date.now();
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [round, words]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (handleMuteKey(e)) {
        return;
      }
      if (e.key === 'Enter') {
        if (currentResult) {
          handleNext();
        } else {
          handleSubmit();
        }
      }
    },
    [currentResult, handleNext, handleSubmit, handleMuteKey]
  );

  // Speak English word when round changes
  useEffect(() => {
    if (phase !== 'playing' || currentResult !== null) {
      return;
    }
    const w = words[round];
    if (!w) {
      return;
    }
    speak(`Spell this word in Ingglish: ${w.english}`);
  }, [phase, round, currentResult, words, speak]);

  // Speak feedback when result appears
  useEffect(() => {
    if (!currentResult) {
      return;
    }
    if (currentResult.score === 1) {
      speak('Correct!');
    } else {
      speak(`Not quite. The correct spelling is shown on screen.`);
    }
  }, [currentResult, speak]);

  // --- Intro ---
  if (phase === 'intro') {
    return (
      <div className="game-page">
        <GameIntro
          description="Can you spell in Ingglish? You'll see an English word — type how it would look in phonetic Ingglish spelling. Close misspellings get partial credit!"
          onStart={() => {
            startGame(seed);
          }}
          rules={[
            'See an English word displayed on screen',
            'Type the Ingglish spelling before time runs out',
            'Exact match = full credit, close = half credit',
          ]}
          startRef={startRef}
          title="Reverse Spelling"
        />
      </div>
    );
  }

  // --- Results ---
  if (phase === 'results') {
    return (
      <div className="game-page">
        <div className="game-results">
          <h2>Challenge Complete!</h2>
          <div className="game-overall-score">{overallPct}%</div>
          <p className="game-score-label">{getScoreLabel(overallPct)}</p>

          <div className="game-round-bars">
            {results.map((r, i) => {
              const pct = Math.round(r.score * 100);
              const fillClass =
                pct >= 80
                  ? 'game-round-fill-good'
                  : pct >= 50
                    ? 'game-round-fill-ok'
                    : 'game-round-fill-bad';
              return (
                <div className="game-round-row" key={i}>
                  <span className="game-round-label">{r.word.english}</span>
                  <div className="game-round-bar">
                    <div className={`game-round-fill ${fillClass}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="game-round-pct">{pct}%</span>
                  <span className="game-round-time">{r.timeTaken}s</span>
                </div>
              );
            })}
          </div>

          <GameResultActions
            copied={copied}
            newGameLabel="New Words"
            onNewGame={() => {
              startGame(Date.now());
            }}
            onSave={handleSave}
            onShare={handleShare}
            onTryAgain={() => {
              startGame(seed);
            }}
            shareRef={shareRef}
          />
        </div>
      </div>
    );
  }

  // --- Playing ---
  const currentWord = words[round];
  if (!currentWord) {
    return null;
  }

  const feedbackClass = currentResult
    ? currentResult.score === 1
      ? 'reverse-feedback-correct'
      : currentResult.score === 0.5
        ? 'reverse-feedback-fuzzy'
        : 'reverse-feedback-incorrect'
    : '';

  return (
    <div className="game-page">
      <GameProgressBar
        current={round + 1}
        muted={muted}
        onToggleMute={toggleMute}
        supported={supported}
        tierLabel={getTierLabel(currentWord.tier)}
        timer={
          currentResult === null ? (
            <span className={`game-timer${timeLeft <= 5 ? ' game-timer-warning' : ''}`}>
              {timeLeft}s
            </span>
          ) : undefined
        }
        total={words.length}
      />

      <div className="card reverse-prompt">
        <div className="label-caps reverse-prompt-label">Spell this word in Ingglish:</div>
        <div className="reverse-prompt-word">{currentWord.english}</div>
      </div>

      <div className="game-input-area">
        <input
          className="game-input"
          disabled={currentResult !== null}
          onChange={(e) => {
            setInput(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type the Ingglish spelling..."
          ref={inputRef}
          type="text"
          value={input}
        />
      </div>

      <div className="game-actions">
        {currentResult === null ? (
          <button className="btn-primary" disabled={!input.trim()} onClick={handleSubmit}>
            Check
          </button>
        ) : (
          <button className="btn-primary" onClick={handleNext} ref={nextRef}>
            {round + 1 >= words.length ? 'See Results' : 'Next'}
          </button>
        )}
      </div>

      {currentResult && (
        <div className="card reverse-feedback-comparison">
          <div className="reverse-feedback-item">
            <div className="reverse-feedback-label">Your answer</div>
            <div className={`reverse-feedback-word ${feedbackClass}`}>{input.trim() || '—'}</div>
          </div>
          <div className="reverse-feedback-item">
            <div className="reverse-feedback-label">Correct</div>
            <div className="reverse-feedback-word">{currentWord.ingglish}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Score the user's typed Ingglish against the expected translation.
 * exact = 1.0, close enough = 0.5, wrong = 0
 */
function scoreAnswer(userInput: string, expected: string): number {
  if (!userInput) {
    return 0;
  }
  const actual = userInput.toLowerCase();
  const exp = expected.toLowerCase();
  if (actual === exp) {
    return 1;
  }
  if (isCloseEnough(actual, exp)) {
    return 0.5;
  }
  return 0;
}

export default ReverseSpelling;
