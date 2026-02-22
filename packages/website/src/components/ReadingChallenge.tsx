import { useState, useCallback, useRef, useEffect } from 'react';
import { loadReverseDictionary } from '@ingglish/dictionary';
import type { SentenceScore } from '../challenge/challenge-scoring';
import { scoreSentence } from '../challenge/challenge-scoring';
import { renderScoreCard } from '../challenge/render-score-card';
import type { ChallengeSentence } from '../data/challenge-data';
import { pickChallenge } from '../data/challenge-data';

type Phase = 'intro' | 'playing' | 'results';

interface RoundResult {
  score: SentenceScore;
  sentence: ChallengeSentence;
  timeTaken: number; // seconds taken for this round
}

const TIER_TIME_LIMITS: Record<1 | 2 | 3, number> = {
  1: 30,
  2: 25,
  3: 20,
};

function downloadCanvas(canvas: HTMLCanvasElement): void {
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ingglish-score.png';
  a.click();
}

function getScoreLabel(pct: number): string {
  if (pct >= 90) {
    return 'Amazing! You read Ingglish like a pro!';
  }
  if (pct >= 70) {
    return 'Great job! You picked it up quickly!';
  }
  if (pct >= 50) {
    return 'Not bad! Ingglish takes a little practice.';
  }
  return "Keep practicing — you'll get the hang of it!";
}

function getTierLabel(tier: 1 | 2 | 3): string {
  if (tier === 1) {
    return 'Easy';
  }
  if (tier === 2) {
    return 'Medium';
  }
  return 'Hard';
}

function ReadingChallenge() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [seed, setSeed] = useState(() => Date.now());
  const [sentences, setSentences] = useState<ChallengeSentence[]>([]);
  const [round, setRound] = useState(0);
  const [input, setInput] = useState('');
  const [results, setResults] = useState<RoundResult[]>([]);
  const [currentFeedback, setCurrentFeedback] = useState<null | SentenceScore>(null);
  const [reverseDictReady, setReverseDictReady] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
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

  // Load reverse dictionary on mount (needed for homophone scoring)
  useEffect(() => {
    void loadReverseDictionary().then(() => {
      setReverseDictReady(true);
    });
  }, []);

  // Auto-focus Start button once dictionary is ready
  useEffect(() => {
    if (reverseDictReady && phase === 'intro') {
      startRef.current?.focus();
    }
  }, [reverseDictReady, phase]);

  // Auto-focus Next button when feedback appears
  useEffect(() => {
    if (currentFeedback) {
      setTimeout(() => nextRef.current?.focus(), 0);
    }
  }, [currentFeedback]);

  // Auto-focus Share button on results screen
  useEffect(() => {
    if (phase === 'results') {
      setTimeout(() => shareRef.current?.focus(), 0);
    }
  }, [phase]);

  // Countdown timer — ticks every second while playing and not showing feedback
  useEffect(() => {
    if (phase !== 'playing' || currentFeedback !== null) {
      return;
    }
    if (timeLeft <= 0) {
      return;
    }
    const id = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => {
      clearInterval(id);
    };
  }, [phase, currentFeedback, timeLeft]);

  // Auto-submit when timer reaches 0
  useEffect(() => {
    if (phase !== 'playing' || currentFeedback !== null) {
      return;
    }
    if (timeLeft > 0) {
      return;
    }
    // Time's up — submit whatever is in the input (may be empty)
    const sentence = sentences[round];
    if (!sentence) {
      return;
    }
    const score = scoreSentence(sentence.tokens, input || '');
    const elapsed = TIER_TIME_LIMITS[sentence.tier];
    setCurrentFeedback(score);
    setResults((prev) => [...prev, { score, sentence, timeTaken: elapsed }]);
  }, [timeLeft, phase, currentFeedback, sentences, round, input]);

  const startChallenge = useCallback((newSeed: number) => {
    setSeed(newSeed);
    const picked = pickChallenge(newSeed);
    setSentences(picked);
    setRound(0);
    setResults([]);
    setCurrentFeedback(null);
    setInput('');
    setTimeLeft(TIER_TIME_LIMITS[picked[0]!.tier]);
    roundStartRef.current = Date.now();
    setPhase('playing');
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handleStart = useCallback(() => {
    startChallenge(seed);
  }, [startChallenge, seed]);

  const handleSubmit = useCallback(() => {
    if (!sentences[round] || !input.trim()) {
      return;
    }

    const elapsed = Math.round((Date.now() - roundStartRef.current) / 1000);
    const score = scoreSentence(sentences[round].tokens, input);
    setCurrentFeedback(score);
    setResults((prev) => [...prev, { score, sentence: sentences[round]!, timeTaken: elapsed }]);
  }, [sentences, round, input]);

  const handleNext = useCallback(() => {
    const nextRound = round + 1;
    if (nextRound >= sentences.length) {
      setPhase('results');
    } else {
      setRound(nextRound);
      setInput('');
      setCurrentFeedback(null);
      setTimeLeft(TIER_TIME_LIMITS[sentences[nextRound]!.tier]);
      roundStartRef.current = Date.now();
      // Focus input on next tick
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [round, sentences]);

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

  const handleTryAgain = useCallback(() => {
    startChallenge(seed);
  }, [startChallenge, seed]);

  const handleNewChallenge = useCallback(() => {
    startChallenge(Date.now());
  }, [startChallenge]);

  const overallScore =
    results.length > 0 ? results.reduce((sum, r) => sum + r.score.score, 0) / results.length : 0;
  const overallPct = Math.round(overallScore * 100);

  const getScoreCanvas = useCallback(
    () =>
      renderScoreCard(
        results.map((r) => ({ score: r.score.score, timeTaken: r.timeTaken })),
        overallPct
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
    canvas.toBlob((blob) => {
      if (!blob) {
        return;
      }
      navigator.clipboard
        .write([new ClipboardItem({ 'image/png': blob })])
        .then(showCopied)
        .catch(() => {
          // Clipboard image not supported — download instead
          downloadCanvas(canvas);
        });
    }, 'image/png');
  }, [getScoreCanvas, showCopied]);

  const handleSaveImage = useCallback(() => {
    const canvas = getScoreCanvas();
    downloadCanvas(canvas);
  }, [getScoreCanvas]);

  const getIngglishText = (sentence: ChallengeSentence): string =>
    sentence.tokens.map((t) => t.translated).join('');

  // --- Intro ---
  if (phase === 'intro') {
    return (
      <div className="challenge-page">
        <div className="challenge-intro">
          <h2>Reading Challenge</h2>
          <p>
            Ingglish claims you can learn to read it in 5 minutes. Let's put that to the test.
            You'll see 10 sentences written in Ingglish — type what you think the English is.
          </p>
          <ol className="challenge-rules">
            <li>Read the Ingglish sentence shown to you</li>
            <li>Type what you think it says in English before time runs out</li>
            <li>Get scored word-by-word (homophones accepted!)</li>
          </ol>
          <button
            className="btn-primary"
            disabled={!reverseDictReady}
            onClick={handleStart}
            ref={startRef}
          >
            {reverseDictReady ? 'Start Challenge' : 'Loading...'}
          </button>
        </div>
      </div>
    );
  }

  // --- Results ---
  if (phase === 'results') {
    return (
      <div className="challenge-page">
        <div className="challenge-results">
          <h2>Challenge Complete!</h2>
          <div className="challenge-overall-score">{overallPct}%</div>
          <p className="challenge-score-label">{getScoreLabel(overallPct)}</p>

          <div className="challenge-round-bars">
            {results.map((r, i) => {
              const pct = Math.round(r.score.score * 100);
              const fillClass =
                pct >= 80
                  ? 'challenge-round-fill-good'
                  : pct >= 50
                    ? 'challenge-round-fill-ok'
                    : 'challenge-round-fill-bad';
              return (
                <div className="challenge-round-row" key={i}>
                  <span className="challenge-round-label">Round {i + 1}</span>
                  <div className="challenge-round-bar">
                    <div
                      className={`challenge-round-fill ${fillClass}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="challenge-round-pct">{pct}%</span>
                  <span className="challenge-round-time">{r.timeTaken}s</span>
                </div>
              );
            })}
          </div>

          <div className="challenge-result-actions">
            <button className="btn-secondary" onClick={handleTryAgain}>
              Try Again
            </button>
            <button className="btn-secondary" onClick={handleNewChallenge}>
              New Challenge
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
  const currentSentence = sentences[round];
  if (!currentSentence) {
    return null;
  }

  const tierLabel = getTierLabel(currentSentence.tier);

  return (
    <div className="challenge-page">
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
        <span className="challenge-tier-badge">{tierLabel}</span>
      </div>

      <div className="challenge-sentence-card">
        <div className="challenge-sentence-label">Read this Ingglish sentence:</div>
        <div className="challenge-sentence-text">{getIngglishText(currentSentence)}</div>
      </div>

      <div className="challenge-input-area">
        <input
          className="challenge-input"
          disabled={currentFeedback !== null}
          onChange={(e) => {
            setInput(e.target.value);
          }}
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
    </div>
  );
}

export default ReadingChallenge;
