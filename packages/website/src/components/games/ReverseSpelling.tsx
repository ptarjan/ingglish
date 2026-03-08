import { isCloseEnough } from '../../challenge/challenge-scoring';
import type { ReverseWord } from '../../data/reverse-spelling-data';
import { pickReverseSpelling } from '../../data/reverse-spelling-data';
import { getTierLabel, makeScoreLabel } from '../../games/game-utils';
import { useTimedInputGame } from '../../hooks/useTimedInputGame';
import { GameIntro } from './GameIntro';
import { GameProgressBar } from './GameProgressBar';
import { GameResultActions } from './GameResultActions';
import { GameResults } from './GameResults';
import { GameRoundBars } from './GameRoundBars';

import '../../styles/reverse-spelling.css';

const TIER_TIME_LIMITS: Record<1 | 2 | 3, number> = { 1: 30, 2: 25, 3: 20 };

const getScoreLabel = makeScoreLabel({
  good: 'Great job! You have a solid grasp of the rules!',
  great: 'Amazing! You know Ingglish spelling inside-out!',
  low: "Keep at it — you'll internalize the patterns!",
  ok: 'Not bad! Phonetic spelling takes practice.',
});

function ReverseSpelling() {
  const game = useTimedInputGame<ReverseWord, number>({
    getScoreValue: (score) => score,
    getTier: (item) => item.tier,
    pickItems: pickReverseSpelling,
    scoreCard: {
      filename: 'ingglish-reverse-score.png',
      footerUrl: 'ingglish.com/games/reverse',
      gameTitle: 'INGGLISH REVERSE SPELLING',
    },
    scoreInput: (input, item) => scoreAnswer(input, item.ingglish),
    scoreOnExpiry: (_input, item) => scoreAnswer('', item.ingglish),
    speakFeedback: (score) =>
      score === 1 ? 'Correct!' : 'Not quite. The correct spelling is shown on screen.',
    speakQuestion: (item) => `Spell this word in Ingglish: ${item.english}`,
    tierTimeLimits: TIER_TIME_LIMITS,
  });

  // --- Intro ---
  if (game.phase === 'intro') {
    return (
      <div className="game-page">
        <GameIntro
          description="Can you spell in Ingglish? You'll see an English word — type how it would look in phonetic Ingglish spelling. Close misspellings get partial credit!"
          onStart={() => {
            game.startGame(game.seed);
          }}
          rules={[
            'See an English word displayed on screen',
            'Type the Ingglish spelling before time runs out',
            'Exact match = full credit, close = half credit',
          ]}
          startRef={game.startRef}
          title="Reverse Spelling"
        />
      </div>
    );
  }

  // --- Results ---
  if (game.phase === 'results') {
    return (
      <GameResults
        heading="Challenge Complete!"
        score={`${game.overallPct}%`}
        scoreLabel={getScoreLabel(game.overallPct)}
      >
        <GameRoundBars
          rows={game.results.map((r) => ({
            data: <span className="game-round-pct">{Math.round(r.feedback * 100)}%</span>,
            fillPct: Math.round(r.feedback * 100),
            label: r.item.english,
            time: r.timeTaken,
          }))}
        />

        <GameResultActions
          copied={game.copied}
          newGameLabel="New Words"
          onNewGame={() => {
            game.startGame(Date.now());
          }}
          onSave={game.handleSave}
          onShare={game.handleShare}
          onTryAgain={() => {
            game.startGame(game.seed);
          }}
          shareRef={game.shareRef}
        />
      </GameResults>
    );
  }

  // --- Playing ---
  const currentWord = game.currentItem;
  if (!currentWord) {
    return null;
  }

  const feedbackClass =
    game.currentFeedback === null
      ? ''
      : game.currentFeedback === 1
        ? 'reverse-feedback-correct'
        : game.currentFeedback === 0.5
          ? 'reverse-feedback-fuzzy'
          : 'reverse-feedback-incorrect';

  return (
    <div className="game-page">
      <GameProgressBar
        current={game.round + 1}
        muted={game.speech.muted}
        onToggleMute={game.speech.toggleMute}
        supported={game.speech.supported}
        tierLabel={getTierLabel(currentWord.tier)}
        timer={
          game.currentFeedback === null ? (
            <span className={`game-timer${game.timeLeft <= 5 ? ' game-timer-warning' : ''}`}>
              {game.timeLeft}s
            </span>
          ) : undefined
        }
        total={game.items.length}
      />

      <div className="card game-card" style={{ textAlign: 'center' }}>
        <div className="label-caps game-card-label">Spell this word in Ingglish:</div>
        <div className="reverse-prompt-word">{currentWord.english}</div>
      </div>

      <div className="game-input-area">
        <input
          className="game-input"
          disabled={game.currentFeedback !== null}
          onChange={(e) => {
            game.setInput(e.target.value);
          }}
          onKeyDown={game.handleKeyDown}
          placeholder="Type the Ingglish spelling..."
          ref={game.inputRef}
          type="text"
          value={game.input}
        />
      </div>

      <div className="game-actions">
        {game.currentFeedback === null ? (
          <button className="btn-primary" disabled={!game.input.trim()} onClick={game.handleSubmit}>
            Check
          </button>
        ) : (
          <button className="btn-primary" onClick={game.handleNext} ref={game.nextRef}>
            {game.round + 1 >= game.items.length ? 'See Results' : 'Next'}
          </button>
        )}
      </div>

      {game.currentFeedback !== null && (
        <div className="card reverse-feedback-comparison">
          <div className="reverse-feedback-item">
            <div className="reverse-feedback-label">Your answer</div>
            <div className={`reverse-feedback-word ${feedbackClass}`}>
              {game.input.trim() || '—'}
            </div>
          </div>
          <div className="reverse-feedback-item">
            <div className="reverse-feedback-label">Correct</div>
            <div className="reverse-feedback-word">{currentWord.ingglish}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Score the user's typed Ingglish against the expected translation.
 * exact = 1.0, close enough = 0.5, wrong = 0
 */
function scoreAnswer(userInput: string, expected: string): number {
  if (userInput === '') {
    return 0;
  }
  const actual = userInput.toLowerCase();
  const exp = expected.toLowerCase();
  if (actual === exp) {
    return 1;
  }
  if (isCloseEnough(actual, exp)) {
    return 0.5;
  }
  return 0;
}

export default ReverseSpelling;
