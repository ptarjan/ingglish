import { useState, useCallback, useDeferredValue, useMemo } from 'react';
import { translateText, reverseTranslateText, reverseTranslateIPAText } from '@ingglish/core';
import { useFormat } from '../contexts/FormatContext';

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
 * Checks if a character is a "word" character (letter or IPA symbol).
 * This includes Latin letters, IPA phonetic symbols, stress markers, and word joiner.
 */
function isWordChar(char: string): boolean {
  const code = char.charCodeAt(0);

  // Basic Latin letters (A-Z, a-z)
  if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) {
    return true;
  }

  // Word joiner (U+2060) - invisible character that prevents line breaks
  if (code === 0x2060) {
    return true;
  }

  // IPA stress markers (ˈ U+02C8, ˌ U+02CC)
  if (code === 0x02c8 || code === 0x02cc) {
    return true;
  }

  // Common IPA vowels
  if (
    char === 'ə' || // schwa
    char === 'ɝ' || // r-colored schwa
    char === 'ɚ' || // r-colored schwa variant
    char === 'ʌ' || // strut
    char === 'æ' || // trap
    char === 'ɑ' || // palm
    char === 'ɔ' || // thought
    char === 'ɛ' || // dress
    char === 'ɪ' || // kit
    char === 'ʊ' // foot
  ) {
    return true;
  }

  // Common IPA consonants
  if (
    char === 'ð' || // voiced dental fricative
    char === 'θ' || // voiceless dental fricative
    char === 'ʃ' || // voiceless postalveolar fricative
    char === 'ʒ' || // voiced postalveolar fricative
    char === 'ŋ' || // velar nasal
    char === 'ɹ' || // alveolar approximant
    char === 'ɡ' // voiced velar stop (IPA g)
  ) {
    return true;
  }

  return false;
}

/**
 * Tokenizes text into words and non-words, tracking word indices.
 * Handles both Ingglish (ASCII) and IPA (Unicode) text.
 */
function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let wordIndex = 0;
  let i = 0;

  while (i < text.length) {
    // Check if starting a word
    if (isWordChar(text[i])) {
      let wordEnd = i + 1;
      while (wordEnd < text.length && isWordChar(text[wordEnd])) {
        wordEnd++;
      }
      tokens.push({
        text: text.slice(i, wordEnd),
        isWord: true,
        wordIndex: wordIndex++,
      });
      i = wordEnd;
    } else {
      // Non-word characters (punctuation, whitespace)
      let nonWordEnd = i + 1;
      while (nonWordEnd < text.length && !isWordChar(text[nonWordEnd])) {
        nonWordEnd++;
      }
      tokens.push({
        text: text.slice(i, nonWordEnd),
        isWord: false,
        wordIndex: null,
      });
      i = nonWordEnd;
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

interface TextTranslatorProps {
  initialText?: string;
  onShare?: (text: string) => void;
}

function TextTranslator({ initialText = '', onShare }: TextTranslatorProps) {
  const { format } = useFormat();
  const [englishText, setEnglishText] = useState(initialText);
  const [ingglishText, setIngglishText] = useState('');
  const [lastEdited, setLastEdited] = useState<EditingPane>('english');
  const [hoveredWordIndex, setHoveredWordIndex] = useState<number | null>(null);
  const [copiedEnglish, setCopiedEnglish] = useState(false);
  const [copiedIngglish, setCopiedIngglish] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Use deferred values to keep typing responsive
  const deferredEnglish = useDeferredValue(englishText);
  const deferredIngglish = useDeferredValue(ingglishText);

  // Compute translations based on which pane was last edited
  const computedIngglish = useMemo(() => {
    if (lastEdited !== 'english' || !deferredEnglish.trim()) {
      return null;
    }
    try {
      return translateText(deferredEnglish, format);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Translation failed:', err);
      return null;
    }
  }, [deferredEnglish, lastEdited, format]);

  const computedEnglish = useMemo(() => {
    if (lastEdited !== 'ingglish' || !deferredIngglish.trim()) {
      return null;
    }
    try {
      if (format === 'ipa') {
        return reverseTranslateIPAText(deferredIngglish);
      }
      return reverseTranslateText(deferredIngglish);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Reverse translation failed:', err);
      return null;
    }
  }, [deferredIngglish, lastEdited, format]);

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
        setCopiedEnglish(true);
        setTimeout(() => {
          setCopiedEnglish(false);
        }, 1500);
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
        setCopiedIngglish(true);
        setTimeout(() => {
          setCopiedIngglish(false);
        }, 1500);
      } catch {
        // Clipboard can fail in non-secure contexts or if permission denied - expected
      }
    }
  }, [displayIngglish]);

  const handleClear = useCallback(() => {
    setEnglishText('');
    setIngglishText('');
  }, []);

  const handleShare = useCallback(() => {
    if (onShare && displayEnglish.trim()) {
      onShare(displayEnglish);
      setCopiedShare(true);
      setTimeout(() => {
        setCopiedShare(false);
      }, 1500);
    }
  }, [onShare, displayEnglish]);

  const hasContent = displayEnglish.trim().length > 0 || displayIngglish.trim().length > 0;

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
                className={`btn-secondary ${copiedEnglish ? 'btn-copied' : ''}`}
                disabled={!displayEnglish}
              >
                {copiedEnglish ? 'Copied!' : 'Copy'}
              </button>
              {onShare && (
                <button
                  onClick={handleShare}
                  className={`btn-secondary ${copiedShare ? 'btn-copied' : ''}`}
                  disabled={!hasContent}
                >
                  {copiedShare ? 'Copied!' : 'Share'}
                </button>
              )}
              <button onClick={handleClear} className="btn-secondary" disabled={!hasContent}>
                Clear
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
            <h2>{format === 'ingglish' ? 'Ingglish' : 'IPA'}</h2>
            <div className="button-group">
              <button
                onClick={handleCopyIngglish}
                className={`btn-secondary ${copiedIngglish ? 'btn-copied' : ''}`}
                disabled={!displayIngglish}
              >
                {copiedIngglish ? 'Copied!' : 'Copy'}
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
            placeholder={
              format === 'ingglish' ? 'Taip Ingglish tekst heer...' : '/taɪp aɪ piː eɪ hɪɹ.../'
            }
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
    </div>
  );
}

export default TextTranslator;
