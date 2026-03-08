import { useEffect } from 'react';
import type { SpellingRuleQuestion } from '../../data/spelling-rule-quiz-data';
import { pickQuiz } from '../../data/spelling-rule-quiz-data';
import { getTierLabel } from '../../games/game-utils';
import { useQuizGame } from '../../hooks/useQuizGame';
import '../../styles/spelling-rule-quiz.css';
import { GameIntro } from './GameIntro';
import { GameProgressBar } from './GameProgressBar';
import { GameResultActions } from './GameResultActions';
import { QuizChoices } from './QuizChoices';
import { QuizFeedback } from './QuizFeedback';

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
  const game = useQuizGame<SpellingRuleQuestion>({
    getChoices: (q) => q.choices,
    isCorrect: (choice, q) => choice === q.correctSound,
    pickQuiz,
    scoreCard: {
      filename: 'spelling-rule-quiz-score.png',
      footerUrl: 'ingglish.com/games/spelling-rules',
      gameTitle: 'ENGLISH SPELLING RULE QUIZ',
    },
  });

  const { speak } = game.speech;

  useEffect(() => {
    if (game.phase !== 'playing' || game.selectedChoice !== null) {
      return;
    }
    const q = game.currentQuestion;
    if (!q) {
      return;
    }
    const choiceList = q.choices.map((c, i) => `${i + 1}, ${c}`).join('. ');
    speak(`What sound does the highlighted pattern make in ${q.word}? ${choiceList}`);
  }, [game.phase, game.round, game.selectedChoice, game.currentQuestion, speak]);

  useEffect(() => {
    if (game.selectedChoice === null) {
      return;
    }
    const q = game.currentQuestion;
    if (!q) {
      return;
    }
    if (game.selectedChoice === q.correctSound) {
      speak(`Correct! ${q.explanation}`);
    } else {
      speak(`Not quite, it's ${q.correctSound}. ${q.explanation}`);
    }
  }, [game.selectedChoice, game.currentQuestion, game.round, speak]);

  if (game.phase === 'intro') {
    return (
      <div className="game-page">
        <GameIntro
          buttonLabel="Start Quiz"
          description="English uses the same letters for different sounds depending on word origin and context. Can you predict what sound a letter pattern makes?"
          onStart={game.handleStart}
          rules={[
            'See a word with a highlighted spelling pattern',
            'Pick what sound that pattern makes in the word',
            '10 rounds, from common rules to tricky exceptions',
          ]}
          startRef={game.startRef}
          title="Spelling Rule Quiz"
        />
      </div>
    );
  }

  if (game.phase === 'results') {
    return (
      <div className="game-page">
        <div className="game-results">
          <h2>Quiz Complete!</h2>
          <div className="game-overall-score">
            {game.correctCount}/{game.results.length}
          </div>
          <p className="game-score-label">{getScoreLabel(game.overallPct)}</p>

          <div className="game-round-bars">
            {game.results.map((r, i) => {
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
            copied={game.copied}
            newGameLabel="New Quiz"
            onNewGame={() => {
              game.startQuiz(Date.now());
            }}
            onSave={game.handleSave}
            onShare={game.handleShare}
            onTryAgain={() => {
              game.startQuiz(game.seed);
            }}
            shareRef={game.shareRef}
          />
        </div>
      </div>
    );
  }

  const currentQ = game.currentQuestion;
  if (!currentQ) {
    return null;
  }

  return (
    <div className="game-page" onKeyDown={game.handleKeyDown}>
      <GameProgressBar
        current={game.round + 1}
        muted={game.speech.muted}
        onToggleMute={game.speech.toggleMute}
        supported={game.speech.supported}
        tierLabel={getTierLabel(currentQ.tier)}
        total={game.questions.length}
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
        answered={game.answered}
        choices={currentQ.choices}
        isCorrectAnswer={(choice) => choice === currentQ.correctSound}
        onChoiceClick={game.handleChoiceClick}
        selectedChoice={game.selectedChoice}
      />

      {game.answered && (
        <QuizFeedback
          correct={game.selectedChoice === currentQ.correctSound}
          explanation={currentQ.explanation}
          incorrectMessage={<>Not quite — it&apos;s {currentQ.correctSound}</>}
          isLast={game.round + 1 >= game.questions.length}
          nextRef={game.nextRef}
          onNext={game.handleNext}
        />
      )}
    </div>
  );
}

export default SpellingRuleQuiz;
