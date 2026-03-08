import { useCallback, useEffect, useRef, useState } from 'react';
import { renderScoreCard } from '../../challenge/render-score-card';
import { pickMatchPairs, shuffleColumns } from '../../data/speed-match-data';
import { useGameProgress } from '../../games/useGameProgress';
import { useGameShare } from '../../games/useGameShare';
import { useStopwatch } from '../../games/useStopwatch';
import { useAutoFocus } from '../../hooks/useAutoFocus';
import { useGameSpeech } from '../../hooks/useGameSpeech';
import '../../styles/speed-match.css';
import { GameIntro } from './GameIntro';
import { GameResultActions } from './GameResultActions';

type Phase = 'intro' | 'playing' | 'results';

const ROUNDS = 3;
const PAIRS_PER_ROUND = 6;

interface RoundTime {
  roundIndex: number;
  time: number; // seconds
}

type Selection = null | { id: number; side: 'left' | 'right' };

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`;
}

function SpeedMatch() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [seed, setSeed] = useState(() => Date.now());
  const [currentRound, setCurrentRound] = useState(0);
  const [left, setLeft] = useState<{ id: number; text: string }[]>([]);
  const [right, setRight] = useState<{ id: number; text: string }[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [selection, setSelection] = useState<Selection>(null);
  const [wrongPair, setWrongPair] = useState<null | { left: number; right: number }>(null);
  const [roundTimes, setRoundTimes] = useState<RoundTime[]>([]);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const stopwatch = useStopwatch();
  const startRef = useRef<HTMLButtonElement>(null);
  const { speak } = useGameSpeech();
  const { progress, update: updateProgress } = useGameProgress<{ bestTime: null | number }>(
    'ingglish-games-speedmatch',
    { bestTime: null }
  );
  const wrongTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const roundStartRef = useRef(0);

  const totalTime = roundTimes.reduce((sum, r) => sum + r.time, 0);

  const getScoreCanvas = useCallback(
    () =>
      renderScoreCard(
        roundTimes.map((r) => ({
          // Invert time to a "score" (faster = better). Cap at 60s max for display.
          score: Math.max(0, 1 - r.time / 60),
          timeTaken: r.time,
        })),
        // Show total time as a percentage-like display (lower is better)
        totalTime,
        { footerUrl: 'ingglish.com/games/speedmatch', gameTitle: 'INGGLISH SPEED MATCH' }
      ),
    [roundTimes, totalTime]
  );

  const { copied, handleSave, handleShare, shareRef } = useGameShare(
    getScoreCanvas,
    'ingglish-speedmatch-score.png'
  );

  useAutoFocus(startRef, phase === 'intro');
  useAutoFocus(shareRef, phase === 'results');

  useEffect(
    () => () => {
      clearTimeout(wrongTimerRef.current);
    },
    []
  );

  const setupRound = useCallback((gameSeed: number, roundIndex: number) => {
    const newPairs = pickMatchPairs(gameSeed, roundIndex);
    const columns = shuffleColumns(newPairs, gameSeed + roundIndex * 100);
    setLeft(columns.left);
    setRight(columns.right);
    setMatched(new Set());
    setSelection(null);
    setWrongPair(null);
    setCurrentRound(roundIndex);
    roundStartRef.current = Date.now();
  }, []);

  const startGame = useCallback(
    (newSeed: number) => {
      setSeed(newSeed);
      setRoundTimes([]);
      setIsNewRecord(false);
      setupRound(newSeed, 0);
      stopwatch.start();
      setPhase('playing');
    },
    [setupRound, stopwatch]
  );

  // Check if all pairs are matched (round complete)
  useEffect(() => {
    if (phase !== 'playing' || matched.size < PAIRS_PER_ROUND) {
      return;
    }
    // Round complete
    const roundTime = Math.round((Date.now() - roundStartRef.current) / 1000);
    const nextRound = currentRound + 1;
    setRoundTimes((prev) => [...prev, { roundIndex: currentRound, time: roundTime }]);

    if (nextRound >= ROUNDS) {
      // Game complete
      const totalTime = stopwatch.stop();
      const prevBest = progress.bestTime ?? Infinity;
      if (totalTime < prevBest) {
        updateProgress(() => ({ bestTime: totalTime }));
        setIsNewRecord(true);
      }
      setPhase('results');
    } else {
      setupRound(seed, nextRound);
    }
  }, [
    matched,
    phase,
    currentRound,
    seed,
    setupRound,
    stopwatch,
    progress.bestTime,
    updateProgress,
  ]);

  const handleWordClick = useCallback(
    (side: 'left' | 'right', id: number) => {
      if (matched.has(id) && side === 'left' && left.some((w) => w.id === id)) {
        return;
      }
      if (wrongPair) {
        return;
      } // wait for shake animation to finish

      if (!selection) {
        // First selection
        setSelection({ id, side });
        return;
      }

      if (selection.side === side) {
        // Clicked same side — switch selection
        setSelection({ id, side });
        return;
      }

      // Attempting a match: one from each side
      const leftId = side === 'left' ? id : selection.id;
      const rightId = side === 'right' ? id : selection.id;

      if (leftId === rightId) {
        // Correct match!
        setMatched((prev) => new Set([...prev, leftId]));
        setSelection(null);
      } else {
        // Wrong match — shake
        setWrongPair({ left: leftId, right: rightId });
        setSelection(null);
        clearTimeout(wrongTimerRef.current);
        wrongTimerRef.current = setTimeout(() => {
          setWrongPair(null);
        }, 300);
      }
    },
    [selection, matched, wrongPair, left]
  );

  // Speak result when game ends
  useEffect(() => {
    if (phase === 'results') {
      speak(`All matched! Total time: ${formatTime(totalTime)}`);
    }
  }, [phase, totalTime, speak]);

  const bestTime = progress.bestTime;

  // --- Intro ---
  if (phase === 'intro') {
    return (
      <div className="game-page">
        <GameIntro
          description="Match Ingglish words to their English translations as fast as you can! Click one word from each column to make a pair. 3 rounds of 6 pairs each."
          onStart={() => {
            startGame(seed);
          }}
          rules={[
            'Click an Ingglish word on the left',
            'Click its English match on the right',
            'Match all pairs as fast as possible!',
          ]}
          startRef={startRef}
          title="Speed Match"
        >
          {bestTime !== null && (
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              Best time: {formatTime(bestTime)}
            </p>
          )}
        </GameIntro>
      </div>
    );
  }

  // --- Results ---
  if (phase === 'results') {
    return (
      <div className="game-page">
        <div className="game-results">
          <h2>All Matched!</h2>
          <div className="game-overall-score">{formatTime(totalTime)}</div>
          {isNewRecord && <div className="speed-match-record">New Record!</div>}

          <div className="game-round-bars">
            {roundTimes.map((r) => (
              <div className="game-round-row" key={r.roundIndex}>
                <span className="game-round-label">Round {r.roundIndex + 1}</span>
                <span className="speed-match-round-time">{formatTime(r.time)}</span>
              </div>
            ))}
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
  return (
    <div className="game-page">
      <div className="speed-match-header">
        <span>
          Round {currentRound + 1} / {ROUNDS}
        </span>
        <span className="speed-match-timer">{formatTime(stopwatch.elapsed)}</span>
        <span>
          {matched.size} / {PAIRS_PER_ROUND}
        </span>
      </div>

      <div className="speed-match-board">
        <div className="speed-match-column-label">Ingglish</div>
        <div className="speed-match-column-label">English</div>

        <div className="speed-match-column">
          {left.map((item) => {
            const isMatched = matched.has(item.id);
            const isSelected = selection?.side === 'left' && selection.id === item.id;
            const isWrong = wrongPair?.left === item.id;
            const cls = [
              'speed-match-word',
              isMatched ? 'speed-match-word-matched' : '',
              isSelected ? 'speed-match-word-selected' : '',
              isWrong ? 'speed-match-word-wrong' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <button
                className={cls}
                disabled={isMatched}
                key={item.id}
                onClick={() => {
                  handleWordClick('left', item.id);
                }}
              >
                {item.text}
              </button>
            );
          })}
        </div>

        <div className="speed-match-column">
          {right.map((item) => {
            const isMatched = matched.has(item.id);
            const isSelected = selection?.side === 'right' && selection.id === item.id;
            const isWrong = wrongPair?.right === item.id;
            const cls = [
              'speed-match-word',
              isMatched ? 'speed-match-word-matched' : '',
              isSelected ? 'speed-match-word-selected' : '',
              isWrong ? 'speed-match-word-wrong' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <button
                className={cls}
                disabled={isMatched}
                key={item.id}
                onClick={() => {
                  handleWordClick('right', item.id);
                }}
              >
                {item.text}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SpeedMatch;
