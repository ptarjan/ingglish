import { useState, useCallback, useDeferredValue, useMemo } from 'react';
import { translateText } from '@ingglish/core';

const SAMPLE_TEXT = `The quick brown fox jumps over the lazy dog.
This sentence contains every letter of the English alphabet.

"Though" and "through" are spelled similarly but sound different.
English spelling is notoriously difficult to learn because it has
so many exceptions and irregularities. With Ingglish, words are
spelled exactly as they sound - no memorization needed!`;

function TextTranslator() {
  const [inputText, setInputText] = useState('');

  // Use deferred value to keep typing responsive
  const deferredText = useDeferredValue(inputText);
  const isTranslating = deferredText !== inputText;

  // Memoize translation to only run when deferred text changes
  const outputText = useMemo(() => {
    if (!deferredText.trim()) {
      return '';
    }
    try {
      return translateText(deferredText);
    } catch {
      return 'Error translating text';
    }
  }, [deferredText]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  }, []);

  const handleSampleClick = useCallback(() => {
    setInputText(SAMPLE_TEXT);
  }, []);

  const handleCopy = useCallback(async () => {
    if (outputText) {
      try {
        await navigator.clipboard.writeText(outputText);
      } catch {
        // Silently fail - clipboard API may not be available
      }
    }
  }, [outputText]);

  const handleClear = useCallback(() => {
    setInputText('');
  }, []);

  return (
    <div className="text-translator">
      <div className="translator-grid">
        <div className="input-section">
          <div className="section-header">
            <h2>English</h2>
            <div className="button-group">
              <button onClick={handleSampleClick} className="btn-secondary">
                Try Sample
              </button>
              <button onClick={handleClear} className="btn-secondary">
                Clear
              </button>
            </div>
          </div>
          <textarea
            value={inputText}
            onChange={handleInputChange}
            placeholder="Type or paste English text here..."
            className="text-input"
            spellCheck={false}
          />
        </div>

        <div className="output-section">
          <div className="section-header">
            <h2>
              Ingglish
              {isTranslating && <span className="translating-indicator"> (translating...)</span>}
            </h2>
            <button onClick={handleCopy} className="btn-secondary" disabled={!outputText}>
              Copy
            </button>
          </div>
          <div className="text-output">
            {outputText || <span className="placeholder">Translation will appear here...</span>}
          </div>
        </div>
      </div>

      <div className="info-box">
        <h3>How it works</h3>
        <p>
          Ingglish translates English words to their phonetic spellings using the CMU Pronouncing
          Dictionary. Each sound maps to exactly one spelling:
        </p>
        <ul>
          <li>
            <strong>ee</strong> = long "e" (bee, see)
          </li>
          <li>
            <strong>ai</strong> = long "i" (my, time)
          </li>
          <li>
            <strong>oh</strong> = long "o" (go, show)
          </li>
          <li>
            <strong>th</strong> = voiceless (think)
          </li>
          <li>
            <strong>dh</strong> = voiced (the, this)
          </li>
        </ul>
      </div>
    </div>
  );
}

export default TextTranslator;
