import { useState, useCallback, useDeferredValue, useMemo, useEffect, useRef } from 'react';
import {
  translateSync,
  translateSyncWithMapping,
  reverseTranslate,
  reverseTranslateSyncWithMapping,
  type TranslatedToken,
} from '@ingglish/core';
import { tokenizePhonetic, type IndexedToken } from '@ingglish/core/internal';
import { useFormat } from '../contexts/FormatContext';
import { useClipboard } from '../hooks/useClipboard';
import { useSpeech } from '../hooks/useSpeech';

function SpeakerIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="6" y="6" width="12" height="12" rx="1" />
    </svg>
  );
}

const SAMPLE_TEXT = `The quick brown fox jumps over the lazy dog.
This sentence contains every letter of the English alphabet.

"Though" and "through" are spelled similarly but sound different.
English spelling is notoriously difficult to learn because it has
so many exceptions. With phonetic spelling, words
are written exactly as they sound - what you see is what you say!`;

type EditingPane = 'english' | 'ingglish';

interface WordDisplayProps {
  text: string;
  hoveredWordIndex: number | null;
  onHoverWord: (index: number | null) => void;
  className?: string;
}

function WordDisplay({ text, hoveredWordIndex, onHoverWord, className }: WordDisplayProps) {
  const tokens: IndexedToken[] = useMemo(() => tokenizePhonetic(text), [text]);

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

interface MappedWordDisplayProps {
  tokens: TranslatedToken[];
  hoveredWordIndex?: number | null;
  onHoverWord?: (index: number | null) => void;
  className?: string;
  placeholder?: string;
}

export function MappedWordDisplay({
  tokens,
  hoveredWordIndex = null,
  onHoverWord,
  className,
  placeholder = 'Hover to see word correspondence...',
}: MappedWordDisplayProps) {
  let wordIndex = 0;
  return (
    <div className={`word-display ${className ?? ''}`}>
      {tokens.map((token, i) => {
        if (token.isWord) {
          const currentWordIndex = wordIndex++;
          const isHighlighted = currentWordIndex === hoveredWordIndex;
          const matched = 'matched' in token ? (token.matched ?? true) : true;
          const changed = token.original.toLowerCase() !== token.translated.toLowerCase();
          return (
            <span
              key={i}
              className={`word-token ${isHighlighted ? 'highlighted' : ''} ${!matched ? 'unmatched' : ''}`}
              data-orig={changed ? token.original : undefined}
              onMouseEnter={
                onHoverWord
                  ? () => {
                      onHoverWord(currentWordIndex);
                    }
                  : undefined
              }
              onMouseLeave={
                onHoverWord
                  ? () => {
                      onHoverWord(null);
                    }
                  : undefined
              }
            >
              {token.translated}
            </span>
          );
        }
        return <span key={i}>{token.translated}</span>;
      })}
      {tokens.length === 0 && <span className="placeholder">{placeholder}</span>}
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
  const [copiedEnglish, copyEnglish] = useClipboard();
  const [copiedIngglish, copyIngglish] = useClipboard();
  const [copiedShare, copyShare] = useClipboard();
  const [speakingEnglish, speakEnglish, stopEnglish, speechSupported, englishCharIndex] =
    useSpeech();
  const [speakingIngglish, speakIngglish, stopIngglish, , ingglishCharIndex] = useSpeech();

  // Use deferred values to keep typing responsive
  const deferredEnglish = useDeferredValue(englishText);
  const deferredIngglish = useDeferredValue(ingglishText);

  // Compute translations based on which pane was last edited
  const computedIngglish = useMemo(() => {
    if (lastEdited !== 'english' || !deferredEnglish.trim()) {
      return null;
    }
    try {
      return translateSync(deferredEnglish, format);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Translation failed:', err);
      return null;
    }
  }, [deferredEnglish, lastEdited, format]);

  // Forward token mapping for word correspondence (with matched status)
  const forwardTokens = useMemo(() => {
    if (lastEdited !== 'english' || !deferredEnglish.trim()) {
      return null;
    }
    try {
      return translateSyncWithMapping(deferredEnglish, format);
    } catch {
      return null;
    }
  }, [deferredEnglish, lastEdited, format]);

  // Async reverse translation with useEffect
  const [computedEnglish, setComputedEnglish] = useState<string | null>(null);
  const [reverseTokens, setReverseTokens] = useState<TranslatedToken[] | null>(null);
  useEffect(() => {
    if (lastEdited !== 'ingglish' || !deferredIngglish.trim()) {
      setComputedEnglish(null);
      setReverseTokens(null);
      return;
    }
    let cancelled = false;
    reverseTranslate(deferredIngglish, format)
      .then((result) => {
        if (!cancelled) {
          setComputedEnglish(result);
          // Dictionaries are loaded now, so sync mapping is safe
          if (format === 'ingglish') {
            setReverseTokens(reverseTranslateSyncWithMapping(deferredIngglish, format));
          } else {
            setReverseTokens(null);
          }
        }
      })
      .catch((err: unknown) => {
        // eslint-disable-next-line no-console
        console.warn('Reverse translation failed:', err);
        if (!cancelled) {
          setComputedEnglish(null);
          setReverseTokens(null);
        }
      });
    return () => {
      cancelled = true;
    };
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

  const handleCopyEnglish = useCallback(() => {
    if (displayEnglish) {
      copyEnglish(displayEnglish);
    }
  }, [displayEnglish, copyEnglish]);

  const handleCopyIngglish = useCallback(() => {
    if (displayIngglish) {
      copyIngglish(displayIngglish);
    }
  }, [displayIngglish, copyIngglish]);

  const handleSpeakEnglish = useCallback(() => {
    if (speakingEnglish) {
      stopEnglish();
    } else if (displayEnglish) {
      stopIngglish();
      speakEnglish(displayEnglish);
    }
  }, [speakingEnglish, stopEnglish, displayEnglish, stopIngglish, speakEnglish]);

  const handleSpeakIngglish = useCallback(() => {
    if (speakingIngglish) {
      stopIngglish();
    } else if (displayEnglish) {
      stopEnglish();
      // Feed English text to TTS — Ingglish represents the same sounds,
      // but the browser's speech engine expects standard English spelling.
      speakIngglish(displayEnglish);
    }
  }, [speakingIngglish, stopIngglish, displayEnglish, stopEnglish, speakIngglish]);

  const handleClear = useCallback(() => {
    setEnglishText('');
    setIngglishText('');
  }, []);

  const handleShare = useCallback(() => {
    if (onShare && displayEnglish.trim()) {
      onShare(displayEnglish);
      copyShare(displayEnglish);
    }
  }, [onShare, displayEnglish, copyShare]);

  const hasContent = displayEnglish.trim().length > 0 || displayIngglish.trim().length > 0;

  // Map TTS charIndex to word index for highlighting during speech
  const spokenWordIndex = useMemo(() => {
    const charIdx = englishCharIndex ?? ingglishCharIndex;
    if (charIdx === null) {
      return null;
    }
    const tokens = tokenizePhonetic(displayEnglish);
    let pos = 0;
    for (const token of tokens) {
      const end = pos + token.text.length;
      if (token.isWord && charIdx >= pos && charIdx < end) {
        return token.wordIndex;
      }
      pos = end;
    }
    return null;
  }, [englishCharIndex, ingglishCharIndex, displayEnglish]);

  // Spoken word takes precedence over hover
  const activeWordIndex = spokenWordIndex ?? hoveredWordIndex;
  const isSpeaking = speakingEnglish || speakingIngglish;

  // Sync scroll positions between the two textareas
  const englishRef = useRef<HTMLTextAreaElement>(null);
  const ingglishRef = useRef<HTMLTextAreaElement>(null);
  const scrolling = useRef(false);

  const handleScroll = useCallback((source: 'english' | 'ingglish') => {
    if (scrolling.current) {
      return;
    }
    scrolling.current = true;
    const from = source === 'english' ? englishRef.current : ingglishRef.current;
    const to = source === 'english' ? ingglishRef.current : englishRef.current;
    if (from && to) {
      to.scrollTop = from.scrollTop;
    }
    scrolling.current = false;
  }, []);

  return (
    <div className="text-translator">
      <div className="translator-grid">
        <div className="input-section">
          <div className="section-header">
            <h2>English</h2>
            <div className="button-group">
              {speechSupported && (
                <button
                  onClick={handleSpeakEnglish}
                  className={`btn-secondary btn-icon ${speakingEnglish ? 'btn-speaking' : ''}`}
                  disabled={!displayEnglish}
                  title={speakingEnglish ? 'Stop' : 'Listen'}
                  aria-label={speakingEnglish ? 'Stop speaking' : 'Listen to English text'}
                >
                  {speakingEnglish ? <StopIcon /> : <SpeakerIcon />}
                </button>
              )}
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
            ref={englishRef}
            value={lastEdited === 'english' ? englishText : displayEnglish}
            onChange={handleEnglishChange}
            onScroll={() => {
              handleScroll('english');
            }}
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
              {speechSupported && (
                <button
                  onClick={handleSpeakIngglish}
                  className={`btn-secondary btn-icon ${speakingIngglish ? 'btn-speaking' : ''}`}
                  disabled={!displayEnglish}
                  title={speakingIngglish ? 'Stop' : 'Listen'}
                  aria-label={speakingIngglish ? 'Stop speaking' : 'Listen to Ingglish text'}
                >
                  {speakingIngglish ? <StopIcon /> : <SpeakerIcon />}
                </button>
              )}
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
            ref={ingglishRef}
            value={lastEdited === 'ingglish' ? ingglishText : displayIngglish}
            onChange={handleIngglishChange}
            onScroll={() => {
              handleScroll('ingglish');
            }}
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
            <span className="correspondence-label">
              {isSpeaking ? 'Word correspondence' : 'Hover to see word correspondence'}
            </span>
          </div>
          <div className="correspondence-grid">
            {lastEdited === 'ingglish' && reverseTokens ? (
              <MappedWordDisplay
                tokens={reverseTokens}
                hoveredWordIndex={activeWordIndex}
                onHoverWord={setHoveredWordIndex}
                className="english-words"
              />
            ) : (
              <WordDisplay
                text={displayEnglish}
                hoveredWordIndex={activeWordIndex}
                onHoverWord={setHoveredWordIndex}
                className="english-words"
              />
            )}
            {lastEdited === 'english' && forwardTokens ? (
              <MappedWordDisplay
                tokens={forwardTokens}
                hoveredWordIndex={activeWordIndex}
                onHoverWord={setHoveredWordIndex}
                className="ingglish-words"
              />
            ) : (
              <WordDisplay
                text={displayIngglish}
                hoveredWordIndex={activeWordIndex}
                onHoverWord={setHoveredWordIndex}
                className="ingglish-words"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TextTranslator;
