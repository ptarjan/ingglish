import type { ReactNode, RefObject } from 'react';

interface GameIntroProps {
  /** Label for the start button. Defaults to "Start Game". */
  buttonLabel?: string;
  /** Optional children rendered between the rules and the start button. */
  children?: ReactNode;
  /** Short description of the game. */
  description: string;
  /** When true, the start button is disabled (e.g. waiting for data to load). */
  disabled?: boolean;
  /** Called when the player clicks Start. */
  onStart: () => void;
  /** Ordered list of game rules. */
  rules: string[];
  /** Ref forwarded to the start button for auto-focus. */
  startRef?: RefObject<HTMLButtonElement | null>;
  /** Game title shown as the heading. */
  title: string;
}

/** Reusable intro/start screen for all games. */
export function GameIntro({
  buttonLabel = 'Start Game',
  children,
  description,
  disabled,
  onStart,
  rules,
  startRef,
  title,
}: GameIntroProps) {
  return (
    <div className="game-intro">
      <h2>{title}</h2>
      <p>{description}</p>
      <ol className="card game-rules">
        {rules.map((rule, i) => (
          <li key={i}>{rule}</li>
        ))}
      </ol>
      {children}
      <button className="btn-primary" disabled={disabled} onClick={onStart} ref={startRef}>
        {buttonLabel}
      </button>
    </div>
  );
}
