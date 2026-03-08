import type React from 'react';
import type { RefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { renderScoreCard } from '../challenge/render-score-card';
import { useCountdown } from '../games/useCountdown';
import { useGameShare } from '../games/useGameShare';
import { useAutoFocus } from './useAutoFocus';
import { useGameSpeech } from './useGameSpeech';

export interface TimedInputGameConfig<Item, Feedback> {
  getScoreValue: (feedback: Feedback) => number; // 0-1
  getTier: (item: Item) => 1 | 2 | 3;
  pickItems: (seed: number) => Item[];
  scoreCard: { filename: string; footerUrl: string; gameTitle: string };
  scoreInput: (input: string, item: Item) => Feedback;
  scoreOnExpiry: (input: string, item: Item) => Feedback;
  speakFeedback?: (feedback: Feedback) => string;
  speakQuestion?: (item: Item) => string;
  tierTimeLimits: Record<1 | 2 | 3, number>;
}

export interface TimedInputGameReturn<Item, Feedback> {
  copied: boolean;
  currentFeedback: Feedback | null;
  currentItem: Item | undefined;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleNext: () => void;
  handleSave: () => void;
  handleShare: () => void;
  handleSubmit: () => void;
  input: string;
  inputRef: RefObject<HTMLInputElement | null>;
  items: Item[];
  nextRef: RefObject<HTMLButtonElement | null>;
  overallPct: number;
  phase: Phase;
  results: TimedInputRoundResult<Item, Feedback>[];
  round: number;
  seed: number;
  setInput: (value: string) => void;
  shareRef: RefObject<HTMLButtonElement | null>;
  speech: { muted: boolean; supported: boolean; toggleMute: () => void };
  startGame: (seed: number) => void;
  startRef: RefObject<HTMLButtonElement | null>;
  timeLeft: number;
}

export interface TimedInputRoundResult<Item, Feedback> {
  feedback: Feedback;
  item: Item;
  timeTaken: number;
}

type Phase = 'intro' | 'playing' | 'results';

export function useTimedInputGame<Item, Feedback>(
  config: TimedInputGameConfig<Item, Feedback>
): TimedInputGameReturn<Item, Feedback> {
  const { getScoreValue, getTier, pickItems, scoreCard, tierTimeLimits } = config;

  const [phase, setPhase] = useState<Phase>('intro');
  const [seed, setSeed] = useState(() => Date.now());
  const [items, setItems] = useState<Item[]>([]);
  const [round, setRound] = useState(0);
  const [input, setInput] = useState('');
  const [results, setResults] = useState<TimedInputRoundResult<Item, Feedback>[]>([]);
  const [currentFeedback, setCurrentFeedback] = useState<Feedback | null>(null);
  const roundStartRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const speech = useGameSpeech();
  const { handleMuteKey, speak, stop } = speech;

  // Keep config callbacks in refs to avoid stale closures
  const scoreInputRef = useRef(config.scoreInput);
  const scoreOnExpiryRef = useRef(config.scoreOnExpiry);
  const speakQuestionRef = useRef(config.speakQuestion);
  const speakFeedbackRef = useRef(config.speakFeedback);
  scoreInputRef.current = config.scoreInput;
  scoreOnExpiryRef.current = config.scoreOnExpiry;
  speakQuestionRef.current = config.speakQuestion;
  speakFeedbackRef.current = config.speakFeedback;

  const handleExpire = useCallback(() => {
    const item = items[round];
    if (item === undefined || currentFeedback !== null) {
      return;
    }
    const feedback = scoreOnExpiryRef.current(input, item);
    const elapsed = tierTimeLimits[getTier(item)];
    setCurrentFeedback(feedback);
    setResults((prev) => [...prev, { feedback, item, timeTaken: elapsed }]);
  }, [items, round, input, currentFeedback, tierTimeLimits, getTier]);

  const { reset: resetCountdown, timeLeft } = useCountdown({
    onExpire: handleExpire,
    paused: phase !== 'playing' || currentFeedback !== null,
    seconds: 0,
  });

  const overallScore =
    results.length > 0
      ? results.reduce((sum, r) => sum + getScoreValue(r.feedback), 0) / results.length
      : 0;
  const overallPct = Math.round(overallScore * 100);

  const getScoreCanvas = useCallback(
    () =>
      renderScoreCard(
        results.map((r) => ({ score: getScoreValue(r.feedback), timeTaken: r.timeTaken })),
        overallPct,
        { footerUrl: scoreCard.footerUrl, gameTitle: scoreCard.gameTitle }
      ),
    [results, overallPct, scoreCard.footerUrl, scoreCard.gameTitle, getScoreValue]
  );

  const { copied, handleSave, handleShare, shareRef } = useGameShare(
    getScoreCanvas,
    scoreCard.filename
  );

  useAutoFocus(startRef, phase === 'intro');
  useAutoFocus(nextRef, currentFeedback !== null);
  useAutoFocus(shareRef, phase === 'results');

  const startGame = useCallback(
    (newSeed: number) => {
      stop();
      setSeed(newSeed);
      const picked = pickItems(newSeed);
      setItems(picked);
      setRound(0);
      setResults([]);
      setCurrentFeedback(null);
      setInput('');
      resetCountdown(tierTimeLimits[getTier(picked[0]!)]);
      roundStartRef.current = Date.now();
      setPhase('playing');
      setTimeout(() => inputRef.current?.focus(), 0);
    },
    [stop, pickItems, resetCountdown, tierTimeLimits, getTier]
  );

  const handleSubmit = useCallback(() => {
    const item = items[round];
    if (item === undefined || !input.trim()) {
      return;
    }
    const elapsed = Math.round((Date.now() - roundStartRef.current) / 1000);
    const feedback = scoreInputRef.current(input.trim(), item);
    setCurrentFeedback(feedback);
    setResults((prev) => [...prev, { feedback, item, timeTaken: elapsed }]);
  }, [items, round, input]);

  const handleNext = useCallback(() => {
    const nextRound = round + 1;
    if (nextRound >= items.length) {
      setPhase('results');
    } else {
      setRound(nextRound);
      setInput('');
      setCurrentFeedback(null);
      resetCountdown(tierTimeLimits[getTier(items[nextRound]!)]);
      roundStartRef.current = Date.now();
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [round, items, resetCountdown, tierTimeLimits, getTier]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (handleMuteKey(e)) {
        return;
      }
      if (e.key === 'Enter') {
        if (currentFeedback === null) {
          handleSubmit();
        } else {
          handleNext();
        }
      }
    },
    [currentFeedback, handleNext, handleSubmit, handleMuteKey]
  );

  // Speak question when round changes
  useEffect(() => {
    const fn = speakQuestionRef.current;
    if (fn === undefined || phase !== 'playing' || currentFeedback !== null) {
      return;
    }
    const item = items[round];
    if (item === undefined) {
      return;
    }
    speak(fn(item));
  }, [phase, round, currentFeedback, items, speak]);

  // Speak feedback when answer is checked
  useEffect(() => {
    const fn = speakFeedbackRef.current;
    if (fn === undefined || currentFeedback === null) {
      return;
    }
    speak(fn(currentFeedback));
  }, [currentFeedback, speak]);

  return {
    copied,
    currentFeedback,
    currentItem: items[round],
    handleKeyDown,
    handleNext,
    handleSave,
    handleShare,
    handleSubmit,
    input,
    inputRef,
    items,
    nextRef,
    overallPct,
    phase,
    results,
    round,
    seed,
    setInput,
    shareRef,
    speech: { muted: speech.muted, supported: speech.supported, toggleMute: speech.toggleMute },
    startGame,
    startRef,
    timeLeft,
  };
}
