import type { ReactNode } from 'react';
import { GameSoundToggle } from '../../hooks/useGameSpeech';

interface GameProgressBarProps {
  /** Current round/question number (1-based). */
  current: number;
  /** Whether game speech is muted. */
  muted: boolean;
  /** Toggle mute callback. */
  onToggleMute: () => void;
  /** Whether speech synthesis is supported. */
  supported: boolean;
  /** Label shown as a badge (e.g. "Easy", "Medium", "Hard", or a pattern name). */
  tierLabel?: string;
  /** Optional timer element to render (e.g. countdown). */
  timer?: ReactNode;
  /** Total number of rounds/questions. */
  total: number;
}

/** Reusable progress bar for game playing screens. */
export function GameProgressBar({
  current,
  muted,
  onToggleMute,
  supported,
  tierLabel,
  timer,
  total,
}: GameProgressBarProps) {
  return (
    <div className="game-progress">
      <span>
        {current} / {total}
      </span>
      <div className="game-progress-bar">
        <div className="game-progress-fill" style={{ width: `${(current / total) * 100}%` }} />
      </div>
      {tierLabel && <span className="label-caps game-tier-badge">{tierLabel}</span>}
      {timer}
      <GameSoundToggle muted={muted} supported={supported} toggleMute={onToggleMute} />
    </div>
  );
}
