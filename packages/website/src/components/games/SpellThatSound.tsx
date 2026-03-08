import { useState, useCallback, useRef, useEffect } from 'react';
import { renderScoreCard } from '../../challenge/render-score-card';
import type { SpellThatSoundQuestion } from '../../data/spell-that-sound-data';
import { pickQuiz } from '../../data/spell-that-sound-data';
import { useGameShare } from '../../games/useGameShare';
import '../../styles/spelling-rule-quiz.css';
import { GameSoundToggle, useGameSpeech } from '../../hooks/useGameSpeech';

type Phase = 'intro' | 'playing' | 'results';

interface RoundResult {
  correct: boolean;
  question: SpellThatSoundQuestion;
  selectedAnswer: string;
  timeTaken: number;
}

function getScoreLabel(pct: number): string {
  if (pct >= 90) {
    return 'Spelling champion!';
  }
  if (pct >= 70) {
    return 'Great spelling instincts!';
  }
  if (pct >= 50) {
    return 'English spelling is tough — nice work!';
  }
  return 'English has too many ways to spell the same sound!';
}

function SpellThatSound() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [seed, setSeed] = useState(() => Date.now());
  const [questions, setQuestions] = useState<SpellThatSoundQuestion[]>([]);
  const [round, setRound] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<null | string>(null);
  const roundStartRef = useRef(0);
  const startRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const { handleMuteKey, muted, speak, stop, supported, toggleMute } = useGameSpeech();

  const overallPct =
    results.length > 0
      ? Math.round((results.filter((r) => r.correct).length / results.length) * 100)
      : 0;

  const getScoreCanvas = useCallback(
    () =>
      renderScoreCard(
        results.map((r) => ({ score: r.correct ? 1 : 0, timeTaken: r.timeTaken })),
        overallPct,
        { footerUrl: 'ingglish.com/games/spell-that-sound', gameTitle: 'SPELL THAT SOUND' }
      ),
    [results, overallPct]
  );

  const { copiedShare, handleSaveImage, handleShareResult, shareRef } = useGameShare(
    getScoreCanvas,
    'spell-that-sound-score.png'
  );

  useEffect(() => {
    if (phase === 'intro') {
      startRef.current?.focus();
    }
  }, [phase]);
  useEffect(() => {
    if (selectedChoice !== null) {
      setTimeout(() => nextRef.current?.focus(), 0);
    }
  }, [selectedChoice]);
  useEffect(() => {
    if (phase === 'results') {
      setTimeout(() => shareRef.current?.focus(), 0);
    }
  }, [phase, shareRef]);

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
    [stop]
  );

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
      const isCorrect = choice === question.correctSpelling;
      setSelectedChoice(choice);
      setResults((prev) => [
        ...prev,
        { correct: isCorrect, question, selectedAnswer: choice, timeTaken: elapsed },
      ]);
    },
    [selectedChoice, questions, round]
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
    const choiceList = q.choices
      .map((c, i) => `${i + 1}, ${q.wordBefore}${c}${q.wordAfter}`)
      .join('. ');
    speak(`Fill in the ${q.soundDescription}. ${q.wordBefore} blank ${q.wordAfter}. ${choiceList}`);
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
    if (selectedChoice === q.correctSpelling) {
      speak(`Correct! ${q.explanation}`);
    } else {
      speak(`Not quite, it's ${q.correctSpelling}. ${q.explanation}`);
    }
  }, [selectedChoice, questions, round, speak]);

  if (phase === 'intro') {
    return (
      <div className="game-page">
        <div className="game-intro">
          <h2>Spell That Sound</h2>
          <p>
            English has multiple ways to spell the same sound. Can you pick the right spelling for
            each word?
          </p>
          <ol className="card game-rules">
            <li>See a sound and a word with a missing spelling</li>
            <li>Pick the correct letters to complete the word</li>
            <li>10 rounds, from common patterns to tricky ones</li>
          </ol>
          <button
            className="btn-primary"
            onClick={() => {
              startQuiz(seed);
            }}
            ref={startRef}
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

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
            {results.map((r, i) => (
              <div className="game-round-row" key={i}>
                <span className="game-round-label">Q{i + 1}</span>
                <div className="game-round-bar">
                  <div
                    className={`game-round-fill ${r.correct ? 'game-round-fill-good' : 'game-round-fill-bad'}`}
                    style={{ width: `${r.correct ? 100 : 0}%` }}
                  />
                </div>
                <span className="quiz-round-word">
                  {r.question.wordBefore}_{r.question.wordAfter}
                </span>
                <span className="game-round-time">{r.timeTaken}s</span>
              </div>
            ))}
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
        <span className="label-caps game-tier-badge">
          {currentQ.tier === 1 ? 'Easy' : currentQ.tier === 2 ? 'Medium' : 'Hard'}
        </span>
        <GameSoundToggle muted={muted} supported={supported} toggleMute={toggleMute} />
      </div>

      <div className="card game-card">
        <div className="label-caps game-card-label">Fill in the {currentQ.soundDescription}</div>
        <div className="quiz-word">
          {currentQ.wordBefore}
          <span className="sr-highlight">{answered ? currentQ.correctSpelling : '___'}</span>
          {currentQ.wordAfter}
        </div>
      </div>

      <div className="quiz-choices">
        {currentQ.choices.map((choice) => {
          let className = 'quiz-choice';
          if (answered) {
            if (choice === currentQ.correctSpelling) {
              className += ' quiz-choice-correct';
            } else if (choice === selectedChoice) {
              className += ' quiz-choice-incorrect';
            } else {
              className += ' quiz-choice-dimmed';
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
              {currentQ.wordBefore}
              <strong>{choice}</strong>
              {currentQ.wordAfter}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="quiz-feedback">
          {selectedChoice === currentQ.correctSpelling ? (
            <div className="quiz-feedback-correct">Correct!</div>
          ) : (
            <div className="quiz-feedback-incorrect">
              Not quite — it{'\u2019'}s <strong>{currentQ.correctSpelling}</strong>
            </div>
          )}
          <div className="quiz-explanation">{currentQ.explanation}</div>
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

export default SpellThatSound;
