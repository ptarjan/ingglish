import { useState, useCallback, useDeferredValue, useMemo } from 'react';
import { translateText, reverseTranslateText } from '@ingglish/core';

const SAMPLE_TEXT = `The quick brown fox jumps over the lazy dog.
This sentence contains every letter of the English alphabet.

"Though" and "through" are spelled similarly but sound different.
English spelling is notoriously difficult to learn because it has
so many exceptions. With phonetic spelling, words
are written exactly as they sound - what you see is what you say!`;

type EditingPane = 'english' | 'ingglish';

interface Token {
  text: string;
  isWord: boolean;
  wordIndex: number | null;
}

/**
 * Tokenizes text into words and non-words, tracking word indices.
 */
function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  const regex = /([a-zA-Z]+)|([^a-zA-Z]+)/g;
  let match;
  let wordIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      // Word
      tokens.push({ text: match[1], isWord: true, wordIndex: wordIndex++ });
    } else if (match[2]) {
      // Non-word (punctuation, whitespace)
      tokens.push({ text: match[2], isWord: false, wordIndex: null });
    }
  }

  return tokens;
}

interface WordDisplayProps {
  text: string;
  hoveredWordIndex: number | null;
  onHoverWord: (index: number | null) => void;
  className?: string;
}

function WordDisplay({ text, hoveredWordIndex, onHoverWord, className }: WordDisplayProps) {
  const tokens = useMemo(() => tokenize(text), [text]);

  return (
    <div className={`word-display ${className ?? ''}`}>
      {tokens.map((token, i) => {
        if (token.isWord) {
          const isHighlighted = token.wordIndex === hoveredWordIndex;
          return (
            <span
              key={i}
              className={`word-token ${isHighlighted ? 'highlighted' : ''}`}
              onMouseEnter={() => {
                onHoverWord(token.wordIndex);
              }}
              onMouseLeave={() => {
                onHoverWord(null);
              }}
            >
              {token.text}
            </span>
          );
        }
        // Preserve whitespace and newlines
        return <span key={i}>{token.text}</span>;
      })}
      {tokens.length === 0 && (
        <span className="placeholder">Hover to see word correspondence...</span>
      )}
    </div>
  );
}

function TextTranslator() {
  const [englishText, setEnglishText] = useState('');
  const [ingglishText, setIngglishText] = useState('');
  const [lastEdited, setLastEdited] = useState<EditingPane>('english');
  const [hoveredWordIndex, setHoveredWordIndex] = useState<number | null>(null);

  // Use deferred values to keep typing responsive
  const deferredEnglish = useDeferredValue(englishText);
  const deferredIngglish = useDeferredValue(ingglishText);

  // Compute translations based on which pane was last edited
  const computedIngglish = useMemo(() => {
    if (lastEdited !== 'english' || !deferredEnglish.trim()) {
      return null;
    }
    try {
      return translateText(deferredEnglish);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Translation failed:', err);
      return null;
    }
  }, [deferredEnglish, lastEdited]);

  const computedEnglish = useMemo(() => {
    if (lastEdited !== 'ingglish' || !deferredIngglish.trim()) {
      return null;
    }
    try {
      return reverseTranslateText(deferredIngglish);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Reverse translation failed:', err);
      return null;
    }
  }, [deferredIngglish, lastEdited]);

  // Display values: show computed translation in the non-edited pane
  // Fall back to the stored text (not empty) during deferred value transitions
  const displayEnglish = lastEdited === 'ingglish' ? (computedEnglish ?? englishText) : englishText;
  const displayIngglish =
    lastEdited === 'english' ? (computedIngglish ?? ingglishText) : ingglishText;

  const handleEnglishChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEnglishText(e.target.value);
    setLastEdited('english');
  }, []);

  const handleIngglishChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIngglishText(e.target.value);
    setLastEdited('ingglish');
  }, []);

  const handleSample = useCallback(() => {
    setEnglishText(SAMPLE_TEXT);
    setLastEdited('english');
  }, []);

  const handleCopyEnglish = useCallback(async () => {
    const text = displayEnglish;
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // Clipboard can fail in non-secure contexts or if permission denied - expected
      }
    }
  }, [displayEnglish]);

  const handleCopyIngglish = useCallback(async () => {
    const text = displayIngglish;
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // Clipboard can fail in non-secure contexts or if permission denied - expected
      }
    }
  }, [displayIngglish]);

  const handleClear = useCallback(() => {
    setEnglishText('');
    setIngglishText('');
  }, []);

  const hasContent = displayEnglish.trim() || displayIngglish.trim();

  return (
    <div className="text-translator">
      <div className="translator-grid">
        <div className="input-section">
          <div className="section-header">
            <h2>English</h2>
            <div className="button-group">
              <button onClick={handleSample} className="btn-secondary">
                Sample
              </button>
              <button
                onClick={handleCopyEnglish}
                className="btn-secondary"
                disabled={!displayEnglish}
              >
                Copy
              </button>
            </div>
          </div>
          <textarea
            value={lastEdited === 'english' ? englishText : displayEnglish}
            onChange={handleEnglishChange}
            onFocus={() => {
              if (lastEdited === 'ingglish' && computedEnglish !== null) {
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
              <button
                onClick={handleCopyIngglish}
                className="btn-secondary"
                disabled={!displayIngglish}
              >
                Copy
              </button>
            </div>
          </div>
          <textarea
            value={lastEdited === 'ingglish' ? ingglishText : displayIngglish}
            onChange={handleIngglishChange}
            onFocus={() => {
              if (lastEdited === 'english' && computedIngglish !== null) {
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

      {hasContent && (
        <div className="word-correspondence">
          <div className="correspondence-header">
            <span className="correspondence-label">Hover to see word correspondence</span>
          </div>
          <div className="correspondence-grid">
            <WordDisplay
              text={displayEnglish}
              hoveredWordIndex={hoveredWordIndex}
              onHoverWord={setHoveredWordIndex}
              className="english-words"
            />
            <WordDisplay
              text={displayIngglish}
              hoveredWordIndex={hoveredWordIndex}
              onHoverWord={setHoveredWordIndex}
              className="ingglish-words"
            />
          </div>
        </div>
      )}

      <div className="translator-actions">
        <button onClick={handleClear} className="btn-secondary">
          Clear All
        </button>
      </div>
    </div>
  );
}

export default TextTranslator;
