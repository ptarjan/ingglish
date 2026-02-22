import { startTransition, useEffect, useRef, useState } from 'react';
import { poemWords } from '../../data/tutorial-data';
import { useScrollReveal } from '../../hooks/useScrollReveal';

export function Section7Poem() {
  const { ref, visible } = useScrollReveal<HTMLElement>(0.3);
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  // Bumped to restart the auto-advance effect (replay or unpause)
  const [advanceToken, setAdvanceToken] = useState(0);

  const totalSteps = 24;
  const finished = step > totalSteps;
  const advancing = visible && !finished && !paused;

  // Auto-advance steps once visible (24 lines, one at a time).
  // Uses a ref to read step without depending on it, so the effect
  // only re-runs when visibility/pause/replay changes.
  const stepRef = useRef(step);
  stepRef.current = step;

  useEffect(() => {
    if (!visible || paused) {
      return;
    }

    const currentStep = stepRef.current;
    if (currentStep > totalSteps) {
      return;
    }

    const delayMs = 1000;
    const initialDelayMs = currentStep === 0 ? 1500 : delayMs;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStep(totalSteps + 1);
      return;
    }

    const remaining = totalSteps + 1 - currentStep;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= remaining; i++) {
      timers.push(
        setTimeout(
          () => {
            startTransition(() => {
              setStep(currentStep + i);
            });
          },
          initialDelayMs + (i - 1) * delayMs
        )
      );
    }

    return () => {
      timers.forEach((t) => {
        clearTimeout(t);
      });
    };
  }, [visible, paused, advanceToken]);

  return (
    <section ref={ref} className="tutorial-section">
      <h2 className="tutorial-heading">Hints on Pronunciation for Foreigners</h2>
      <p className="poem-attribution">&mdash; attributed to T.S. Watt, 1954</p>
      <div className="poem-paragraph">
        <div className="poem-controls">
          {advancing && (
            <button
              className="poem-control-btn"
              onClick={() => {
                setPaused(true);
              }}
              title="Pause"
            >
              &#x23f8;
            </button>
          )}
          {paused && !finished && (
            <button
              className="poem-control-btn"
              onClick={() => {
                setPaused(false);
              }}
              title="Play"
            >
              &#x25b6;
            </button>
          )}
          {finished && (
            <button
              className="poem-control-btn"
              onClick={() => {
                setStep(0);
                setPaused(false);
                setAdvanceToken((c) => c + 1);
              }}
              title="Replay"
            >
              &#x21bb;
            </button>
          )}
        </div>
        <div className="poem-text-sizer">
          {/* Hidden sizer: renders fully-translated text to reserve max height */}
          <p className="poem-text poem-text-hidden" aria-hidden="true">
            {poemWords.map((w, i) => {
              if (w.e === '\n') {
                return <br key={i} />;
              }
              return (
                <span key={i}>
                  <span className="poem-word">{w.s > 0 ? w.i : w.e}</span>{' '}
                </span>
              );
            })}
          </p>
          {/* Visible poem with animation */}
          <p className="poem-text">
            {poemWords.map((w, i) => {
              if (w.e === '\n') {
                return <br key={i} />;
              }
              const transformed = step >= w.s && w.s > 0;
              const actuallyChanged = w.e.toLowerCase() !== w.i.toLowerCase();
              const justChanged = step === w.s && w.s > 0 && actuallyChanged;
              const display = transformed ? w.i : w.e;
              return (
                <span key={i}>
                  <span
                    className={`poem-word${transformed && actuallyChanged ? ' transformed' : ''}${justChanged ? ' highlighted' : ''}`}
                    data-orig={transformed && actuallyChanged ? w.e : undefined}
                  >
                    {display}
                  </span>{' '}
                </span>
              );
            })}
          </p>
        </div>
      </div>
    </section>
  );
}
