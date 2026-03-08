import { useState, useCallback, useRef, useEffect } from 'react';
import { loadReverseDictionary } from '@ingglish/dictionary';
import type { SentenceScore } from '../../challenge/challenge-scoring';
import { scoreSentence } from '../../challenge/challenge-scoring';
import { renderScoreCard } from '../../challenge/render-score-card';
import type { ChallengeSentence } from '../../data/challenge-data';
import { pickChallenge } from '../../data/challenge-data';
import { getTierLabel } from '../../games/game-utils';
import { useGameShare } from '../../games/useGameShare';
import { useAutoFocus } from '../../hooks/useAutoFocus';
import { useGameSpeech } from '../../hooks/useGameSpeech';
import { GameIntro } from './GameIntro';
import { GameProgressBar } from './GameProgressBar';
import { GameResultActions } from './GameResultActions';
import { GameRoundBars } from './GameRoundBars';

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
  const { handleMuteKey, muted, speak, stop, supported, toggleMute } = useGameSpeech();

  const overallScore =
    results.length > 0 ? results.reduce((sum, r) => sum + r.score.score, 0) / results.length : 0;
  const overallPct = Math.round(overallScore * 100);

  const getScoreCanvas = useCallback(
    () =>
      renderScoreCard(
        results.map((r) => ({ score: r.score.score, timeTaken: r.timeTaken })),
        overallPct,
        { footerUrl: 'ingglish.com/games/reading', gameTitle: 'INGGLISH READING CHALLENGE' }
      ),
    [results, overallPct]
  );

  const { copied, handleSave, handleShare, shareRef } = useGameShare(
    getScoreCanvas,
    'ingglish-reading-score.png'
  );

  useAutoFocus(startRef, reverseDictReady && phase === 'intro');
  useAutoFocus(nextRef, currentFeedback !== null);
  useAutoFocus(shareRef, phase === 'results');

  // Load reverse dictionary on mount (needed for homophone scoring)
  useEffect(() => {
    void loadReverseDictionary().then(() => {
      setReverseDictReady(true);
    });
  }, []);

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

  const startChallenge = useCallback(
    (newSeed: number) => {
      stop();
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
    },
    [stop]
  );

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
      if (handleMuteKey(e)) {
        return;
      }
      if (e.key === 'Enter') {
        if (currentFeedback) {
          handleNext();
        } else {
          handleSubmit();
        }
      }
    },
    [currentFeedback, handleNext, handleSubmit, handleMuteKey]
  );

  // Speak Ingglish sentence when round changes
  useEffect(() => {
    if (phase !== 'playing' || currentFeedback !== null) {
      return;
    }
    const s = sentences[round];
    if (!s) {
      return;
    }
    speak(s.english);
  }, [phase, round, currentFeedback, sentences, speak]);

  // Speak feedback when answer is checked
  useEffect(() => {
    if (!currentFeedback) {
      return;
    }
    speak(`${currentFeedback.correct} of ${currentFeedback.total} words correct`);
  }, [currentFeedback, speak]);

  const getIngglishText = (sentence: ChallengeSentence): string =>
    sentence.tokens.map((t) => t.translated).join('');

  // --- Intro ---
  if (phase === 'intro') {
    return (
      <div className="game-page">
        <GameIntro
          buttonLabel="Start Challenge"
          description="Ingglish claims you can learn to read it in 5 minutes. Let's put that to the test. You'll see 10 sentences written in Ingglish — type what you think the English is."
          disabled={!reverseDictReady}
          onStart={() => {
            startChallenge(seed);
          }}
          rules={[
            'Read the Ingglish sentence shown to you',
            'Type what you think it says in English before time runs out',
            'Get scored word-by-word (homophones accepted!)',
          ]}
          startRef={startRef}
          title="Reading Challenge"
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

          <GameRoundBars
            rows={results.map((r, i) => ({
              data: <span className="game-round-pct">{Math.round(r.score.score * 100)}%</span>,
              fillPct: Math.round(r.score.score * 100),
              label: `Round ${i + 1}`,
              time: r.timeTaken,
            }))}
          />

          <GameResultActions
            copied={copied}
            onNewGame={() => {
              startChallenge(Date.now());
            }}
            onSave={handleSave}
            onShare={handleShare}
            onTryAgain={() => {
              startChallenge(seed);
            }}
            shareRef={shareRef}
          />
        </div>
      </div>
    );
  }

  // --- Playing ---
  const currentSentence = sentences[round];
  if (!currentSentence) {
    return null;
  }

  return (
    <div className="game-page">
      <GameProgressBar
        current={round + 1}
        muted={muted}
        onToggleMute={toggleMute}
        supported={supported}
        tierLabel={getTierLabel(currentSentence.tier)}
        timer={
          currentFeedback === null ? (
            <span className={`game-timer${timeLeft <= 5 ? ' game-timer-warning' : ''}`}>
              {timeLeft}s
            </span>
          ) : undefined
        }
        total={sentences.length}
      />

      <div className="card game-card">
        <div className="label-caps game-card-label">Read this Ingglish sentence:</div>
        <div className="game-card-text">{getIngglishText(currentSentence)}</div>
      </div>

      <div className="game-input-area">
        <input
          className="game-input"
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

      <div className="game-actions">
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
        <div className="card game-feedback">
          <div className="game-feedback-score">
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
