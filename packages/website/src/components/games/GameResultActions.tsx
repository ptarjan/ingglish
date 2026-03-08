import type { RefObject } from 'react';

interface GameResultActionsProps {
  /** Whether the share-copied flash is active. */
  copied: boolean;
  /** Label for the "New Game" button. Defaults to "New Game". */
  newGameLabel?: string;
  /** Start a new game with a new seed. */
  onNewGame: () => void;
  /** Save the score card as an image file. */
  onSave: () => void;
  /** Copy the score card to clipboard. */
  onShare: () => void;
  /** Retry with the same seed. */
  onTryAgain: () => void;
  /** Ref forwarded to the Share button for auto-focus. */
  shareRef?: RefObject<HTMLButtonElement | null>;
}

/** Reusable action buttons for game result screens. */
export function GameResultActions({
  copied,
  newGameLabel = 'New Game',
  onNewGame,
  onSave,
  onShare,
  onTryAgain,
  shareRef,
}: GameResultActionsProps) {
  return (
    <div className="game-result-actions">
      <button className="btn-secondary" onClick={onTryAgain}>
        Try Again
      </button>
      <button className="btn-secondary" onClick={onNewGame}>
        {newGameLabel}
      </button>
      <button
        className={`btn-primary ${copied ? 'btn-copied' : ''}`}
        onClick={onShare}
        ref={shareRef}
      >
        {copied ? 'Copied!' : 'Share Result'}
      </button>
      <button className="btn-secondary" onClick={onSave}>
        Save
      </button>
    </div>
  );
}
