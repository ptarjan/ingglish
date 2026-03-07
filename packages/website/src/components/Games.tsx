import type { JSX } from 'react';
import { lazy, Suspense, useEffect, useState } from 'react';
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
  const [activeGame, setActiveGame] = useState<GameId | null>(parseGamesPath);

  // Update URL path and title when switching games
  useEffect(() => {
    const targetPath = activeGame ? `/games/${activeGame}` : '/games';
    if (globalThis.location.pathname !== targetPath) {
      globalThis.history.pushState(null, '', targetPath);
    }
    if (activeGame) {
      const entry = GAME_ENTRIES.find((g) => g.id === activeGame);
      document.title = `${entry?.title ?? 'Game'} | Ingglish`;
    } else {
      document.title = 'Games | Ingglish';
    }
  }, [activeGame]);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      setActiveGame(parseGamesPath());
    };
    globalThis.addEventListener('popstate', handlePopState);
    return () => {
      globalThis.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Handle /challenge redirect
  useEffect(() => {
    if (globalThis.location.pathname.replace(/\/$/, '') === '/challenge') {
      setActiveGame('reading');
    }
  }, []);

  const loading = (
    <div className="loading-screen">
      <div className="loading-spinner"></div>
    </div>
  );

  return (
    <Suspense fallback={loading}>
      <ErrorBoundary>
        {activeGame === null && <GamesHub onSelectGame={setActiveGame} />}
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

function parseGamesPath(): GameId | null {
  const segments = globalThis.location.pathname.replace(/\/$/, '').split('/');
  // segments: ['', 'games', 'reading'] or ['', 'games']
  const gameId = segments[2] as GameId | undefined;
  if (gameId && GAME_ENTRIES.some((g) => g.id === gameId)) {
    return gameId;
  }
  return null;
}

export default Games;
