import type { JSX } from 'react';
import type { GameId } from '../../routes';
import '../../styles/games-hub.css';

interface GameCard {
  description: string;
  difficulty: string;
  id: GameId;
  section: 'english-spelling' | 'ingglish';
  title: string;
}

const GAMES: GameCard[] = [
  {
    description:
      'Read 10 Ingglish sentences and type the English. Timed rounds with progressive difficulty.',
    difficulty: 'All levels',
    id: 'reading',
    section: 'ingglish',
    title: 'Reading Challenge',
  },
  {
    description:
      'See an Ingglish word and pick which English word it represents. Tests your understanding of phonetic merges.',
    difficulty: 'All levels',
    id: 'homophones',
    section: 'ingglish',
    title: 'Homophones Quiz',
  },
  {
    description:
      '8 progressive lessons teaching one Ingglish rule at a time, with quizzes to test what you learned.',
    difficulty: 'Beginner',
    id: 'learn',
    section: 'ingglish',
    title: 'Learn to Read',
  },
  {
    description:
      'Guess the 5-letter Ingglish word in 6 tries — Wordle-style! Green, yellow, and gray tiles show how close you are. Same word for everyone each day.',
    difficulty: 'All levels',
    id: 'daily',
    section: 'ingglish',
    title: 'Ingglish Wordle',
  },
  {
    description:
      'Match Ingglish words to their English translations as fast as you can. Race the clock across 3 rounds.',
    difficulty: 'All levels',
    id: 'speedmatch',
    section: 'ingglish',
    title: 'Speed Match',
  },
  {
    description:
      'See an English word and type how it looks in Ingglish. Tests your knowledge of phonetic spelling rules.',
    difficulty: 'Intermediate',
    id: 'reverse',
    section: 'ingglish',
    title: 'Reverse Spelling',
  },
  {
    description:
      'See a word with a highlighted letter pattern and pick what sound it makes. Learn why English spelling is so unpredictable.',
    difficulty: 'All levels',
    id: 'spelling-rules',
    section: 'english-spelling',
    title: 'Spelling Rule Quiz',
  },
  {
    description: 'See a sound and a word with a blank — pick the correct spelling to complete it.',
    difficulty: 'All levels',
    id: 'spell-that-sound',
    section: 'english-spelling',
    title: 'Spell That Sound',
  },
  {
    description: 'See a word and a spelling rule — does the word follow the rule or break it?',
    difficulty: 'All levels',
    id: 'rule-or-exception',
    section: 'english-spelling',
    title: 'Rule or Exception?',
  },
  {
    description:
      'Words appear one at a time — sort them into pronunciation buckets by how the pattern sounds.',
    difficulty: 'Intermediate',
    id: 'pattern-sort',
    section: 'english-spelling',
    title: 'Pattern Sort',
  },
  {
    description:
      "Guess a word's language of origin from its unusual spelling. Germanic, French, Latin, or Greek?",
    difficulty: 'Advanced',
    id: 'origin-detective',
    section: 'english-spelling',
    title: 'Origin Detective',
  },
];

const SECTIONS = [
  {
    key: 'ingglish' as const,
    subtitle: 'Practice reading and understanding Ingglish.',
    title: 'Ingglish',
  },
  {
    key: 'english-spelling' as const,
    subtitle: 'Learn why English is spelled the way it is.',
    title: 'English Spelling',
  },
];

function GamesHub({ onSelectGame }: { onSelectGame: (id: GameId) => void }): JSX.Element {
  return (
    <div className="games-hub">
      <div className="games-hub-header">
        <h2>Games</h2>
      </div>
      {SECTIONS.map((section) => {
        const sectionGames = GAMES.filter((g) => g.section === section.key);
        return (
          <div className="games-hub-section" key={section.key}>
            <div className="games-hub-section-header">
              <h3>{section.title}</h3>
              <p>{section.subtitle}</p>
            </div>
            <div className="games-hub-grid">
              {sectionGames.map((game) => (
                <button
                  className="card games-hub-card"
                  key={game.id}
                  onClick={() => {
                    onSelectGame(game.id);
                  }}
                >
                  <h3>{game.title}</h3>
                  <p>{game.description}</p>
                  <span className="label-caps games-hub-difficulty">{game.difficulty}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default GamesHub;
