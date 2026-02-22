import type { TranslatedToken } from 'ingglish';
import {
  reverseTranslate,
  reverseTranslateSyncWithMapping,
  translateSync,
  translateSyncWithMapping,
} from 'ingglish';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { getFormatLabel } from '@ingglish/phonemes';
import { type IndexedToken, tokenizePhonetic } from '@ingglish/tokenize';
import { trackShare, trackSpeak, trackTextTranslate } from '../analytics';
import { useFormat } from '../contexts/FormatContext';
import { pickRandomPassage } from '../data/sample-text';
import { useClipboard } from '../hooks/useClipboard';
import { useShare } from '../hooks/useShare';
import { useSpeech } from '../hooks/useSpeech';
import { MappedWordDisplay } from './MappedWordDisplay';
import { buildDiffMap } from './diff-map';

type EditingPane = 'english' | 'ingglish';

interface TextTranslatorProps {
  initialText?: string;
  onShare?: (text: string) => string;
}

interface WordDisplayProps {
  className?: string;
  hoveredWordIndex: null | number;
  onHoverWord?: (index: null | number) => void;
  onScroll?: () => void;
  scrollRef?: React.Ref<HTMLDivElement>;
  spokenWordIndex?: null | number;
  text: string;
}

/** Returns true if the text is ALL CAPS (2+ letters). Ingglish is case-sensitive. */
function isAllCaps(text: string): boolean {
  const letters = text.replaceAll(/[^a-z]/gi, '');
  return letters.length >= 2 && letters === letters.toUpperCase();
}

function SpeakerIcon() {
  return (
    <svg
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
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
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <rect height="12" rx="1" width="12" x="6" y="6" />
    </svg>
  );
}

function TextTranslator({ initialText = '', onShare }: TextTranslatorProps) {
  const { format, toggleFormat } = useFormat();
  const [englishText, setEnglishText] = useState(initialText);
  const [ingglishText, setIngglishText] = useState('');
  const [lastEdited, setLastEdited] = useState<EditingPane>('english');
  const [hoveredWordIndex, setHoveredWordIndex] = useState<null | number>(null);
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
    } catch (error) {
      console.warn('Translation failed:', error);
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
      return;
    }
    return buildDiffMap(forwardTokens, deferredEnglish, format);
  }, [format, forwardTokens, deferredEnglish]);

  // Async reverse translation with useEffect
  const [computedEnglish, setComputedEnglish] = useState<null | string>(null);
  const [reverseTokens, setReverseTokens] = useState<null | TranslatedToken[]>(null);
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
      .catch((error: unknown) => {
        console.warn('Reverse translation failed:', error);
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

  const handleRandom = useCallback(() => {
    const text = pickRandomPassage(englishText);
    setEnglishText(text);
    setLastEdited('english');
    trackTextTranslate(text.length, format);
  }, [format, englishText]);

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
      trackSpeak();
      // Collapse newlines to spaces so TTS doesn't pause at each line
      speakEnglish(displayEnglish.replaceAll(/\n+/g, ' '));
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
      trackShare('text', typeof navigator.share === 'function' ? 'webshare' : 'clipboard');
    }
  }, [onShare, displayEnglish, shareUrl]);

  // Track typed text with debounce
  useEffect(() => {
    if (lastEdited !== 'english' || !deferredEnglish.trim()) {
      return;
    }
    const timer = setTimeout(() => {
      trackTextTranslate(deferredEnglish.length, format);
    }, 2000);
    return () => {
      clearTimeout(timer);
    };
  }, [deferredEnglish, lastEdited, format]);

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
                  aria-label={speakingEnglish ? 'Stop speaking' : 'Listen to English text'}
                  className={`btn-secondary btn-icon ${speakingEnglish ? 'btn-speaking' : ''}`}
                  disabled={!displayEnglish}
                  onClick={handleSpeak}
                  title={speakingEnglish ? 'Stop' : 'Listen'}
                >
                  {speakingEnglish ? <StopIcon /> : <SpeakerIcon />}
                </button>
              )}
              <button className="btn-secondary" onClick={handleRandom}>
                Random
              </button>
              <button
                className={`btn-secondary ${copiedEnglish ? 'btn-copied' : ''}`}
                disabled={!displayEnglish}
                onClick={handleCopyEnglish}
              >
                {copiedEnglish ? 'Copied!' : 'Copy'}
              </button>
              {onShare && (
                <button
                  className={`btn-secondary ${copiedShare ? 'btn-copied' : ''}`}
                  disabled={!hasContent}
                  onClick={handleShare}
                >
                  {copiedShare ? 'Copied!' : 'Share'}
                </button>
              )}
              <button className="btn-secondary" disabled={!hasContent} onClick={handleClear}>
                Clear
              </button>
            </div>
          </div>
          <textarea
            className="text-input"
            onChange={handleEnglishChange}
            onFocus={() => {
              if (lastEdited === 'ingglish' && computedEnglish !== null) {
                setEnglishText(computedEnglish);
                setLastEdited('english');
              }
            }}
            onScroll={() => {
              handleScroll('english');
            }}
            placeholder="Type English text here..."
            ref={englishRef}
            spellCheck={false}
            value={lastEdited === 'english' ? englishText : displayEnglish}
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
                <span aria-hidden="true" className="format-cycle-icon">
                  &#x21C5;
                </span>
              </button>
            </h2>
            <div className="button-group">
              <button
                className={`btn-secondary ${copiedIngglish ? 'btn-copied' : ''}`}
                disabled={!displayIngglish}
                onClick={handleCopyIngglish}
              >
                {copiedIngglish ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <textarea
            className="text-input"
            onChange={handleIngglishChange}
            onFocus={() => {
              if (lastEdited === 'english' && computedIngglish !== null) {
                setIngglishText(computedIngglish);
                setLastEdited('ingglish');
              }
            }}
            onScroll={() => {
              handleScroll('ingglish');
            }}
            placeholder={
              (
                {
                  deseret: '𐐻𐐴𐐹 𐐼𐐯𐑅𐐨𐑉𐐯𐐻 𐐸𐐮𐑉...',
                  ingglish: 'Taip Ingglish tekst heer...',
                  ipa: '/taɪp aɪ piː eɪ hɪɹ.../',
                  shavian: '𐑑𐑲𐑐 𐑖𐑱𐑝𐑾𐑯 𐑣𐑽...',
                } as Record<string, string>
              )[format] ?? ''
            }
            ref={ingglishRef}
            spellCheck={false}
            value={lastEdited === 'ingglish' ? ingglishText : displayIngglish}
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
                className="english-words"
                hoveredWordIndex={hoveredWordIndex}
                onHoverWord={setHoveredWordIndex}
                onScroll={() => {
                  handleCorrScroll('english');
                }}
                scrollRef={corrEnglishRef}
                spokenWordIndex={spokenWordIndex}
                tokens={reverseTokens}
              />
            ) : (
              <WordDisplay
                className="english-words"
                hoveredWordIndex={hoveredWordIndex}
                onHoverWord={setHoveredWordIndex}
                onScroll={() => {
                  handleCorrScroll('english');
                }}
                scrollRef={corrEnglishRef}
                spokenWordIndex={spokenWordIndex}
                text={displayEnglish}
              />
            )}
            {lastEdited === 'english' && forwardTokens ? (
              <MappedWordDisplay
                className="ingglish-words"
                diffMap={diffMap}
                hoveredWordIndex={hoveredWordIndex}
                onHoverWord={setHoveredWordIndex}
                onScroll={() => {
                  handleCorrScroll('ingglish');
                }}
                scrollRef={corrIngglishRef}
                showTooltip={diffMap !== undefined}
                spokenWordIndex={spokenWordIndex}
                tokens={forwardTokens}
              />
            ) : (
              <WordDisplay
                className="ingglish-words"
                hoveredWordIndex={hoveredWordIndex}
                onHoverWord={setHoveredWordIndex}
                onScroll={() => {
                  handleCorrScroll('ingglish');
                }}
                scrollRef={corrIngglishRef}
                spokenWordIndex={spokenWordIndex}
                text={displayIngglish}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function WordDisplay({
  className,
  hoveredWordIndex,
  onHoverWord,
  onScroll,
  scrollRef,
  spokenWordIndex = null,
  text,
}: WordDisplayProps) {
  const tokens: IndexedToken[] = useMemo(() => tokenizePhonetic(text), [text]);

  return (
    <div className={`word-display ${className ?? ''}`} onScroll={onScroll} ref={scrollRef}>
      {tokens.map((token, i) => {
        if (token.isWord) {
          const isHighlighted = token.wordIndex === hoveredWordIndex;
          const isSpoken = token.wordIndex === spokenWordIndex;
          return (
            <span
              className={`word-token ${isHighlighted ? 'highlighted' : ''} ${isSpoken ? 'spoken' : ''}`}
              key={i}
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

export default TextTranslator;
