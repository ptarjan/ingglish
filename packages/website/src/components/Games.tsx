import type { JSX } from 'react';
import { lazy, Suspense, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import type { GameId } from '../routes';
import { GAME_ENTRIES } from '../routes';
import ErrorBoundary from './ErrorBoundary';

const GamesHub = lazy(() => import('./games/GamesHub'));
const ReadingChallenge = lazy(() => import('./games/ReadingChallenge'));
const HomophonesQuiz = lazy(() => import('./games/HomophonesQuiz'));
const LearnToRead = lazy(() => import('./games/LearnToRead'));
const DailyChallenge = lazy(() => import('./games/DailyChallenge'));
const SpeedMatch = lazy(() => import('./games/SpeedMatch'));
const ReverseSpelling = lazy(() => import('./games/ReverseSpelling'));
const SpellingRuleQuiz = lazy(() => import('./games/SpellingRuleQuiz'));
const SpellThatSound = lazy(() => import('./games/SpellThatSound'));
const RuleOrException = lazy(() => import('./games/RuleOrException'));
const PatternSort = lazy(() => import('./games/PatternSort'));
const OriginDetective = lazy(() => import('./games/OriginDetective'));

function Games(): JSX.Element {
  const { gameId } = useParams<{ gameId?: string }>();
  const navigate = useNavigate();

  // Resolve to a valid game ID or null (hub view)
  const activeGame: GameId | null =
    gameId !== undefined && GAME_ENTRIES.some((g) => g.id === gameId)
      ? (gameId as GameId)
      : null;

  // Update document title
  useEffect(() => {
    if (activeGame) {
      const entry = GAME_ENTRIES.find((g) => g.id === activeGame);
      document.title = `${entry?.title ?? 'Game'} | Ingglish`;
    } else {
      document.title = 'Games | Ingglish';
    }
  }, [activeGame]);

  const handleSelectGame = (id: GameId) => {
    void navigate(`/games/${id}`);
  };

  const loading = (
    <div className="loading-screen">
      <div className="loading-spinner"></div>
    </div>
  );

  return (
    <Suspense fallback={loading}>
      <ErrorBoundary>
        {activeGame === null && <GamesHub onSelectGame={handleSelectGame} />}
        {activeGame === 'reading' && <ReadingChallenge />}
        {activeGame === 'homophones' && <HomophonesQuiz />}
        {activeGame === 'learn' && <LearnToRead />}
        {activeGame === 'daily' && <DailyChallenge />}
        {activeGame === 'speedmatch' && <SpeedMatch />}
        {activeGame === 'reverse' && <ReverseSpelling />}
        {activeGame === 'spelling-rules' && <SpellingRuleQuiz />}
        {activeGame === 'spell-that-sound' && <SpellThatSound />}
        {activeGame === 'rule-or-exception' && <RuleOrException />}
        {activeGame === 'pattern-sort' && <PatternSort />}
        {activeGame === 'origin-detective' && <OriginDetective />}
      </ErrorBoundary>
    </Suspense>
  );
}

export default Games;
