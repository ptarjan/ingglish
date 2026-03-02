import type { JSX } from 'react';
import type { GameId } from '../../routes';
import '../../styles/games-hub.css';

interface GameCard {
  description: string;
  difficulty: string;
  id: GameId;
  title: string;
}

const GAMES: GameCard[] = [
  {
    description:
      'Read 10 Ingglish sentences and type the English. Timed rounds with progressive difficulty.',
    difficulty: 'All levels',
    id: 'reading',
    title: 'Reading Challenge',
  },
  {
    description:
      'See an Ingglish word and pick which English word it represents. Tests your understanding of phonetic merges.',
    difficulty: 'All levels',
    id: 'homophones',
    title: 'Homophones Quiz',
  },
  {
    description:
      '8 progressive lessons teaching one Ingglish rule at a time, with quizzes to test what you learned.',
    difficulty: 'Beginner',
    id: 'learn',
    title: 'Learn to Read',
  },
  {
    description:
      'Guess the 5-letter Ingglish word in 6 tries — Wordle-style! Green, yellow, and gray tiles show how close you are. Same word for everyone each day.',
    difficulty: 'All levels',
    id: 'daily',
    title: 'Ingglish Wordle',
  },
  {
    description:
      'Match Ingglish words to their English translations as fast as you can. Race the clock across 3 rounds.',
    difficulty: 'All levels',
    id: 'speedmatch',
    title: 'Speed Match',
  },
  {
    description:
      'See an English word and type how it looks in Ingglish. Tests your knowledge of phonetic spelling rules.',
    difficulty: 'Intermediate',
    id: 'reverse',
    title: 'Reverse Spelling',
  },
];

function GamesHub({ onSelectGame }: { onSelectGame: (id: GameId) => void }): JSX.Element {
  return (
    <div className="games-hub">
      <div className="games-hub-header">
        <h2>Games</h2>
        <p>Practice reading and understanding Ingglish with interactive games.</p>
      </div>
      <div className="games-hub-grid">
        {GAMES.map((game) => (
          <button
            className="games-hub-card"
            key={game.id}
            onClick={() => {
              onSelectGame(game.id);
            }}
          >
            <h3>{game.title}</h3>
            <p>{game.description}</p>
            <span className="games-hub-difficulty">{game.difficulty}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default GamesHub;
