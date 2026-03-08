import { useState, useCallback, useRef, useEffect } from 'react';
import { renderScoreCard } from '../../challenge/render-score-card';
import type { SpellThatSoundQuestion } from '../../data/spell-that-sound-data';
import { pickQuiz } from '../../data/spell-that-sound-data';
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
  const shareRef = useRef<HTMLButtonElement>(null);
  const { handleMuteKey, muted, speak, stop, supported, toggleMute } = useGameSpeech();

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

  const { copied, handleSave, handleShare } = useShareActions(
    getScoreCanvas,
    'spell-that-sound-score.png'
  );

  if (phase === 'intro') {
    return (
      <div className="game-page">
        <GameIntro
          buttonLabel="Start Quiz"
          description="English has multiple ways to spell the same sound. Can you pick the right spelling for each word?"
          onStart={() => {
            startQuiz(seed);
          }}
          rules={[
            'See a sound and a word with a missing spelling',
            'Pick the correct letters to complete the word',
            '10 rounds, from common patterns to tricky ones',
          ]}
          startRef={startRef}
          title="Spell That Sound"
        />
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
        <div className="label-caps game-card-label">Fill in the {currentQ.soundDescription}</div>
        <div className="quiz-word">
          {currentQ.wordBefore}
          <span className="sr-highlight">{answered ? currentQ.correctSpelling : '___'}</span>
          {currentQ.wordAfter}
        </div>
      </div>

      <QuizChoices
        answered={answered}
        choices={currentQ.choices}
        isCorrectAnswer={(choice) => choice === currentQ.correctSpelling}
        onChoiceClick={handleChoiceClick}
        renderContent={(choice) => (
          <>
            {currentQ.wordBefore}
            <strong>{choice}</strong>
            {currentQ.wordAfter}
          </>
        )}
        selectedChoice={selectedChoice}
      />

      {answered && (
        <QuizFeedback
          correct={selectedChoice === currentQ.correctSpelling}
          explanation={currentQ.explanation}
          incorrectMessage={
            <>
              Not quite — it{'\u2019'}s <strong>{currentQ.correctSpelling}</strong>
            </>
          }
          isLast={round + 1 >= questions.length}
          nextRef={nextRef}
          onNext={handleNext}
        />
      )}
    </div>
  );
}

export default SpellThatSound;
