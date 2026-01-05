import { useState, useCallback, useRef } from 'react';
import { translateText } from '@inglish/core';

const SAMPLE_TEXT = `The quick brown fox jumps over the lazy dog.
This sentence contains every letter of the English alphabet.

"Though" and "through" are spelled similarly but sound different.
English spelling is notoriously difficult to learn because it has
so many exceptions and irregularities. With Inglish, words are
spelled exactly as they sound - no memorization needed!`;

function TextTranslator() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);

    // Debounce translation
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!text.trim()) {
      setOutputText('');
      return;
    }

    setIsTranslating(true);
    debounceRef.current = setTimeout(() => {
      try {
        const translated = translateText(text);
        setOutputText(translated);
      } catch (err) {
        setOutputText('Error translating text');
      } finally {
        setIsTranslating(false);
      }
    }, 150);
  }, []);

  const handleSampleClick = useCallback(() => {
    setInputText(SAMPLE_TEXT);
    try {
      const translated = translateText(SAMPLE_TEXT);
      setOutputText(translated);
    } catch (err) {
      setOutputText('Error translating text');
    }
  }, []);

  const handleCopy = useCallback(async () => {
    if (outputText) {
      try {
        await navigator.clipboard.writeText(outputText);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  }, [outputText]);

  const handleClear = useCallback(() => {
    setInputText('');
    setOutputText('');
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
              Inglish
              {isTranslating && <span className="translating-indicator"> (translating...)</span>}
            </h2>
            <button
              onClick={handleCopy}
              className="btn-secondary"
              disabled={!outputText}
            >
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
          Inglish translates English words to their phonetic spellings using the
          CMU Pronouncing Dictionary. Each sound maps to exactly one spelling:
        </p>
        <ul>
          <li><strong>ee</strong> = long "e" (bee, see)</li>
          <li><strong>ai</strong> = long "i" (my, time)</li>
          <li><strong>oh</strong> = long "o" (go, show)</li>
          <li><strong>th</strong> = voiceless (think)</li>
          <li><strong>dh</strong> = voiced (the, this)</li>
        </ul>
      </div>
    </div>
  );
}

export default TextTranslator;
