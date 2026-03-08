import { useEffect, useState } from 'react';
import { loadReverseDictionary } from '@ingglish/dictionary';
import type { SentenceScore } from '../../challenge/challenge-scoring';
import { scoreSentence } from '../../challenge/challenge-scoring';
import type { ChallengeSentence } from '../../data/challenge-data';
import { pickChallenge } from '../../data/challenge-data';
import { getTierLabel, makeScoreLabel } from '../../games/game-utils';
import { useTimedInputGame } from '../../hooks/useTimedInputGame';
import { GameIntro } from './GameIntro';
import { GameProgressBar } from './GameProgressBar';
import { GameResultActions } from './GameResultActions';
import { GameResults } from './GameResults';
import { GameRoundBars } from './GameRoundBars';

const TIER_TIME_LIMITS: Record<1 | 2 | 3, number> = { 1: 30, 2: 25, 3: 20 };

const getScoreLabel = makeScoreLabel({
  good: 'Great job! You picked it up quickly!',
  great: 'Amazing! You read Ingglish like a pro!',
  low: "Keep practicing — you'll get the hang of it!",
  ok: 'Not bad! Ingglish takes a little practice.',
});

const getIngglishText = (sentence: ChallengeSentence): string =>
  sentence.tokens.map((t) => t.translated).join('');

function ReadingChallenge() {
  const [reverseDictReady, setReverseDictReady] = useState(false);

  const game = useTimedInputGame<ChallengeSentence, SentenceScore>({
    getScoreValue: (feedback) => feedback.score,
    getTier: (item) => item.tier,
    pickItems: pickChallenge,
    scoreCard: {
      filename: 'ingglish-reading-score.png',
      footerUrl: 'ingglish.com/games/reading',
      gameTitle: 'INGGLISH READING CHALLENGE',
    },
    scoreInput: (input, item) => scoreSentence(item.tokens, input),
    scoreOnExpiry: (input, item) => scoreSentence(item.tokens, input || ''),
    speakFeedback: (feedback) => `${feedback.correct} of ${feedback.total} words correct`,
    speakQuestion: (item) => item.english,
    tierTimeLimits: TIER_TIME_LIMITS,
  });

  // Load reverse dictionary on mount (needed for homophone scoring)
  useEffect(() => {
    void loadReverseDictionary().then(() => {
      setReverseDictReady(true);
    });
  }, []);

  // --- Intro ---
  if (game.phase === 'intro') {
    return (
      <div className="game-page">
        <GameIntro
          buttonLabel="Start Challenge"
          description="Ingglish claims you can learn to read it in 5 minutes. Let's put that to the test. You'll see 10 sentences written in Ingglish — type what you think the English is."
          disabled={!reverseDictReady}
          onStart={() => {
            game.startGame(game.seed);
          }}
          rules={[
            'Read the Ingglish sentence shown to you',
            'Type what you think it says in English before time runs out',
            'Get scored word-by-word (homophones accepted!)',
          ]}
          startRef={game.startRef}
          title="Reading Challenge"
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
          rows={game.results.map((r, i) => ({
            data: <span className="game-round-pct">{Math.round(r.feedback.score * 100)}%</span>,
            fillPct: Math.round(r.feedback.score * 100),
            label: `Round ${i + 1}`,
            time: r.timeTaken,
          }))}
        />

        <GameResultActions
          copied={game.copied}
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
  const currentSentence = game.currentItem;
  if (!currentSentence) {
    return null;
  }

  return (
    <div className="game-page">
      <GameProgressBar
        current={game.round + 1}
        muted={game.speech.muted}
        onToggleMute={game.speech.toggleMute}
        supported={game.speech.supported}
        tierLabel={getTierLabel(currentSentence.tier)}
        timer={
          game.currentFeedback === null ? (
            <span className={`game-timer${game.timeLeft <= 5 ? ' game-timer-warning' : ''}`}>
              {game.timeLeft}s
            </span>
          ) : undefined
        }
        total={game.items.length}
      />

      <div className="card game-card">
        <div className="label-caps game-card-label">Read this Ingglish sentence:</div>
        <div className="game-card-text">{getIngglishText(currentSentence)}</div>
      </div>

      <div className="game-input-area">
        <input
          className="game-input"
          disabled={game.currentFeedback !== null}
          onChange={(e) => {
            game.setInput(e.target.value);
          }}
          onKeyDown={game.handleKeyDown}
          placeholder="Type the English here..."
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

      {game.currentFeedback && (
        <div className="card game-feedback">
          <div className="game-feedback-score">
            {game.currentFeedback.correct} / {game.currentFeedback.total} words correct
          </div>
          <div className="challenge-feedback-words">
            {game.currentFeedback.words.map((w, i) => (
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
