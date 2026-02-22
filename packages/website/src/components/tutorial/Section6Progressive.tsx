import { startTransition, useEffect, useRef, useState } from 'react';
import { paragraphWords, stepCaptions } from '../../data/tutorial-data';

export function Section6Progressive() {
  const totalSteps = stepCaptions.length - 1;
  const [currentStep, setCurrentStep] = useState(0);

  const textRef = useRef<HTMLParagraphElement>(null);
  const [lockedHeight, setLockedHeight] = useState<null | number>(null);

  // Lock the text height on mount (step 0 = English text, generally tallest)
  // so the controls below don't shift when words transform to shorter spellings.
  useEffect(() => {
    if (textRef.current && lockedHeight === null) {
      setLockedHeight(textRef.current.scrollHeight);
    }
  }, [lockedHeight]);

  return (
    <section className="tutorial-section">
      <h2 className="tutorial-heading">See it in action</h2>
      <div className="progressive-paragraph">
        <p
          className="progressive-text"
          ref={textRef}
          style={lockedHeight === null ? undefined : { minHeight: lockedHeight }}
        >
          {paragraphWords.map((w, i) => {
            const transformed = w.step > 0 && currentStep >= w.step;
            const justTransformed = w.step > 0 && currentStep === w.step;
            const displayWord = transformed ? w.ingglish : w.english;
            const actuallyChanged = w.english.toLowerCase() !== w.ingglish.toLowerCase();
            return (
              <span key={i}>
                <span
                  className={`progressive-word${transformed ? ' transformed' : ''}${justTransformed ? ' highlighted' : ''}`}
                  data-orig={transformed && actuallyChanged ? w.english : undefined}
                >
                  {displayWord}
                </span>
                {w.trailing ?? ''}{' '}
              </span>
            );
          })}
        </p>
        <p className="progressive-caption">
          {currentStep > 0 ? stepCaptions[currentStep] : '\u00A0'}
        </p>
        <p
          className="progressive-caption"
          style={{ visibility: currentStep > 0 ? 'visible' : 'hidden' }}
        >
          Hover any blue word to see the original.
        </p>
        <div className="progressive-controls">
          <button
            className="progressive-btn"
            disabled={currentStep === 0}
            onClick={() => {
              startTransition(() => {
                setCurrentStep((s) => Math.max(0, s - 1));
              });
            }}
          >
            &larr; Back
          </button>
          <span className="progressive-indicator">
            {currentStep === 0 ? 'Original' : `Step ${currentStep} of ${totalSteps}`}
          </span>
          <button
            className="progressive-btn progressive-btn-next"
            disabled={currentStep === totalSteps}
            onClick={() => {
              startTransition(() => {
                setCurrentStep((s) => Math.min(totalSteps, s + 1));
              });
            }}
          >
            Next &rarr;
          </button>
        </div>
      </div>
    </section>
  );
}
