import { useState, useCallback, useDeferredValue, useMemo } from 'react';
import { translateText, reverseTranslateText } from '@ingglish/core';

const SAMPLE_ENGLISH = `The quick brown fox jumps over the lazy dog.
This sentence contains every letter of the English alphabet.

"Though" and "through" are spelled similarly but sound different.
English spelling is notoriously difficult to learn because it has
so many exceptions and irregularities. With Ingglish, words are
spelled exactly as they sound - no memorization needed!`;

const SAMPLE_INGGLISH = `Dhu kwik brown fahks jumps over dhu layzee dawg.
Dhis sentuns kunntaynz evree leter uv dhu Ingglish alfubet.

"Dho" and "throo" ahr speld similurlee but sownd diferunt.`;

type EditingPane = 'english' | 'ingglish';

function TextTranslator() {
  const [englishText, setEnglishText] = useState('');
  const [ingglishText, setIngglishText] = useState('');
  const [lastEdited, setLastEdited] = useState<EditingPane>('english');

  // Use deferred values to keep typing responsive
  const deferredEnglish = useDeferredValue(englishText);
  const deferredIngglish = useDeferredValue(ingglishText);

  // Compute translations based on which pane was last edited
  const computedIngglish = useMemo(() => {
    if (lastEdited !== 'english' || !deferredEnglish.trim()) return null;
    try {
      return translateText(deferredEnglish);
    } catch {
      return null;
    }
  }, [deferredEnglish, lastEdited]);

  const computedEnglish = useMemo(() => {
    if (lastEdited !== 'ingglish' || !deferredIngglish.trim()) return null;
    try {
      return reverseTranslateText(deferredIngglish);
    } catch {
      return null;
    }
  }, [deferredIngglish, lastEdited]);

  // Display values: show computed translation in the non-edited pane
  const displayEnglish = lastEdited === 'ingglish' ? (computedEnglish ?? '') : englishText;
  const displayIngglish = lastEdited === 'english' ? (computedIngglish ?? '') : ingglishText;

  const handleEnglishChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEnglishText(e.target.value);
    setLastEdited('english');
  }, []);

  const handleIngglishChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIngglishText(e.target.value);
    setLastEdited('ingglish');
  }, []);

  const handleSampleEnglish = useCallback(() => {
    setEnglishText(SAMPLE_ENGLISH);
    setLastEdited('english');
  }, []);

  const handleSampleIngglish = useCallback(() => {
    setIngglishText(SAMPLE_INGGLISH);
    setLastEdited('ingglish');
  }, []);

  const handleCopyEnglish = useCallback(async () => {
    const text = displayEnglish;
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // Silently fail
      }
    }
  }, [displayEnglish]);

  const handleCopyIngglish = useCallback(async () => {
    const text = displayIngglish;
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // Silently fail
      }
    }
  }, [displayIngglish]);

  const handleClear = useCallback(() => {
    setEnglishText('');
    setIngglishText('');
  }, []);

  return (
    <div className="text-translator">
      <div className="translator-grid">
        <div className="input-section">
          <div className="section-header">
            <h2>English</h2>
            <div className="button-group">
              <button onClick={handleSampleEnglish} className="btn-secondary">
                Sample
              </button>
              <button onClick={handleCopyEnglish} className="btn-secondary" disabled={!displayEnglish}>
                Copy
              </button>
            </div>
          </div>
          <textarea
            value={lastEdited === 'english' ? englishText : displayEnglish}
            onChange={handleEnglishChange}
            onFocus={() => {
              if (lastEdited === 'ingglish' && computedEnglish) {
                setEnglishText(computedEnglish);
                setLastEdited('english');
              }
            }}
            placeholder="Type English text here..."
            className="text-input"
            spellCheck={false}
          />
        </div>

        <div className="input-section">
          <div className="section-header">
            <h2>Ingglish</h2>
            <div className="button-group">
              <button onClick={handleSampleIngglish} className="btn-secondary">
                Sample
              </button>
              <button onClick={handleCopyIngglish} className="btn-secondary" disabled={!displayIngglish}>
                Copy
              </button>
            </div>
          </div>
          <textarea
            value={lastEdited === 'ingglish' ? ingglishText : displayIngglish}
            onChange={handleIngglishChange}
            onFocus={() => {
              if (lastEdited === 'english' && computedIngglish) {
                setIngglishText(computedIngglish);
                setLastEdited('ingglish');
              }
            }}
            placeholder="Type Ingglish text here..."
            className="text-input"
            spellCheck={false}
          />
        </div>
      </div>

      <div className="translator-actions">
        <button onClick={handleClear} className="btn-secondary">
          Clear All
        </button>
      </div>

      <div className="info-box">
        <h3>Bidirectional Translation</h3>
        <p>
          Type in either box! English → Ingglish uses the CMU dictionary. Ingglish → English may show
          different words for homophones (e.g., "too" could be "to", "too", or "two").
        </p>
      </div>
    </div>
  );
}

export default TextTranslator;
