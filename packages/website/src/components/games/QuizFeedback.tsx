import type { ReactNode, RefObject } from 'react';

interface QuizFeedbackProps {
  /** Whether the selected answer was correct. */
  correct: boolean;
  /** Optional explanation shown below the correct/incorrect message. */
  explanation?: ReactNode;
  /** Message shown when the answer is incorrect (can include JSX with the correct answer). */
  incorrectMessage?: ReactNode;
  /** Whether this is the last question (changes button label). */
  isLast: boolean;
  /** Ref forwarded to the Next button for auto-focus. */
  nextRef?: RefObject<HTMLButtonElement | null>;
  /** Called when the Next/See Results button is clicked. */
  onNext: () => void;
}

/** Reusable feedback card shown after answering a quiz question. */
export function QuizFeedback({
  correct,
  explanation,
  incorrectMessage,
  isLast,
  nextRef,
  onNext,
}: QuizFeedbackProps) {
  return (
    <div className="quiz-feedback">
      {correct ? (
        <div className="quiz-feedback-correct">Correct!</div>
      ) : (
        <div className="quiz-feedback-incorrect">{incorrectMessage ?? 'Not quite!'}</div>
      )}
      {explanation !== undefined && <div className="quiz-explanation">{explanation}</div>}
      <div className="game-actions">
        <button className="btn-primary" onClick={onNext} ref={nextRef}>
          {isLast ? 'See Results' : 'Next'}
        </button>
      </div>
    </div>
  );
}
