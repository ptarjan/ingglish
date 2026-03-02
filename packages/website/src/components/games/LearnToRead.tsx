import { useState, useCallback, useRef, useEffect } from 'react';
import type { Lesson } from '../../data/learn-to-read-data';
import { LESSONS } from '../../data/learn-to-read-data';
import { useGameProgress } from '../../games/useGameProgress';
import '../../styles/learn-to-read.css';

interface LessonProgress {
  completed: number[]; // lesson IDs
  scores: Record<number, number>; // lessonId → best score (0-5)
}

type Phase = 'lesson' | 'menu' | 'quiz' | 'results';

const DEFAULT_PROGRESS: LessonProgress = { completed: [], scores: {} };

function LearnToRead() {
  const [phase, setPhase] = useState<Phase>('menu');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizInput, setQuizInput] = useState('');
  const [quizResults, setQuizResults] = useState<boolean[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const { progress, update: updateProgress } = useGameProgress<LessonProgress>(
    'ingglish-games-learn',
    DEFAULT_PROGRESS
  );

  const startLesson = useCallback((lesson: Lesson) => {
    setActiveLesson(lesson);
    setPhase('lesson');
  }, []);

  const startQuiz = useCallback(() => {
    setQuizIndex(0);
    setQuizInput('');
    setQuizResults([]);
    setShowFeedback(false);
    setPhase('quiz');
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handleQuizSubmit = useCallback(() => {
    if (!activeLesson || showFeedback) {return;}
    const current = activeLesson.quiz[quizIndex];
    if (!current || !quizInput.trim()) {return;}

    const isCorrect = quizInput.trim().toLowerCase() === current.english.toLowerCase();
    setQuizResults((prev) => [...prev, isCorrect]);
    setShowFeedback(true);
    setTimeout(() => nextRef.current?.focus(), 0);
  }, [activeLesson, quizIndex, quizInput, showFeedback]);

  const handleQuizNext = useCallback(() => {
    if (!activeLesson) {return;}
    const nextIndex = quizIndex + 1;
    if (nextIndex >= activeLesson.quiz.length) {
      // Quiz done — save progress
      const correctCount =
        quizResults.length > 0 ? quizResults.filter(Boolean).length + (showFeedback ? 0 : 0) : 0;
      // Include the current answer (already in quizResults at this point)
      const score = correctCount;
      updateProgress((prev) => ({
        completed: prev.completed.includes(activeLesson.id)
          ? prev.completed
          : [...prev.completed, activeLesson.id],
        scores: {
          ...prev.scores,
          [activeLesson.id]: Math.max(prev.scores[activeLesson.id] ?? 0, score),
        },
      }));
      setPhase('results');
    } else {
      setQuizIndex(nextIndex);
      setQuizInput('');
      setShowFeedback(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [activeLesson, quizIndex, quizResults, showFeedback, updateProgress]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (showFeedback) {
          handleQuizNext();
        } else {
          handleQuizSubmit();
        }
      }
    },
    [showFeedback, handleQuizNext, handleQuizSubmit]
  );

  // Auto-focus input when quiz starts
  useEffect(() => {
    if (phase === 'quiz' && !showFeedback) {
      inputRef.current?.focus();
    }
  }, [phase, quizIndex, showFeedback]);

  // --- Menu ---
  if (phase === 'menu') {
    return (
      <div className="game-page">
        <div className="game-intro">
          <h2>Learn to Read Ingglish</h2>
          <p>
            8 progressive lessons, each teaching one rule. Complete the quiz at the end of each
            lesson to track your progress.
          </p>
        </div>
        <div className="learn-lessons">
          {LESSONS.map((lesson) => {
            const isCompleted = progress.completed.includes(lesson.id);
            const bestScore = progress.scores[lesson.id];
            return (
              <button
                className={`learn-lesson-card ${isCompleted ? 'learn-lesson-completed' : ''}`}
                key={lesson.id}
                onClick={() => { startLesson(lesson); }}
              >
                <div className="learn-lesson-number">{lesson.id}</div>
                <div className="learn-lesson-info">
                  <h3>{lesson.title}</h3>
                  <p>{lesson.description}</p>
                </div>
                <div className="learn-lesson-status">
                  {isCompleted && bestScore !== undefined && (
                    <span className="learn-lesson-score">{bestScore}/5</span>
                  )}
                  {isCompleted && <span aria-label="completed" className="learn-lesson-check" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (!activeLesson) {return null;}

  // --- Lesson (teaching phase) ---
  if (phase === 'lesson') {
    return (
      <div className="game-page">
        <div className="learn-lesson-header">
          <button className="btn-secondary learn-back-btn" onClick={() => { setPhase('menu'); }}>
            Back
          </button>
          <h2>
            Lesson {activeLesson.id}: {activeLesson.title}
          </h2>
        </div>

        <div className="learn-explanation">
          <p>{activeLesson.explanation}</p>
        </div>

        <div className="learn-examples">
          <h3>Examples</h3>
          <div className="learn-example-grid">
            {activeLesson.examples.map((ex) => (
              <div className="learn-example-row" key={ex.english}>
                <span className="learn-example-english">{ex.english}</span>
                <span aria-hidden="true" className="learn-example-arrow" />
                <span className="learn-example-ingglish">{ex.ingglish}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="learn-quiz-prompt">
          <p>Ready to test what you learned?</p>
          <button className="btn-primary" onClick={startQuiz}>
            Take the Quiz
          </button>
        </div>
      </div>
    );
  }

  // --- Quiz ---
  if (phase === 'quiz') {
    const current = activeLesson.quiz[quizIndex];
    if (!current) {return null;}

    return (
      <div className="game-page">
        <div className="game-progress">
          <span>
            {quizIndex + 1} / {activeLesson.quiz.length}
          </span>
          <div className="game-progress-bar">
            <div
              className="game-progress-fill"
              style={{ width: `${((quizIndex + 1) / activeLesson.quiz.length) * 100}%` }}
            />
          </div>
          <span className="game-tier-badge">Lesson {activeLesson.id}</span>
        </div>

        <div className="game-card">
          <div className="game-card-label">What English word is this?</div>
          <div className="learn-quiz-word">{current.ingglish}</div>
        </div>

        <div className="game-input-area">
          <input
            className="game-input"
            disabled={showFeedback}
            onChange={(e) => { setQuizInput(e.target.value); }}
            onKeyDown={handleKeyDown}
            placeholder="Type the English word..."
            ref={inputRef}
            type="text"
            value={quizInput}
          />
        </div>

        {!showFeedback && (
          <div className="game-actions">
            <button className="btn-primary" disabled={!quizInput.trim()} onClick={handleQuizSubmit}>
              Check
            </button>
          </div>
        )}

        {showFeedback && (
          <div className="game-feedback">
            {quizResults[quizIndex] === true ? (
              <div className="game-feedback-score" style={{ color: 'var(--color-success)' }}>
                Correct!
              </div>
            ) : (
              <div className="game-feedback-score" style={{ color: 'var(--color-error)' }}>
                The answer is: <strong>{current.english}</strong>
              </div>
            )}
            <div className="game-actions">
              <button className="btn-primary" onClick={handleQuizNext} ref={nextRef}>
                {quizIndex + 1 >= activeLesson.quiz.length ? 'See Results' : 'Next'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- Results ---
  const correctCount = quizResults.filter(Boolean).length;
  const totalCount = activeLesson.quiz.length;
  const pct = Math.round((correctCount / totalCount) * 100);

  return (
    <div className="game-page">
      <div className="game-results">
        <h2>Lesson {activeLesson.id} Complete!</h2>
        <div className="game-overall-score">
          {correctCount}/{totalCount}
        </div>
        <p className="game-score-label">
          {pct >= 80
            ? 'Excellent! You understand this rule well.'
            : pct >= 60
              ? 'Good work! A little more practice will help.'
              : 'Review the lesson and try again.'}
        </p>

        <div className="game-round-bars">
          {activeLesson.quiz.map((q, i) => {
            const isCorrect = quizResults[i] ?? false;
            return (
              <div className="game-round-row" key={i}>
                <span className="game-round-label">{q.ingglish}</span>
                <div className="game-round-bar">
                  <div
                    className={`game-round-fill ${isCorrect ? 'game-round-fill-good' : 'game-round-fill-bad'}`}
                    style={{ width: isCorrect ? '100%' : '0%' }}
                  />
                </div>
                <span className="learn-result-answer">{q.english}</span>
              </div>
            );
          })}
        </div>

        <div className="game-result-actions">
          <button className="btn-secondary" onClick={() => { startLesson(activeLesson); }}>
            Review Lesson
          </button>
          <button className="btn-secondary" onClick={startQuiz}>
            Retry Quiz
          </button>
          <button className="btn-primary" onClick={() => { setPhase('menu'); }}>
            Back to Lessons
          </button>
        </div>
      </div>
    </div>
  );
}

export default LearnToRead;
