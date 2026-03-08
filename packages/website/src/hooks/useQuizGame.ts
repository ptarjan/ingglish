import type React from 'react';
import type { RefObject } from 'react';
import { useCallback, useRef, useState } from 'react';
import { renderScoreCard } from '../challenge/render-score-card';
import { useGameShare } from '../games/useGameShare';
import { useAutoFocus } from './useAutoFocus';
import { useGameSpeech } from './useGameSpeech';

export interface QuizGameConfig<Q> {
  getChoices: (question: Q) => string[];
  isCorrect: (choice: string, question: Q) => boolean;
  pickQuiz: (seed: number) => Q[];
  scoreCard: {
    filename: string;
    footerUrl: string;
    gameTitle: string;
  };
}

export interface QuizRoundResult<Q> {
  correct: boolean;
  question: Q;
  selectedAnswer: string;
  timeTaken: number;
}

type Phase = 'intro' | 'playing' | 'results';

interface QuizGameReturn<Q> {
  answered: boolean;
  copied: boolean;
  correctCount: number;
  currentQuestion: Q | undefined;
  handleChoiceClick: (choice: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleNext: () => void;
  handleSave: () => void;
  handleShare: () => void;
  handleStart: () => void;
  nextRef: RefObject<HTMLButtonElement | null>;
  overallPct: number;
  phase: Phase;
  questions: Q[];
  results: QuizRoundResult<Q>[];
  round: number;
  seed: number;
  selectedChoice: null | string;
  shareRef: RefObject<HTMLButtonElement | null>;
  speech: ReturnType<typeof useGameSpeech>;

  startQuiz: (seed: number) => void;
  startRef: RefObject<HTMLButtonElement | null>;
}

export function useQuizGame<Q>(config: QuizGameConfig<Q>): QuizGameReturn<Q> {
  const { getChoices, isCorrect, pickQuiz, scoreCard } = config;

  const [phase, setPhase] = useState<Phase>('intro');
  const [seed, setSeed] = useState(() => Date.now());
  const [questions, setQuestions] = useState<Q[]>([]);
  const [round, setRound] = useState(0);
  const [results, setResults] = useState<QuizRoundResult<Q>[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<null | string>(null);
  const roundStartRef = useRef(0);
  const startRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const speech = useGameSpeech();
  const { handleMuteKey, stop } = speech;

  useAutoFocus(startRef, phase === 'intro');
  useAutoFocus(nextRef, selectedChoice !== null);
  useAutoFocus(shareRef, phase === 'results');

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
    [stop, pickQuiz]
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
      if (question === undefined) {
        return;
      }
      const elapsed = Math.round((Date.now() - roundStartRef.current) / 1000);
      const correct = isCorrect(choice, question);
      setSelectedChoice(choice);
      setResults((prev) => [
        ...prev,
        { correct, question, selectedAnswer: choice, timeTaken: elapsed },
      ]);
    },
    [selectedChoice, questions, round, isCorrect]
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
      if (handleMuteKey(e)) {
        return;
      }
      if (selectedChoice === null) {
        const question = questions[round];
        if (question !== undefined) {
          const choices = getChoices(question);
          const idx = Number.parseInt(e.key, 10) - 1;
          if (idx >= 0 && idx < choices.length) {
            handleChoiceClick(choices[idx]!);
          }
        }
      } else if (e.key === 'Enter') {
        handleNext();
      }
    },
    [selectedChoice, handleNext, questions, round, handleChoiceClick, handleMuteKey, getChoices]
  );

  const correctCount = results.filter((r) => r.correct).length;
  const overallPct = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;

  const getScoreCanvas = useCallback(
    () =>
      renderScoreCard(
        results.map((r) => ({ score: r.correct ? 1 : 0, timeTaken: r.timeTaken })),
        overallPct,
        { footerUrl: scoreCard.footerUrl, gameTitle: scoreCard.gameTitle }
      ),
    [results, overallPct, scoreCard.footerUrl, scoreCard.gameTitle]
  );

  const { copied, handleSave, handleShare, shareRef } = useGameShare(
    getScoreCanvas,
    scoreCard.filename
  );

  const currentQuestion = questions[round];
  const answered = selectedChoice !== null;

  return {
    answered,
    copied,
    correctCount,
    currentQuestion,
    handleChoiceClick,
    handleKeyDown,
    handleNext,
    handleSave,
    handleShare,
    handleStart,
    nextRef,
    overallPct,
    phase,
    questions,
    results,
    round,
    seed,
    selectedChoice,
    shareRef,
    speech,
    startQuiz,
    startRef,
  };
}
