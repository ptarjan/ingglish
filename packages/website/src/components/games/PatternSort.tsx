import { useState, useCallback, useRef, useEffect } from 'react';
import { renderScoreCard } from '../../challenge/render-score-card';
import type { PatternSortRound } from '../../data/pattern-sort-data';
import { pickRounds } from '../../data/pattern-sort-data';
import { useAutoFocus } from '../../hooks/useAutoFocus';
import { useGameSpeech } from '../../hooks/useGameSpeech';
import { useShareActions } from '../../hooks/useShareActions';
import { GameIntro } from './GameIntro';
import { GameProgressBar } from './GameProgressBar';
import { GameResultActions } from './GameResultActions';
import { QuizFeedback } from './QuizFeedback';

type Phase = 'intro' | 'playing' | 'results';

interface RoundResult {
  correct: number;
  pattern: string;
  total: number;
}

interface WordResult {
  bucket: 'a' | 'b';
  correct: boolean;
  selectedBucket: 'a' | 'b';
  word: string;
}

function getScoreLabel(pct: number): string {
  if (pct >= 90) {
    return 'Amazing sorting skills!';
  }
  if (pct >= 70) {
    return 'Great pattern recognition!';
  }
  if (pct >= 50) {
    return 'English sounds are tricky to sort!';
  }
  return 'These patterns take practice!';
}

function PatternSort() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [seed, setSeed] = useState(() => Date.now());
  const [rounds, setRounds] = useState<PatternSortRound[]>([]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const [wordResults, setWordResults] = useState<WordResult[]>([]);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<'a' | 'b' | null>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const shareRef = useRef<HTMLButtonElement>(null);
  const roundStartRef = useRef(0);
  const { handleMuteKey, muted, speak, stop, supported, toggleMute } = useGameSpeech();

  useAutoFocus(startRef, phase === 'intro');
  useAutoFocus(nextRef, selectedBucket !== null);
  useAutoFocus(shareRef, phase === 'results');

  const startGame = useCallback(
    (newSeed: number) => {
      stop();
      setSeed(newSeed);
      setRounds(pickRounds(newSeed));
      setRoundIdx(0);
      setWordIdx(0);
      setWordResults([]);
      setRoundResults([]);
      setSelectedBucket(null);
      roundStartRef.current = Date.now();
      setPhase('playing');
    },
    [stop]
  );

  const handleBucketClick = useCallback(
    (bucket: 'a' | 'b') => {
      if (selectedBucket !== null) {
        return;
      }
      const round = rounds[roundIdx];
      if (!round) {
        return;
      }
      const currentWord = round.words[wordIdx];
      if (!currentWord) {
        return;
      }
      const isCorrect = bucket === currentWord.bucket;
      setSelectedBucket(bucket);
      setWordResults((prev) => [
        ...prev,
        {
          bucket: currentWord.bucket,
          correct: isCorrect,
          selectedBucket: bucket,
          word: currentWord.word,
        },
      ]);
    },
    [selectedBucket, rounds, roundIdx, wordIdx]
  );

  const handleNext = useCallback(() => {
    const round = rounds[roundIdx];
    if (!round) {
      return;
    }

    if (wordIdx + 1 >= round.words.length) {
      const newResults = [...wordResults];
      const roundCorrect = newResults.filter((r) => r.correct).length;
      setRoundResults((prev) => [
        ...prev,
        { correct: roundCorrect, pattern: round.pattern, total: round.words.length },
      ]);

      if (roundIdx + 1 >= rounds.length) {
        setPhase('results');
      } else {
        setRoundIdx(roundIdx + 1);
        setWordIdx(0);
        setWordResults([]);
        setSelectedBucket(null);
        roundStartRef.current = Date.now();
      }
    } else {
      setWordIdx(wordIdx + 1);
      setSelectedBucket(null);
    }
  }, [rounds, roundIdx, wordIdx, wordResults]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (handleMuteKey(e)) {
        return;
      }
      if (selectedBucket === null) {
        if (e.key === '1') {
          handleBucketClick('a');
        } else if (e.key === '2') {
          handleBucketClick('b');
        }
      } else if (e.key === 'Enter') {
        handleNext();
      }
    },
    [selectedBucket, handleNext, handleBucketClick, handleMuteKey]
  );

  useEffect(() => {
    if (phase !== 'playing' || selectedBucket !== null) {
      return;
    }
    const r = rounds[roundIdx];
    const w = r?.words[wordIdx];
    if (!r || !w) {
      return;
    }
    speak(`Sort by the ${r.pattern} sound. ${w.word}. 1, ${r.bucketA}. 2, ${r.bucketB}.`);
  }, [phase, roundIdx, wordIdx, selectedBucket, rounds, speak]);

  useEffect(() => {
    if (selectedBucket === null) {
      return;
    }
    const r = rounds[roundIdx];
    const w = r?.words[wordIdx];
    if (!r || !w) {
      return;
    }
    if (selectedBucket === w.bucket) {
      speak('Correct!');
    } else {
      speak(`Not quite, ${w.word} belongs in ${w.bucket === 'a' ? r.bucketA : r.bucketB}`);
    }
  }, [selectedBucket, rounds, roundIdx, wordIdx, speak]);

  const totalCorrect = roundResults.reduce((sum, r) => sum + r.correct, 0);
  const totalWords = roundResults.reduce((sum, r) => sum + r.total, 0);
  const overallPct = totalWords > 0 ? Math.round((totalCorrect / totalWords) * 100) : 0;

  const getScoreCanvas = useCallback(
    () =>
      renderScoreCard(
        roundResults.map((r) => ({
          score: r.total > 0 ? r.correct / r.total : 0,
          timeTaken: Math.round((Date.now() - roundStartRef.current) / 1000),
        })),
        overallPct,
        { footerUrl: 'ingglish.com/games/pattern-sort', gameTitle: 'PATTERN SORT' }
      ),
    [roundResults, overallPct]
  );

  const { copied, handleSave, handleShare } = useShareActions(
    getScoreCanvas,
    'pattern-sort-score.png'
  );

  if (phase === 'intro') {
    return (
      <div className="game-page">
        <GameIntro
          buttonLabel="Start Game"
          description="The same letter pattern can make different sounds. Sort words into the right pronunciation bucket!"
          onStart={() => {
            startGame(seed);
          }}
          rules={[
            'See a word with a common spelling pattern',
            'Tap which pronunciation bucket it belongs in',
            '3 rounds with different patterns',
          ]}
          startRef={startRef}
          title="Pattern Sort"
        />
      </div>
    );
  }

  if (phase === 'results') {
    return (
      <div className="game-page">
        <div className="game-results">
          <h2>All Sorted!</h2>
          <div className="game-overall-score">
            {totalCorrect}/{totalWords}
          </div>
          <p className="game-score-label">{getScoreLabel(overallPct)}</p>
          <div className="game-round-bars">
            {roundResults.map((r, i) => {
              const pct = r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0;
              const fillClass =
                pct >= 80
                  ? 'game-round-fill-good'
                  : pct >= 50
                    ? 'game-round-fill-ok'
                    : 'game-round-fill-bad';
              return (
                <div className="game-round-row" key={i}>
                  <span className="game-round-label">{r.pattern}</span>
                  <div className="game-round-bar">
                    <div className={`game-round-fill ${fillClass}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="game-round-pct">
                    {r.correct}/{r.total}
                  </span>
                </div>
              );
            })}
          </div>
          <GameResultActions
            copied={copied}
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

  const currentRound = rounds[roundIdx];
  if (!currentRound) {
    return null;
  }
  const currentWord = currentRound.words[wordIdx];
  if (!currentWord) {
    return null;
  }
  const answered = selectedBucket !== null;
  const globalWordIdx =
    rounds.slice(0, roundIdx).reduce((sum, r) => sum + r.words.length, 0) + wordIdx;
  const globalTotal = rounds.reduce((sum, r) => sum + r.words.length, 0);

  return (
    <div className="game-page" onKeyDown={handleKeyDown}>
      <GameProgressBar
        current={globalWordIdx + 1}
        muted={muted}
        onToggleMute={toggleMute}
        supported={supported}
        tierLabel={currentRound.pattern}
        total={globalTotal}
      />

      <div className="card game-card">
        <div className="label-caps game-card-label">Sort by the {currentRound.pattern} sound</div>
        <div className="quiz-word">{currentWord.word}</div>
      </div>

      <div className="quiz-choices">
        <button
          className={`quiz-choice${answered ? (currentWord.bucket === 'a' ? ' quiz-choice-correct' : selectedBucket === 'a' ? ' quiz-choice-incorrect' : ' quiz-choice-dimmed') : ''}`}
          disabled={answered}
          onClick={() => {
            handleBucketClick('a');
          }}
        >
          {currentRound.bucketA}
        </button>
        <button
          className={`quiz-choice${answered ? (currentWord.bucket === 'b' ? ' quiz-choice-correct' : selectedBucket === 'b' ? ' quiz-choice-incorrect' : ' quiz-choice-dimmed') : ''}`}
          disabled={answered}
          onClick={() => {
            handleBucketClick('b');
          }}
        >
          {currentRound.bucketB}
        </button>
      </div>

      {answered && (
        <QuizFeedback
          correct={selectedBucket === currentWord.bucket}
          incorrectMessage={
            <>
              Not quite — {'\u201C'}
              {currentWord.word}
              {'\u201D'} belongs in{' '}
              {currentWord.bucket === 'a' ? currentRound.bucketA : currentRound.bucketB}
            </>
          }
          isLast={wordIdx + 1 >= currentRound.words.length && roundIdx + 1 >= rounds.length}
          nextRef={nextRef}
          onNext={handleNext}
        />
      )}
    </div>
  );
}

export default PatternSort;
