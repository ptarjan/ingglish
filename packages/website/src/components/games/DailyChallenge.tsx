import { useCallback, useEffect, useRef, useState } from 'react';
import { loadReverseDictionary } from '@ingglish/dictionary';
import type { SentenceScore } from '../../challenge/challenge-scoring';
import { scoreSentence } from '../../challenge/challenge-scoring';
import { renderDailyScoreCard } from '../../challenge/render-daily-score-card';
import type { ChallengeSentence } from '../../data/challenge-data';
import {
  getSquareColor,
  getSquareEmoji,
  getTodayKey,
  msUntilNextChallenge,
  pickDailyChallenge,
} from '../../data/daily-challenge-data';
import { copyCanvasToClipboard, downloadCanvas } from '../../games/share-helpers';
import { useGameProgress } from '../../games/useGameProgress';
import '../../styles/daily-challenge.css';

interface DailyProgress {
  lastDateKey: null | string;
  roundScores: number[]; // per-round score (0-1) for today
  streak: number;
}

type Phase = 'already-done' | 'completed' | 'intro' | 'playing';

const TIER_TIME_LIMITS: Record<1 | 2 | 3, number> = { 1: 30, 2: 25, 3: 20 };

const DEFAULT_PROGRESS: DailyProgress = {
  lastDateKey: null,
  roundScores: [],
  streak: 0,
};

function DailyChallenge() {
  const { progress, update: updateProgress } = useGameProgress<DailyProgress>(
    'ingglish-games-daily',
    DEFAULT_PROGRESS
  );

  const todayKey = getTodayKey();
  const alreadyDone = progress.lastDateKey === todayKey && progress.roundScores.length > 0;

  const [phase, setPhase] = useState<Phase>(alreadyDone ? 'already-done' : 'intro');
  const [sentences, setSentences] = useState<ChallengeSentence[]>([]);
  const [round, setRound] = useState(0);
  const [input, setInput] = useState('');
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [currentFeedback, setCurrentFeedback] = useState<null | SentenceScore>(null);
  const [reverseDictReady, setReverseDictReady] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [countdown, setCountdown] = useState('');
  const roundStartRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const shareRef = useRef<HTMLButtonElement>(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(
    () => () => {
      clearTimeout(copiedTimerRef.current);
    },
    []
  );

  // Load reverse dictionary
  useEffect(() => {
    void loadReverseDictionary().then(() => {
      setReverseDictReady(true);
    });
  }, []);

  // Auto-focus start button
  useEffect(() => {
    if (reverseDictReady && phase === 'intro') {
      startRef.current?.focus();
    }
  }, [reverseDictReady, phase]);

  // Auto-focus next button after feedback
  useEffect(() => {
    if (currentFeedback) {
      setTimeout(() => nextRef.current?.focus(), 0);
    }
  }, [currentFeedback]);

  // Auto-focus share on completed/already-done
  useEffect(() => {
    if (phase === 'completed' || phase === 'already-done') {
      setTimeout(() => shareRef.current?.focus(), 0);
    }
  }, [phase]);

  // Countdown timer ticking
  useEffect(() => {
    if (phase !== 'playing' || currentFeedback !== null || timeLeft <= 0) {return;}
    const id = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => {
      clearInterval(id);
    };
  }, [phase, currentFeedback, timeLeft]);

  // Auto-submit on timer expiry
  useEffect(() => {
    if (phase !== 'playing' || currentFeedback !== null || timeLeft > 0) {return;}
    const sentence = sentences[round];
    if (!sentence) {return;}
    const score = scoreSentence(sentence.tokens, input || '');
    setCurrentFeedback(score);
    setRoundScores((prev) => [...prev, score.score]);
  }, [timeLeft, phase, currentFeedback, sentences, round, input]);

  // Next-challenge countdown (for already-done screen)
  useEffect(() => {
    if (phase !== 'already-done' && phase !== 'completed') {return;}
    const tick = () => {
      setCountdown(formatCountdown(msUntilNextChallenge()));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => {
      clearInterval(id);
    };
  }, [phase]);

  const startChallenge = useCallback(() => {
    const picked = pickDailyChallenge();
    setSentences(picked);
    setRound(0);
    setRoundScores([]);
    setCurrentFeedback(null);
    setInput('');
    setTimeLeft(TIER_TIME_LIMITS[picked[0]!.tier]);
    roundStartRef.current = Date.now();
    setPhase('playing');
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handleSubmit = useCallback(() => {
    const sentence = sentences[round];
    if (!sentence || !input.trim()) {return;}
    const score = scoreSentence(sentence.tokens, input);
    setCurrentFeedback(score);
    setRoundScores((prev) => [...prev, score.score]);
  }, [sentences, round, input]);

  const handleNext = useCallback(() => {
    const nextRound = round + 1;
    if (nextRound >= sentences.length) {
      // Challenge complete — save progress
      const scores = [...roundScores];
      const yesterdayKey = getYesterdayKey();
      const isConsecutive = progress.lastDateKey === yesterdayKey;
      updateProgress(() => ({
        lastDateKey: todayKey,
        roundScores: scores,
        streak: isConsecutive ? progress.streak + 1 : 1,
      }));
      setPhase('completed');
    } else {
      setRound(nextRound);
      setInput('');
      setCurrentFeedback(null);
      setTimeLeft(TIER_TIME_LIMITS[sentences[nextRound]!.tier]);
      roundStartRef.current = Date.now();
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [round, sentences, roundScores, progress, todayKey, updateProgress]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (currentFeedback) {
          handleNext();
        } else {
          handleSubmit();
        }
      }
    },
    [currentFeedback, handleNext, handleSubmit]
  );

  // Score data used on completed / already-done screens
  const displayScores = phase === 'already-done' ? progress.roundScores : roundScores;
  const overallScore =
    displayScores.length > 0 ? displayScores.reduce((a, b) => a + b, 0) / displayScores.length : 0;
  const overallPct = Math.round(overallScore * 100);
  const displayStreak =
    phase === 'already-done'
      ? progress.streak
      : progress.lastDateKey === getYesterdayKey()
        ? progress.streak + 1
        : 1;

  const getScoreCanvas = useCallback(
    () =>
      renderDailyScoreCard({
        dateKey: todayKey,
        overallPct,
        roundScores: displayScores,
        streak: displayStreak,
      }),
    [todayKey, overallPct, displayScores, displayStreak]
  );

  const showCopied = useCallback(() => {
    setCopiedShare(true);
    clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => { setCopiedShare(false); }, 1500);
  }, []);

  const handleShareImage = useCallback(() => {
    const canvas = getScoreCanvas();
    copyCanvasToClipboard(canvas, showCopied, 'ingglish-daily.png');
  }, [getScoreCanvas, showCopied]);

  const handleShareText = useCallback(() => {
    const emojiGrid = displayScores.map((s) => getSquareEmoji(s)).join('');
    const text = `Ingglish Daily Challenge ${todayKey}\n${emojiGrid} ${overallPct}%\ningglish.com/games/daily`;
    void navigator.clipboard.writeText(text).then(showCopied);
  }, [displayScores, todayKey, overallPct, showCopied]);

  const handleSaveImage = useCallback(() => {
    const canvas = getScoreCanvas();
    downloadCanvas(canvas, 'ingglish-daily.png');
  }, [getScoreCanvas]);

  const getIngglishText = (sentence: ChallengeSentence): string =>
    sentence.tokens.map((t) => t.translated).join('');

  // --- Already done ---
  if (phase === 'already-done' || phase === 'completed') {
    return (
      <div className="daily-page">
        <div className="daily-done">
          <h2>{phase === 'completed' ? 'Challenge Complete!' : "Today's Challenge"}</h2>
          <div className="daily-done-score">{overallPct}%</div>

          <div className="daily-squares">
            {displayScores.map((score, i) => {
              const color = getSquareColor(score);
              return (
                <div className={`daily-square daily-square-${color}`} key={i}>
                  {Math.round(score * 100)}%
                </div>
              );
            })}
          </div>

          {displayStreak > 0 && <div className="daily-streak">{displayStreak} day streak</div>}

          <div className="daily-countdown">
            <div>Next challenge in</div>
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

  // --- Intro ---
  if (phase === 'intro') {
    return (
      <div className="daily-page">
        <div className="daily-intro">
          <h2>Daily Challenge</h2>
          <p>
            A new Ingglish challenge every day! Read 5 sentences and type the English. Same puzzle
            for everyone — compare with friends using Wordle-style colored squares.
          </p>
          <ol className="challenge-rules">
            <li>Read the Ingglish sentence shown to you</li>
            <li>Type what you think it says in English before time runs out</li>
            <li>Share your colored squares with friends!</li>
          </ol>
          <button
            className="btn-primary"
            disabled={!reverseDictReady}
            onClick={startChallenge}
            ref={startRef}
          >
            Start Today's Challenge
          </button>
        </div>
      </div>
    );
  }

  // --- Playing ---
  const currentSentence = sentences[round];
  if (!currentSentence) {return null;}

  return (
    <div className="daily-page">
      <div className="challenge-progress">
        <span>
          {round + 1} / {sentences.length}
        </span>
        <div className="challenge-progress-bar">
          <div
            className="challenge-progress-fill"
            style={{ width: `${((round + 1) / sentences.length) * 100}%` }}
          />
        </div>
        {currentFeedback === null && (
          <span className={`challenge-timer${timeLeft <= 5 ? ' challenge-timer-warning' : ''}`}>
            {timeLeft}s
          </span>
        )}
      </div>

      <div className="challenge-sentence-card">
        <div className="challenge-sentence-label">Read this Ingglish sentence:</div>
        <div className="challenge-sentence-text">{getIngglishText(currentSentence)}</div>
      </div>

      <div className="challenge-input-area">
        <input
          className="challenge-input"
          disabled={currentFeedback !== null}
          onChange={(e) => { setInput(e.target.value); }}
          onKeyDown={handleKeyDown}
          placeholder="Type the English here..."
          ref={inputRef}
          type="text"
          value={input}
        />
      </div>

      <div className="challenge-actions">
        {currentFeedback === null ? (
          <button className="btn-primary" disabled={!input.trim()} onClick={handleSubmit}>
            Check
          </button>
        ) : (
          <button className="btn-primary" onClick={handleNext} ref={nextRef}>
            {round + 1 >= sentences.length ? 'See Results' : 'Next'}
          </button>
        )}
      </div>

      {currentFeedback && (
        <div className="challenge-feedback">
          <div className="challenge-feedback-score">
            {currentFeedback.correct} / {currentFeedback.total} words correct
          </div>
          <div className="challenge-feedback-words">
            {currentFeedback.words.map((w, i) => (
              <span className="challenge-word" key={i}>
                <span className="challenge-word-ingglish">{w.ingglish}</span>
                <span
                  className={`challenge-word-result ${w.correct ? (w.fuzzy === true ? 'challenge-word-fuzzy' : 'challenge-word-correct') : 'challenge-word-incorrect'}`}
                >
                  {w.actual || '—'}
                </span>
                {(w.fuzzy === true || !w.correct) && (
                  <span className="challenge-word-expected">{w.expected}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Mini squares showing completed rounds */}
      {roundScores.length > 0 && !currentFeedback && (
        <div className="daily-squares" style={{ marginTop: '1rem' }}>
          {roundScores.map((score, i) => {
            const color = getSquareColor(score);
            return (
              <div
                className={`daily-square daily-square-${color}`}
                key={i}
                style={{ fontSize: '0.65rem', height: '2rem', width: '2rem' }}
              >
                {Math.round(score * 100)}%
              </div>
            );
          })}
        </div>
      )}
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

export default DailyChallenge;
