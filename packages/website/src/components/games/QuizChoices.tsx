interface QuizChoicesProps {
  /** Whether an answer has been selected. */
  answered: boolean;
  /** List of choice strings to display. */
  choices: string[];
  /** Function to determine if a choice is a correct answer. */
  isCorrectAnswer: (choice: string) => boolean;
  /** Called when a choice is clicked. */
  onChoiceClick: (choice: string) => void;
  /** The currently selected choice (null if unanswered). */
  selectedChoice: null | string;
}

/** Reusable multiple-choice buttons for quiz games. */
export function QuizChoices({
  answered,
  choices,
  isCorrectAnswer,
  onChoiceClick,
  selectedChoice,
}: QuizChoicesProps) {
  return (
    <div className="quiz-choices">
      {choices.map((choice) => {
        let className = 'quiz-choice';
        if (answered) {
          if (isCorrectAnswer(choice)) {
            className += ' quiz-choice-correct';
          } else if (choice === selectedChoice) {
            className += ' quiz-choice-incorrect';
          } else {
            className += ' quiz-choice-dimmed';
          }
        }
        return (
          <button
            className={className}
            disabled={answered}
            key={choice}
            onClick={() => {
              onChoiceClick(choice);
            }}
          >
            {choice}
          </button>
        );
      })}
    </div>
  );
}
