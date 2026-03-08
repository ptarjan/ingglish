import { useState, useCallback, useRef, useEffect } from 'react';
import { renderScoreCard } from '../../challenge/render-score-card';
import type { SpellingRuleQuestion } from '../../data/spelling-rule-quiz-data';
import { pickQuiz } from '../../data/spelling-rule-quiz-data';
import { getTierLabel } from '../../games/game-utils';
import { useAutoFocus } from '../../hooks/useAutoFocus';
import { useGameSpeech } from '../../hooks/useGameSpeech';
import { useShareActions } from '../../hooks/useShareActions';
import '../../styles/spelling-rule-quiz.css';
import { GameIntro } from './GameIntro';
import { GameProgressBar } from './GameProgressBar';
import { GameResultActions } from './GameResultActions';
import { QuizChoices } from './QuizChoices';
import { QuizFeedback } from './QuizFeedback';

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
    const endIndex = word.length;
    const lastLen = lastChars.length;
    return (
      <div className="quiz-word">
        {patternStart > 0 && word.slice(0, patternStart)}
        <span className="sr-highlight">{word[patternStart]}</span>
        {word.slice(patternStart + 1, endIndex - lastLen)}
        <span className="sr-highlight">{word.slice(endIndex - lastLen)}</span>
      </div>
    );
  }

  const before = word.slice(0, patternStart);
  const highlighted = word.slice(patternStart, patternStart + pattern.length);
  const after = word.slice(patternStart + pattern.length);
  return (
    <div className="quiz-word">
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
  const { handleMuteKey, muted, speak, stop, supported, toggleMute } = useGameSpeech();

  useAutoFocus(startRef, phase === 'intro');
  useAutoFocus(nextRef, selectedChoice !== null);
  useAutoFocus(shareRef, phase === 'results');

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
      if (handleMuteKey(e)) {
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
    [selectedChoice, handleNext, questions, round, handleChoiceClick, handleMuteKey]
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

  const { copied, handleSave, handleShare } = useShareActions(
    getScoreCanvas,
    'spelling-rule-quiz-score.png'
  );

  // --- Intro ---
  if (phase === 'intro') {
    return (
      <div className="game-page">
        <GameIntro
          buttonLabel="Start Quiz"
          description="English uses the same letters for different sounds depending on word origin and context. Can you predict what sound a letter pattern makes?"
          onStart={handleStart}
          rules={[
            'See a word with a highlighted spelling pattern',
            'Pick what sound that pattern makes in the word',
            '10 rounds, from common rules to tricky exceptions',
          ]}
          startRef={startRef}
          title="Spelling Rule Quiz"
        />
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
                  <span className="quiz-round-word">{r.question.word}</span>
                  <span className="game-round-time">{r.timeTaken}s</span>
                </div>
              );
            })}
          </div>

          <GameResultActions
            copied={copied}
            newGameLabel="New Quiz"
            onNewGame={() => {
              startQuiz(Date.now());
            }}
            onSave={handleSave}
            onShare={handleShare}
            onTryAgain={() => {
              startQuiz(seed);
            }}
            shareRef={shareRef}
          />
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
      <GameProgressBar
        current={round + 1}
        muted={muted}
        onToggleMute={toggleMute}
        supported={supported}
        tierLabel={getTierLabel(currentQ.tier)}
        total={questions.length}
      />

      <div className="card game-card">
        <div className="label-caps game-card-label">
          What sound does the highlighted pattern make?
        </div>
        <HighlightedWord
          pattern={currentQ.pattern}
          patternStart={currentQ.patternStart}
          word={currentQ.word}
        />
      </div>

      <QuizChoices
        answered={answered}
        choices={currentQ.choices}
        isCorrectAnswer={(choice) => choice === currentQ.correctSound}
        onChoiceClick={handleChoiceClick}
        selectedChoice={selectedChoice}
      />

      {answered && (
        <QuizFeedback
          correct={selectedChoice === currentQ.correctSound}
          explanation={currentQ.explanation}
          incorrectMessage={<>Not quite — it&apos;s {currentQ.correctSound}</>}
          isLast={round + 1 >= questions.length}
          nextRef={nextRef}
          onNext={handleNext}
        />
      )}
    </div>
  );
}

export default SpellingRuleQuiz;
