import { useState, useCallback, useRef, useEffect } from 'react';
import { renderScoreCard } from '../../challenge/render-score-card';
import type { OriginDetectiveQuestion } from '../../data/origin-detective-data';
import { pickQuiz } from '../../data/origin-detective-data';
import { getTierLabel } from '../../games/game-utils';
import { useAutoFocus } from '../../hooks/useAutoFocus';
import { useGameSpeech } from '../../hooks/useGameSpeech';
import { useShareActions } from '../../hooks/useShareActions';
import { GameIntro } from './GameIntro';
import { GameProgressBar } from './GameProgressBar';
import { GameResultActions } from './GameResultActions';
import { QuizChoices } from './QuizChoices';
import { QuizFeedback } from './QuizFeedback';

type Phase = 'intro' | 'playing' | 'results';

interface RoundResult {
  correct: boolean;
  question: OriginDetectiveQuestion;
  selectedAnswer: string;
  timeTaken: number;
}

function getScoreLabel(pct: number): string {
  if (pct >= 90) {
    return 'True etymology detective!';
  }
  if (pct >= 70) {
    return 'Great instincts for word origins!';
  }
  if (pct >= 50) {
    return 'Word origins are fascinating but tricky!';
  }
  return 'English borrowed from everywhere!';
}

function OriginDetective() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [seed, setSeed] = useState(() => Date.now());
  const [questions, setQuestions] = useState<OriginDetectiveQuestion[]>([]);
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
      const isCorrect = choice === question.correctOrigin;
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
    const choiceList = q.choices.map((c, i) => `${i + 1}, ${c}`).join('. ');
    speak(`${q.word}. Clue: ${q.spellingClue}. ${choiceList}`);
  }, [phase, round, selectedChoice, questions, speak]);

  useEffect(() => {
    if (selectedChoice === null) {
      return;
    }
    const q = questions[round];
    if (!q) {
      return;
    }
    if (selectedChoice === q.correctOrigin) {
      speak(`Correct! ${q.explanation}`);
    } else {
      speak(`Not quite, it's ${q.correctOrigin}. ${q.explanation}`);
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
        { footerUrl: 'ingglish.com/games/origin-detective', gameTitle: 'ORIGIN DETECTIVE' }
      ),
    [results, overallPct]
  );

  const { copied, handleSave, handleShare } = useShareActions(
    getScoreCanvas,
    'origin-detective-score.png'
  );

  if (phase === 'intro') {
    return (
      <div className="game-page">
        <GameIntro
          buttonLabel="Start Quiz"
          description="English borrowed words from many languages, and the weird spellings are often clues to where a word came from. Can you guess the origin?"
          onStart={() => {
            startQuiz(seed);
          }}
          rules={[
            'See a word and a spelling clue',
            'Guess whether it came from Germanic, French, Latin, or Greek',
            '10 rounds, from obvious to surprising',
          ]}
          startRef={startRef}
          title="Origin Detective"
        />
      </div>
    );
  }

  if (phase === 'results') {
    const correctCount = results.filter((r) => r.correct).length;
    return (
      <div className="game-page">
        <div className="game-results">
          <h2>Case Closed!</h2>
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
                <span className="quiz-round-word">{r.question.word}</span>
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
        <div className="label-caps game-card-label">Clue: {currentQ.spellingClue}</div>
        <div className="quiz-word">{currentQ.word}</div>
      </div>

      <QuizChoices
        answered={answered}
        choices={currentQ.choices}
        isCorrectAnswer={(choice) => choice === currentQ.correctOrigin}
        onChoiceClick={handleChoiceClick}
        selectedChoice={selectedChoice}
      />

      {answered && (
        <QuizFeedback
          correct={selectedChoice === currentQ.correctOrigin}
          explanation={currentQ.explanation}
          incorrectMessage={
            <>
              Not quite — it{'\u2019'}s <strong>{currentQ.correctOrigin}</strong>
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

export default OriginDetective;
