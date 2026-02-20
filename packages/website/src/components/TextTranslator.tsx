import { useState, useCallback, useDeferredValue, useMemo, useEffect, useRef } from 'react';
import {
  translateSync,
  translateSyncWithMapping,
  reverseTranslate,
  reverseTranslateSyncWithMapping,
  type TranslatedToken,
} from 'ingglish';
import { tokenizePhonetic, type IndexedToken } from '@ingglish/tokenize';
import { getFormatLabel } from '@ingglish/phonemes';
import { useFormat } from '../contexts/FormatContext';
import { useClipboard } from '../hooks/useClipboard';
import { useShare } from '../hooks/useShare';
import { useSpeech } from '../hooks/useSpeech';
import { buildDiffMap } from '../utils/diff-map';
import { isAllCaps } from '../utils/text';
import { SAMPLE_TEXT } from '../utils/sample-text';

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

type EditingPane = 'english' | 'ingglish';

interface WordDisplayProps {
  text: string;
  hoveredWordIndex: number | null;
  spokenWordIndex?: number | null;
  onHoverWord?: (index: number | null) => void;
  className?: string;
  scrollRef?: React.Ref<HTMLDivElement>;
  onScroll?: () => void;
}

function WordDisplay({
  text,
  hoveredWordIndex,
  spokenWordIndex = null,
  onHoverWord,
  className,
  scrollRef,
  onScroll,
}: WordDisplayProps) {
  const tokens: IndexedToken[] = useMemo(() => tokenizePhonetic(text), [text]);

  return (
    <div ref={scrollRef} onScroll={onScroll} className={`word-display ${className ?? ''}`}>
      {tokens.map((token, i) => {
        if (token.isWord) {
          const isHighlighted = token.wordIndex === hoveredWordIndex;
          const isSpoken = token.wordIndex === spokenWordIndex;
          return (
            <span
              key={i}
              className={`word-token ${isHighlighted ? 'highlighted' : ''} ${isSpoken ? 'spoken' : ''}`}
              onMouseEnter={
                onHoverWord
                  ? () => {
                      onHoverWord(token.wordIndex);
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
  spokenWordIndex?: number | null;
  onHoverWord?: (index: number | null) => void;
  className?: string;
  placeholder?: string;
  scrollRef?: React.Ref<HTMLDivElement>;
  onScroll?: () => void;
  showTooltip?: boolean;
  /** Map of word index → standard Ingglish spelling for words that differ from experiment */
  diffMap?: Map<number, string>;
}

export function MappedWordDisplay({
  tokens,
  hoveredWordIndex = null,
  spokenWordIndex = null,
  onHoverWord,
  className,
  placeholder = 'Hover to see word correspondence...',
  scrollRef,
  onScroll,
  showTooltip = true,
  diffMap,
}: MappedWordDisplayProps) {
  let wordIndex = 0;
  return (
    <div ref={scrollRef} onScroll={onScroll} className={`word-display ${className ?? ''}`}>
      {tokens.map((token, i) => {
        if (token.isWord) {
          const currentWordIndex = wordIndex++;
          const isHighlighted = currentWordIndex === hoveredWordIndex;
          const isSpoken = currentWordIndex === spokenWordIndex;
          const matched = 'matched' in token ? (token.matched ?? true) : true;
          const changed = token.original.toLowerCase() !== token.translated.toLowerCase();
          const stdSpelling = diffMap?.get(currentWordIndex);
          const isDiff = stdSpelling !== undefined;

          let tooltip: string | undefined;
          if (showTooltip && changed) {
            tooltip = isDiff ? `${token.original} (Ingglish: ${stdSpelling})` : token.original;
          }

          return (
            <span
              key={i}
              className={`word-token ${isHighlighted ? 'highlighted' : ''} ${isSpoken ? 'spoken' : ''} ${!matched ? 'unmatched' : ''} ${isDiff ? 'format-diff' : ''}`}
              data-orig={tooltip}
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
  onShare?: (text: string) => string;
}

function TextTranslator({ initialText = '', onShare }: TextTranslatorProps) {
  const { format, toggleFormat } = useFormat();
  const [englishText, setEnglishText] = useState(initialText);
  const [ingglishText, setIngglishText] = useState('');
  const [lastEdited, setLastEdited] = useState<EditingPane>('english');
  const [hoveredWordIndex, setHoveredWordIndex] = useState<number | null>(null);
  const [copiedEnglish, copyEnglish] = useClipboard();
  const [copiedIngglish, copyIngglish] = useClipboard();
  const [copiedShare, shareUrl] = useShare();
  const [speakingEnglish, speakEnglish, stopEnglish, speechSupported, spokenWordCount] =
    useSpeech();

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

  // Diff map: word index → standard Ingglish spelling (for non-ingglish formats)
  const diffMap = useMemo(() => {
    if (forwardTokens === null) {
      return undefined;
    }
    return buildDiffMap(forwardTokens, deferredEnglish, format);
  }, [format, forwardTokens, deferredEnglish]);

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
          setReverseTokens(reverseTranslateSyncWithMapping(deferredIngglish, format));
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

  const handleSpeak = useCallback(() => {
    if (speakingEnglish) {
      stopEnglish();
    } else if (displayEnglish) {
      // Collapse newlines to spaces so TTS doesn't pause at each line
      speakEnglish(displayEnglish.replace(/\n+/g, ' '));
    }
  }, [speakingEnglish, stopEnglish, displayEnglish, speakEnglish]);

  const handleClear = useCallback(() => {
    setEnglishText('');
    setIngglishText('');
  }, []);

  const handleShare = useCallback(() => {
    if (onShare && displayEnglish.trim()) {
      const url = onShare(displayEnglish);
      shareUrl(url, 'Ingglish Text Translation');
    }
  }, [onShare, displayEnglish, shareUrl]);

  const hasContent = displayEnglish.trim().length > 0 || displayIngglish.trim().length > 0;

  // TTS word count maps directly to word index in the correspondence display
  const spokenWordIndex = spokenWordCount;

  // Both hover and TTS highlights work independently
  const isSpeaking = speakingEnglish;

  // Auto-scroll the highlighted word into view during TTS
  const corrEnglishRef = useRef<HTMLDivElement>(null);
  const corrIngglishRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (spokenWordIndex === null) {
      return;
    }
    const el =
      corrEnglishRef.current?.querySelector('.word-token.spoken') ??
      corrIngglishRef.current?.querySelector('.word-token.spoken');
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [spokenWordIndex]);

  // Sync scroll positions between paired panes
  const englishRef = useRef<HTMLTextAreaElement>(null);
  const ingglishRef = useRef<HTMLTextAreaElement>(null);
  const scrolling = useRef(false);

  const syncScroll = useCallback((from: Element | null, to: Element | null) => {
    if (scrolling.current || !from || !to) {
      return;
    }
    scrolling.current = true;
    to.scrollTop = from.scrollTop;
    scrolling.current = false;
  }, []);

  const handleScroll = useCallback(
    (source: 'english' | 'ingglish') => {
      syncScroll(
        source === 'english' ? englishRef.current : ingglishRef.current,
        source === 'english' ? ingglishRef.current : englishRef.current
      );
    },
    [syncScroll]
  );

  const handleCorrScroll = useCallback(
    (source: 'english' | 'ingglish') => {
      syncScroll(
        source === 'english' ? corrEnglishRef.current : corrIngglishRef.current,
        source === 'english' ? corrIngglishRef.current : corrEnglishRef.current
      );
    },
    [syncScroll]
  );

  return (
    <div className="text-translator">
      <div className="translator-grid">
        <div className="input-section">
          <div className="section-header">
            <h2>English</h2>
            <div className="button-group">
              {speechSupported && (
                <button
                  onClick={handleSpeak}
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

        <div className="input-section ingglish-section">
          <div className="section-header">
            <h2>
              <button
                className="format-cycle-btn"
                onClick={toggleFormat}
                title="Cycle output format"
              >
                {getFormatLabel(format)}
                <span className="format-cycle-icon" aria-hidden="true">
                  &#x21C5;
                </span>
              </button>
            </h2>
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
              (
                {
                  ingglish: 'Taip Ingglish tekst heer...',
                  ipa: '/taɪp aɪ piː eɪ hɪɹ.../',
                  shavian: '𐑑𐑲𐑐 𐑖𐑱𐑝𐑾𐑯 𐑣𐑽...',
                  deseret: '𐐻𐐴𐐹 𐐼𐐯𐑅𐐨𐑉𐐯𐐻 𐐸𐐮𐑉...',
                } as Record<string, string>
              )[format] ?? ''
            }
            className="text-input"
            spellCheck={false}
          />
        </div>
      </div>

      {lastEdited === 'english' && isAllCaps(englishText) && (
        <div className="warning-message">
          Ingglish is case-sensitive — type in normal case for accurate translations.
        </div>
      )}

      {hasContent && (
        <div className={`word-correspondence ${isSpeaking ? 'speaking' : ''}`}>
          <div className="correspondence-header">
            <span className="correspondence-label">
              {isSpeaking ? 'Word correspondence' : 'Hover to see word correspondence'}
            </span>
          </div>
          <div className="correspondence-grid">
            {lastEdited === 'ingglish' && reverseTokens ? (
              <MappedWordDisplay
                tokens={reverseTokens}
                hoveredWordIndex={hoveredWordIndex}
                spokenWordIndex={spokenWordIndex}
                onHoverWord={setHoveredWordIndex}
                className="english-words"
                scrollRef={corrEnglishRef}
                onScroll={() => {
                  handleCorrScroll('english');
                }}
              />
            ) : (
              <WordDisplay
                text={displayEnglish}
                hoveredWordIndex={hoveredWordIndex}
                spokenWordIndex={spokenWordIndex}
                onHoverWord={setHoveredWordIndex}
                className="english-words"
                scrollRef={corrEnglishRef}
                onScroll={() => {
                  handleCorrScroll('english');
                }}
              />
            )}
            {lastEdited === 'english' && forwardTokens ? (
              <MappedWordDisplay
                tokens={forwardTokens}
                hoveredWordIndex={hoveredWordIndex}
                spokenWordIndex={spokenWordIndex}
                onHoverWord={setHoveredWordIndex}
                showTooltip={diffMap !== undefined}
                className="ingglish-words"
                scrollRef={corrIngglishRef}
                onScroll={() => {
                  handleCorrScroll('ingglish');
                }}
                diffMap={diffMap}
              />
            ) : (
              <WordDisplay
                text={displayIngglish}
                hoveredWordIndex={hoveredWordIndex}
                spokenWordIndex={spokenWordIndex}
                onHoverWord={setHoveredWordIndex}
                className="ingglish-words"
                scrollRef={corrIngglishRef}
                onScroll={() => {
                  handleCorrScroll('ingglish');
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TextTranslator;
