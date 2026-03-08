import { useCallback, useEffect, useRef, useState } from 'react';
import { loadDictionary, loadFrequencies } from '@ingglish/dictionary';
import { buildEmojiGrid, renderDailyScoreCard } from '../../challenge/render-daily-score-card';
import type { LetterResult, WordPair } from '../../data/daily-challenge-data';
import {
  buildAnswerPool,
  buildWordPool,
  checkGuess,
  getTodayKey,
  msUntilNextChallenge,
  pickDailyWord,
} from '../../data/daily-challenge-data';
import { copyCanvasToClipboard, downloadCanvas } from '../../games/share-helpers';
import { useGameProgress } from '../../games/useGameProgress';
import { useGameSpeech } from '../../hooks/useGameSpeech';
import '../../styles/daily-challenge.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DailyProgress {
  guesses: string[]; // Ingglish guesses made today
  lastDateKey: null | string;
  streak: number;
}

type Phase = 'already-done' | 'intro' | 'loading' | 'lost' | 'playing' | 'won';

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

const DEFAULT_PROGRESS: DailyProgress = {
  guesses: [],
  lastDateKey: null,
  streak: 0,
};

// Ingglish doesn't use q or x — omit from keyboard (c is needed for 'ch' digraph)
const KEYBOARD_ROWS = [
  ['w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'c', 'v', 'b', 'n', 'm', 'Backspace', 'Enter'],
];

const INGGLISH_LETTERS = new Set('abcdefghijklmnoprstuvwyz');

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function buildKeyColors(guesses: string[], results: LetterResult[][]): Map<string, LetterResult> {
  const map = new Map<string, LetterResult>();
  for (const [i, guess] of guesses.entries()) {
    const result = results[i];
    if (!result) {
      continue;
    }
    for (let j = 0; j < WORD_LENGTH; j++) {
      const letter = guess[j]!;
      const current = map.get(letter);
      const next = result[j]!;
      // Priority: correct > present > absent
      if (!current || priority(next) > priority(current)) {
        map.set(letter, next);
      }
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function DailyChallenge() {
  const { progress, update: updateProgress } = useGameProgress<DailyProgress>(
    'ingglish-games-daily-wordle',
    DEFAULT_PROGRESS
  );

  const todayKey = getTodayKey();

  // Pools & answer
  const [validWords, setValidWords] = useState<null | Set<string>>(null);
  const [answer, setAnswer] = useState<null | WordPair>(null);
  const [allResults, setAllResults] = useState<LetterResult[][]>([]);

  // Game state
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [phase, setPhase] = useState<Phase>('intro');

  // UI state
  const [toast, setToast] = useState<null | string>(null);
  const [shakeRow, setShakeRow] = useState(false);
  const [revealingRow, setRevealingRow] = useState(-1);
  const [bounceRow, setBounceRow] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [copiedShare, setCopiedShare] = useState(false);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { speak } = useGameSpeech();
  const shareRef = useRef<HTMLButtonElement>(null);

  // Cleanup timers
  useEffect(
    () => () => {
      clearTimeout(toastTimerRef.current);
      clearTimeout(copiedTimerRef.current);
    },
    []
  );

  // ------------------------------------------------------------------
  // Load word pool & determine phase
  // ------------------------------------------------------------------
  const loadGame = useCallback(async () => {
    setPhase('loading');
    await Promise.all([loadDictionary(), loadFrequencies()]);

    const pool = buildWordPool();
    const answerPool = buildAnswerPool(pool);
    const daily = pickDailyWord(answerPool);

    const wordSet = new Set(pool.map((w) => w.ingglish));
    setValidWords(wordSet);
    setAnswer(daily);

    // Check if already played today
    if (progress.lastDateKey === todayKey && progress.guesses.length > 0) {
      // Restore previous game
      const prevGuesses = progress.guesses;
      const prevResults = prevGuesses.map((g) => checkGuess(g, daily.ingglish));
      setGuesses(prevGuesses);
      setAllResults(prevResults);

      const won = prevGuesses.includes(daily.ingglish);
      setPhase('already-done');
      // If they hadn't finished (shouldn't happen normally), let them continue
      if (!won && prevGuesses.length < MAX_GUESSES) {
        setPhase('playing');
      }
    } else {
      setPhase('playing');
    }
  }, [progress, todayKey]);

  // ------------------------------------------------------------------
  // Toast helper
  // ------------------------------------------------------------------
  const showToast = useCallback((msg: string, duration = 1500) => {
    setToast(msg);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, duration);
  }, []);

  // ------------------------------------------------------------------
  // Save progress helper
  // ------------------------------------------------------------------
  const saveProgress = useCallback(
    (newGuesses: string[], isGameOver: boolean) => {
      const yesterdayKey = getYesterdayKey();
      const isConsecutive = progress.lastDateKey === yesterdayKey;
      const won = newGuesses.at(-1) === answer?.ingglish;

      updateProgress(() => ({
        guesses: newGuesses,
        lastDateKey: todayKey,
        // Only update streak when game is over
        streak: isGameOver ? (isConsecutive ? progress.streak + 1 : won ? 1 : 0) : progress.streak,
      }));
    },
    [answer, progress, todayKey, updateProgress]
  );

  // ------------------------------------------------------------------
  // Submit guess
  // ------------------------------------------------------------------
  const submitGuess = useCallback(() => {
    if (!answer || !validWords || currentInput.length !== WORD_LENGTH) {
      return;
    }

    const guess = currentInput.toLowerCase();

    if (!validWords.has(guess)) {
      showToast('Not in word list');
      setShakeRow(true);
      setTimeout(() => {
        setShakeRow(false);
      }, 500);
      return;
    }

    const result = checkGuess(guess, answer.ingglish);
    const newGuesses = [...guesses, guess];
    const newResults = [...allResults, result];

    setGuesses(newGuesses);
    setAllResults(newResults);
    setCurrentInput('');
    setRevealingRow(newGuesses.length - 1);

    const won = guess === answer.ingglish;
    const lost = !won && newGuesses.length >= MAX_GUESSES;

    // Save after every guess (so refresh preserves state)
    saveProgress(newGuesses, won || lost);

    // After reveal animation, check win/loss
    const revealDuration = WORD_LENGTH * 300 + 200;
    setTimeout(() => {
      setRevealingRow(-1);

      if (won) {
        setBounceRow(true);
        setTimeout(() => {
          setBounceRow(false);
        }, 1500);
        setPhase('won');
      } else if (lost) {
        setPhase('lost');
      }
    }, revealDuration);
  }, [answer, validWords, currentInput, guesses, allResults, showToast, saveProgress]);

  // ------------------------------------------------------------------
  // Keyboard input (physical)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (phase !== 'playing') {
      return;
    }

    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }
      if (revealingRow >= 0) {
        return;
      } // ignore input during reveal

      if (e.key === 'Enter') {
        e.preventDefault();
        submitGuess();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setCurrentInput((prev) => prev.slice(0, -1));
      } else if (/^[a-z]$/i.test(e.key) && INGGLISH_LETTERS.has(e.key.toLowerCase())) {
        e.preventDefault();
        setCurrentInput((prev) => (prev.length < WORD_LENGTH ? prev + e.key.toLowerCase() : prev));
      }
    };

    globalThis.addEventListener('keydown', handler);
    return () => {
      globalThis.removeEventListener('keydown', handler);
    };
  }, [phase, submitGuess, revealingRow]);

  // ------------------------------------------------------------------
  // On-screen keyboard handler
  // ------------------------------------------------------------------
  const handleKeyPress = useCallback(
    (key: string) => {
      if (phase !== 'playing' || revealingRow >= 0) {
        return;
      }

      if (key === 'Enter') {
        submitGuess();
      } else if (key === 'Backspace') {
        setCurrentInput((prev) => prev.slice(0, -1));
      } else {
        setCurrentInput((prev) => (prev.length < WORD_LENGTH ? prev + key : prev));
      }
    },
    [phase, submitGuess, revealingRow]
  );

  // ------------------------------------------------------------------
  // Build keyboard color state
  // ------------------------------------------------------------------
  const keyColors = buildKeyColors(guesses, allResults);

  // ------------------------------------------------------------------
  // Countdown timer
  // ------------------------------------------------------------------
  useEffect(() => {
    if (phase !== 'won' && phase !== 'lost' && phase !== 'already-done') {
      return;
    }

    const tick = () => {
      setCountdown(formatCountdown(msUntilNextChallenge()));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => {
      clearInterval(id);
    };
  }, [phase]);

  // Auto-focus share on result
  useEffect(() => {
    if (phase === 'won' || phase === 'lost' || phase === 'already-done') {
      setTimeout(() => shareRef.current?.focus(), 0);
    }
  }, [phase]);

  // Speak result when game ends
  useEffect(() => {
    if (phase === 'won') {
      speak('Well done!');
    } else if (phase === 'lost' && answer) {
      speak(`Better luck tomorrow. The word was ${answer.ingglish}`);
    }
  }, [phase, answer, speak]);

  // ------------------------------------------------------------------
  // Sharing
  // ------------------------------------------------------------------
  const displayGuesses = guesses;
  const displayResults = allResults;
  const won =
    phase === 'won' ||
    (phase === 'already-done' && answer !== null && guesses.includes(answer.ingglish));
  const displayStreak =
    phase === 'already-done'
      ? progress.streak
      : progress.lastDateKey === getYesterdayKey()
        ? progress.streak + 1
        : won
          ? 1
          : 0;

  const showCopied = useCallback(() => {
    setCopiedShare(true);
    clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => {
      setCopiedShare(false);
    }, 1500);
  }, []);

  const getScoreCanvas = useCallback(
    () =>
      renderDailyScoreCard({
        dateKey: todayKey,
        guessResults: displayResults,
        streak: displayStreak,
        won,
      }),
    [todayKey, displayResults, won, displayStreak]
  );

  const handleShareImage = useCallback(() => {
    const canvas = getScoreCanvas();
    copyCanvasToClipboard(canvas, showCopied, 'ingglish-wordle.png');
  }, [getScoreCanvas, showCopied]);

  const handleShareText = useCallback(() => {
    const emojiGrid = buildEmojiGrid(displayResults);
    const attemptText = won ? `${displayGuesses.length}/6` : 'X/6';
    const text = `Ingglish Wordle ${todayKey} ${attemptText}\n\n${emojiGrid}\n\ningglish.com/games/daily`;
    void navigator.clipboard.writeText(text).then(showCopied);
  }, [displayResults, displayGuesses, won, todayKey, showCopied]);

  const handleSaveImage = useCallback(() => {
    const canvas = getScoreCanvas();
    downloadCanvas(canvas, 'ingglish-wordle.png');
  }, [getScoreCanvas]);

  // ------------------------------------------------------------------
  // Render: Intro
  // ------------------------------------------------------------------
  if (phase === 'intro') {
    return (
      <div className="daily-page">
        <div className="daily-intro">
          <h2>Ingglish Wordle</h2>
          <p>
            Guess the 5-letter Ingglish word in 6 tries. Each guess must be a valid Ingglish word.
            After each guess, the tiles change color to show how close you are.
          </p>
          <div style={{ margin: '0 auto 1.5rem', maxWidth: '300px', textAlign: 'left' }}>
            <p style={{ marginBottom: '0.5rem' }}>
              <span
                style={{
                  background: '#538d4e',
                  borderRadius: '3px',
                  display: 'inline-block',
                  height: '24px',
                  marginRight: '0.5rem',
                  verticalAlign: 'middle',
                  width: '24px',
                }}
              />
              Green — correct letter, correct spot
            </p>
            <p style={{ marginBottom: '0.5rem' }}>
              <span
                style={{
                  background: '#b59f3b',
                  borderRadius: '3px',
                  display: 'inline-block',
                  height: '24px',
                  marginRight: '0.5rem',
                  verticalAlign: 'middle',
                  width: '24px',
                }}
              />
              Yellow — correct letter, wrong spot
            </p>
            <p>
              <span
                style={{
                  background: '#3a3a4c',
                  borderRadius: '3px',
                  display: 'inline-block',
                  height: '24px',
                  marginRight: '0.5rem',
                  verticalAlign: 'middle',
                  width: '24px',
                }}
              />
              Gray — letter not in the word
            </p>
          </div>
          <button className="btn-primary" onClick={loadGame}>
            Play
          </button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Render: Loading
  // ------------------------------------------------------------------
  if (phase === 'loading') {
    return (
      <div className="daily-page">
        <div className="daily-loading">Loading word list...</div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Render: Result (won / lost / already-done)
  // ------------------------------------------------------------------
  if (phase === 'won' || phase === 'lost' || phase === 'already-done') {
    return (
      <div className="daily-page">
        <div className="daily-done">
          <h2>
            {phase === 'won'
              ? 'Well done!'
              : phase === 'lost'
                ? 'Better luck tomorrow'
                : "Today's Wordle"}
          </h2>

          {answer && (
            <div className="daily-done-answer">
              The word was <strong>{answer.ingglish}</strong>
            </div>
          )}

          {won && <div className="daily-done-attempts">{displayGuesses.length}/6</div>}

          {/* Mini emoji grid */}
          <div style={{ lineHeight: '1.6', marginBottom: '1rem' }}>
            {displayResults.map((row, i) => (
              <div key={i}>
                {row.map((r, j) => (
                  <span key={j}>{r === 'correct' ? '🟩' : r === 'present' ? '🟨' : '⬛'}</span>
                ))}
              </div>
            ))}
          </div>

          {displayStreak > 0 && <div className="daily-streak">{displayStreak} day streak</div>}

          <div className="daily-countdown">
            <div>Next puzzle in</div>
            <div className="daily-countdown-time">{countdown}</div>
          </div>

          <div className="daily-result-actions">
            <button
              className={`btn-primary ${copiedShare ? 'btn-copied' : ''}`}
              onClick={handleShareImage}
              ref={shareRef}
            >
              {copiedShare ? 'Copied!' : 'Share Image'}
            </button>
            <button className="btn-secondary" onClick={handleShareText}>
              Share Text
            </button>
            <button className="btn-secondary" onClick={handleSaveImage}>
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Render: Playing
  // ------------------------------------------------------------------
  return (
    <div className="daily-page">
      {toast && <div className="wordle-toast">{toast}</div>}

      {/* Grid */}
      <div className="wordle-board">
        {Array.from({ length: MAX_GUESSES }, (_, rowIdx) => {
          const isGuessedRow = rowIdx < guesses.length;
          const isCurrentRow = rowIdx === guesses.length;
          const isRevealing = rowIdx === revealingRow;
          const isBouncing = bounceRow && rowIdx === guesses.length - 1;
          const letters = isGuessedRow
            ? guesses[rowIdx]!.split('')
            : isCurrentRow
              ? currentInput.padEnd(WORD_LENGTH, ' ').split('').slice(0, WORD_LENGTH)
              : Array.from({ length: WORD_LENGTH }, () => ' ');

          return (
            <div
              className={`wordle-row${isCurrentRow && shakeRow ? ' wordle-row-shake' : ''}`}
              key={rowIdx}
            >
              {letters.map((letter, colIdx) => {
                const result = isGuessedRow ? allResults[rowIdx]?.[colIdx] : undefined;
                const isRevealed = isGuessedRow && !isRevealing;
                const isFlipping = isRevealing;
                const isFilled = letter.trim() !== '';

                let className = 'wordle-tile';
                if (isFilled && !isGuessedRow) {
                  className += ' wordle-tile-filled';
                }
                if (isRevealed && result) {
                  className += ` wordle-tile-${result}`;
                }
                if (isFlipping) {
                  className += ` wordle-tile-flip wordle-tile-${result ?? 'absent'}`;
                }
                if (isBouncing) {
                  className += ' wordle-tile-bounce';
                }

                return (
                  <div
                    className={className}
                    key={colIdx}
                    style={
                      isFlipping
                        ? { animationDelay: `${colIdx * 300}ms` }
                        : isBouncing
                          ? { animationDelay: `${colIdx * 100}ms` }
                          : undefined
                    }
                  >
                    {letter.trim()}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* On-screen keyboard */}
      <div className="wordle-keyboard">
        {KEYBOARD_ROWS.map((row, i) => (
          <div className="wordle-keyboard-row" key={i}>
            {row.map((key) => {
              const color = keyColors.get(key);
              let className = 'wordle-key';
              if (key === 'Enter' || key === 'Backspace') {
                className += ' wordle-key-wide';
              }
              if (color) {
                className += ` wordle-key-${color}`;
              }

              return (
                <button
                  className={className}
                  key={key}
                  onClick={() => {
                    handleKeyPress(key);
                  }}
                  tabIndex={-1}
                >
                  {key === 'Backspace' ? '⌫' : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getYesterdayKey(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function priority(r: LetterResult): number {
  return r === 'correct' ? 3 : r === 'present' ? 2 : 1;
}

export default DailyChallenge;
