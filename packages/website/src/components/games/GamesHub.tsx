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
      'Read 10 Ingglish sentences and type each one in English. The rounds are timed and get harder as you go.',
    difficulty: 'All levels',
    id: 'reading',
    section: 'ingglish',
    title: 'Reading Challenge',
  },
  {
    description:
      'See an Ingglish word and pick the English word it spells. Words that sound alike share one Ingglish spelling.',
    difficulty: 'All levels',
    id: 'homophones',
    section: 'ingglish',
    title: 'Homophones Quiz',
  },
  {
    description:
      '8 lessons, taken in order, each teaching one Ingglish rule and ending with a short quiz.',
    difficulty: 'Beginner',
    id: 'learn',
    section: 'ingglish',
    title: 'Learn to Read',
  },
  {
    description:
      'Wordle in Ingglish: guess the 5-letter Ingglish word in 6 tries. Green, yellow, and gray tiles show how close you are. Everyone gets the same word each day.',
    difficulty: 'All levels',
    id: 'daily',
    section: 'ingglish',
    title: 'Ingglish Wordle',
  },
  {
    description:
      'Match Ingglish words to their English translations as fast as you can. 3 timed rounds.',
    difficulty: 'All levels',
    id: 'speedmatch',
    section: 'ingglish',
    title: 'Speed Match',
  },
  {
    description:
      'See an English word and type its Ingglish spelling. Tests how well you know the spelling rules.',
    difficulty: 'Intermediate',
    id: 'reverse',
    section: 'ingglish',
    title: 'Reverse Spelling',
  },
  {
    description:
      'See a word with some letters highlighted and pick the sound they make. Shows why English spelling is so hard to predict.',
    difficulty: 'All levels',
    id: 'spelling-rules',
    section: 'english-spelling',
    title: 'Spelling Rule Quiz',
  },
  {
    description:
      'Each word is missing a few letters. You are told the sound they make; pick the spelling that fills the gap.',
    difficulty: 'All levels',
    id: 'spell-that-sound',
    section: 'english-spelling',
    title: 'Spell That Sound',
  },
  {
    description: 'See a word and a spelling rule. Does the word follow the rule or break it?',
    difficulty: 'All levels',
    id: 'rule-or-exception',
    section: 'english-spelling',
    title: 'Rule or Exception?',
  },
  {
    description:
      'Each round uses one letter pattern. Sort words that contain it by how the pattern is pronounced.',
    difficulty: 'Intermediate',
    id: 'pattern-sort',
    section: 'english-spelling',
    title: 'Pattern Sort',
  },
  {
    description:
      "Use a word's unusual spelling to guess where it came from: Germanic, French, Latin, or Greek.",
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
