import type { SpellingRuleQuestion } from '../../data/spelling-rule-quiz-data';
import { pickQuiz } from '../../data/spelling-rule-quiz-data';
import { getTierLabel, makeScoreLabel } from '../../games/game-utils';
import { useQuizGame } from '../../hooks/useQuizGame';
import '../../styles/spelling-rule-quiz.css';
import { GameIntro } from './GameIntro';
import { GameProgressBar } from './GameProgressBar';
import { QuizChoices } from './QuizChoices';
import { QuizFeedback } from './QuizFeedback';
import { QuizResults } from './QuizResults';

const getScoreLabel = makeScoreLabel({
  good: 'Great job! English spelling is tricky but you handle it well.',
  great: 'Amazing! You really know English spelling rules!',
  low: 'English spelling is wild — keep practicing!',
  ok: 'Not bad! English spelling trips up even native speakers.',
});

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
    speakFeedback: (q, selectedChoice, _correct) =>
      selectedChoice === q.correctSound
        ? `Correct! ${q.explanation}`
        : `Not quite, it's ${q.correctSound}. ${q.explanation}`,
    speakQuestion: (q) => {
      const choiceList = q.choices.map((c, i) => `${i + 1}. ${c}`).join(' ... ');
      return `What sound does the highlighted pattern make in ${q.word}? ... ${choiceList}`;
    },
  });

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
      <QuizResults game={game} getScoreLabel={getScoreLabel} renderWordLabel={(q) => q.word} />
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
