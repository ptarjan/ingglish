import { reverseTranslate, translateSync } from 'ingglish';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { getFormatLabel } from '@ingglish/phonemes';
import { trackShare, trackSpeak, trackTextTranslate } from '../analytics';
import { useFormat } from '../contexts/FormatContext';
import { pickForeignSample } from '../data/foreign-samples';
import { pickRandomPassage } from '../data/sample-text';
import { useClipboard } from '../hooks/useClipboard';
import { useShare } from '../hooks/useShare';
import { useSpeech } from '../hooks/useSpeech';
import type { IpaDict } from '../pronounce/dict-loader';
import { LANGUAGES, loadDict } from '../pronounce/dict-loader';
import { NOT_FOUND_MARKER, translateForeign } from '../pronounce/ipa-to-ingglish';

type EditingPane = 'english' | 'ingglish';

/** Placeholder text for the output pane, shown in the output format's own script. */
export const OUTPUT_PLACEHOLDERS: Record<string, string> = {
  deseret:
    '\u{10437}\u{10434}\u{10439} \u{1043C}\u{1042F}\u{10445}\u{10428}\u{10449}\u{1042F}\u{10437} \u{10438}\u{1042E}\u{10449}\u2026',
  ingglish: 'Taip Ingglish tekst heer\u2026',
  ipa: '/ta\u026Ap a\u026A pi\u02D0 e\u026A h\u026A\u0279\u2026/',
  pronunciation: 'TAIP gaid TEKST HEER\u2026',
  shavian:
    '\u{10451}\u{10472}\u{10450} \u{10456}\u{10471}\u{1045D}\u{1045E}\u{1046F} \u{10463}\u{10477}\u2026',
};

interface ForeignOutputDisplayProps {
  dictLoading: boolean;
  format: string;
  onScroll?: () => void;
  scrollRef?: React.Ref<HTMLDivElement>;
  spokenWordIndex: null | number;
  text: string;
}

interface TextTranslatorProps {
  initialLang?: string;
  initialText?: string;
  onShare?: (text: string, lang?: string) => string;
}

function ForeignOutputDisplay({
  dictLoading,
  format,
  onScroll,
  scrollRef,
  spokenWordIndex,
  text,
}: ForeignOutputDisplayProps) {
  if (dictLoading) {
    return (
      <div className="text-input foreign-output" ref={scrollRef}>
        <span className="foreign-output-loading">Loading dictionary...</span>
      </div>
    );
  }

  if (!text.trim()) {
    return (
      <div className="text-input foreign-output" onScroll={onScroll} ref={scrollRef}>
        <span className="foreign-output-placeholder">
          {OUTPUT_PLACEHOLDERS[format] ?? 'Translation will appear here\u2026'}
        </span>
      </div>
    );
  }

  // Parse text: NOT_FOUND_MARKER prefixed words are "not found"
  const segments = text.split(/(\s+)/);
  let wordIndex = 0;
  return (
    <div className="text-input foreign-output" onScroll={onScroll} ref={scrollRef}>
      {segments.map((seg, i) => {
        if (/^\s+$/.test(seg)) {
          return <span key={i}>{seg}</span>;
        }
        const idx = wordIndex++;
        const spoken = idx === spokenWordIndex ? ' spoken' : '';
        if (seg.startsWith(NOT_FOUND_MARKER)) {
          const word = seg.slice(NOT_FOUND_MARKER.length);
          return (
            <span
              className={`word-token foreign-not-found${spoken}`}
              key={i}
              title="Not found in dictionary"
            >
              {word}
            </span>
          );
        }
        return (
          <span className={`word-token${spoken}`} key={i}>
            {seg}
          </span>
        );
      })}
    </div>
  );
}

/** Returns true if the text is ALL CAPS (2+ letters). Ingglish is case-sensitive. */
function isAllCaps(text: string): boolean {
  const letters = text.replaceAll(/[^a-z]/gi, '');
  return letters.length >= 2 && letters === letters.toUpperCase();
}

/**
 * Textarea with a word-tokenized overlay on top for TTS word highlighting.
 * The overlay has pointer-events: none so clicks/typing pass through to
 * the textarea underneath. Text is rendered transparently in the textarea
 * and visibly in the overlay, keeping them in sync.
 */
function OverlayTextarea({
  onChange,
  onFocus,
  onScroll,
  placeholder,
  scrollRef,
  spokenWordIndex,
  text,
}: {
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFocus?: () => void;
  onScroll?: () => void;
  placeholder?: string;
  scrollRef: React.Ref<HTMLTextAreaElement>;
  spokenWordIndex: null | number;
  text: string;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLTextAreaElement>) => {
      if (overlayRef.current) {
        overlayRef.current.scrollTop = e.currentTarget.scrollTop;
      }
      onScroll?.();
    },
    [onScroll]
  );

  const segments = text.split(/(\s+)/);
  let wordIndex = 0;
  return (
    <div className="overlay-textarea">
      <textarea
        className="text-input"
        onChange={onChange}
        onFocus={onFocus}
        onScroll={handleScroll}
        placeholder={placeholder}
        ref={scrollRef}
        spellCheck={false}
        value={text}
      />
      {text.trim() && (
        <div className="overlay-textarea-display text-input" ref={overlayRef}>
          {segments.map((seg, i) => {
            if (/^\s+$/.test(seg)) {
              return <span key={i}>{seg}</span>;
            }
            const idx = wordIndex++;
            return (
              <span className={`word-token ${idx === spokenWordIndex ? 'spoken' : ''}`} key={i}>
                {seg}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
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

function TextTranslator({ initialLang, initialText = '', onShare }: TextTranslatorProps) {
  const { format, toggleFormat } = useFormat();
  const [englishText, setEnglishText] = useState(initialText);
  const [ingglishText, setIngglishText] = useState('');
  const [lastEdited, setLastEdited] = useState<EditingPane>('english');
  const [copiedEnglish, copyEnglish] = useClipboard();
  const [copiedIngglish, copyIngglish] = useClipboard();
  const [copiedShare, shareUrl] = useShare();
  const [speakingEnglish, speakEnglish, stopEnglish, speechSupported, spokenWordCount, hasVoice] =
    useSpeech();

  // Foreign language state
  const [selectedLanguage, setSelectedLanguage] = useState(
    () => initialLang ?? localStorage.getItem('selectedLanguage') ?? 'en'
  );
  const [foreignDict, setForeignDict] = useState<IpaDict | null>(null);
  const [dictLoading, setDictLoading] = useState(false);
  const isForeignMode = selectedLanguage !== 'en';

  // Load foreign dictionary when language changes
  useEffect(() => {
    if (!isForeignMode) {
      setForeignDict(null);
      return;
    }
    let cancelled = false;
    setDictLoading(true);
    loadDict(selectedLanguage)
      .then((dict) => {
        if (!cancelled) {
          setForeignDict(dict);
          setDictLoading(false);
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to load dictionary:', error);
        if (!cancelled) {
          setDictLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedLanguage, isForeignMode]);

  // Reset panes when switching languages
  const handleLanguageChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const lang = e.target.value;
      stopEnglish();
      setSelectedLanguage(lang);
      localStorage.setItem('selectedLanguage', lang);
      setEnglishText('');
      setIngglishText('');
      setLastEdited('english');
    },
    [stopEnglish]
  );

  // Use deferred values to keep typing responsive
  const deferredEnglish = useDeferredValue(englishText);
  const deferredIngglish = useDeferredValue(ingglishText);

  // Compute translations based on which pane was last edited
  const computedIngglish = useMemo(() => {
    if (lastEdited !== 'english' || !deferredEnglish.trim()) {
      return null;
    }
    if (isForeignMode) {
      if (!foreignDict) {
        return null;
      }
      return translateForeign(deferredEnglish, foreignDict, format, selectedLanguage);
    }
    try {
      return translateSync(deferredEnglish, format);
    } catch (error) {
      console.warn('Translation failed:', error);
      return null;
    }
  }, [deferredEnglish, lastEdited, format, isForeignMode, foreignDict, selectedLanguage]);

  // Async reverse translation with useEffect
  const [computedEnglish, setComputedEnglish] = useState<null | string>(null);
  useEffect(() => {
    if (isForeignMode) {
      setComputedEnglish(null);
      return;
    }
    if (lastEdited !== 'ingglish' || !deferredIngglish.trim()) {
      setComputedEnglish(null);
      return;
    }
    let cancelled = false;
    reverseTranslate(deferredIngglish, format)
      .then((result) => {
        if (!cancelled) {
          setComputedEnglish(result);
        }
      })
      .catch((error: unknown) => {
        console.warn('Reverse translation failed:', error);
        if (!cancelled) {
          setComputedEnglish(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [deferredIngglish, lastEdited, format, isForeignMode]);

  // Display values: show computed translation in the non-edited pane
  // Fall back to the stored text (not empty) during deferred value transitions
  const displayEnglish = lastEdited === 'ingglish' ? (computedEnglish ?? englishText) : englishText;
  const displayIngglish =
    lastEdited === 'english' ? (computedIngglish ?? ingglishText) : ingglishText;

  // Strip NOT_FOUND_MARKER from display (the ForeignWordDisplay handles rendering)
  const displayIngglishClean = isForeignMode
    ? displayIngglish.replaceAll(NOT_FOUND_MARKER, '')
    : displayIngglish;

  const handleEnglishChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEnglishText(e.target.value);
    setLastEdited('english');
  }, []);

  const handleIngglishChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIngglishText(e.target.value);
    setLastEdited('ingglish');
  }, []);

  const handleRandom = useCallback(() => {
    const text = isForeignMode
      ? pickForeignSample(selectedLanguage, englishText)
      : pickRandomPassage(englishText);
    if (text) {
      setEnglishText(text);
      setLastEdited('english');
      trackTextTranslate(text.length, format);
    }
  }, [format, englishText, isForeignMode, selectedLanguage]);

  const handleCopyEnglish = useCallback(() => {
    if (displayEnglish) {
      copyEnglish(displayEnglish);
    }
  }, [displayEnglish, copyEnglish]);

  const handleCopyIngglish = useCallback(() => {
    if (displayIngglishClean) {
      copyIngglish(displayIngglishClean);
    }
  }, [displayIngglishClean, copyIngglish]);

  const handleSpeak = useCallback(() => {
    if (speakingEnglish) {
      stopEnglish();
    } else if (displayEnglish) {
      trackSpeak();
      speakEnglish(
        displayEnglish.replaceAll(/\n+/g, ' '),
        isForeignMode ? selectedLanguage : undefined
      );
    }
  }, [speakingEnglish, stopEnglish, displayEnglish, speakEnglish, isForeignMode, selectedLanguage]);

  const handleClear = useCallback(() => {
    stopEnglish();
    setEnglishText('');
    setIngglishText('');
  }, [stopEnglish]);

  const handleShare = useCallback(() => {
    if (onShare && displayEnglish.trim()) {
      const url = onShare(displayEnglish, isForeignMode ? selectedLanguage : undefined);
      shareUrl(url, 'Ingglish Text Translation');
      trackShare('text', typeof navigator.share === 'function' ? 'webshare' : 'clipboard');
    }
  }, [onShare, displayEnglish, shareUrl, isForeignMode, selectedLanguage]);

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

  // Sync scroll positions between paired panes
  const englishRef = useRef<HTMLTextAreaElement>(null);
  const ingglishRef = useRef<HTMLDivElement | HTMLTextAreaElement>(null);
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

  const languageLabel = isForeignMode
    ? (LANGUAGES.find((l) => l.code === selectedLanguage)?.label ?? selectedLanguage)
    : 'English';

  return (
    <div className="text-translator">
      <div className="translator-grid">
        <div className="input-section">
          <div className="section-header">
            <h2>
              <select
                className="language-select"
                onChange={handleLanguageChange}
                value={selectedLanguage}
              >
                <option value="en">English</option>
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </h2>
            <div className="button-group">
              {speechSupported && hasVoice(isForeignMode ? selectedLanguage : 'en') && (
                <button
                  aria-label={speakingEnglish ? 'Stop speaking' : 'Listen'}
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
          <OverlayTextarea
            onChange={handleEnglishChange}
            onFocus={
              !isForeignMode && lastEdited === 'ingglish' && computedEnglish !== null
                ? () => {
                    setEnglishText(computedEnglish);
                    setLastEdited('english');
                  }
                : undefined
            }
            onScroll={() => {
              handleScroll('english');
            }}
            placeholder={
              isForeignMode ? `Type ${languageLabel} text here...` : 'Type English text here...'
            }
            scrollRef={englishRef}
            spokenWordIndex={speakingEnglish ? spokenWordCount : null}
            text={lastEdited === 'english' ? englishText : displayEnglish}
          />
        </div>

        <div className="input-section ingglish-section">
          <div className="section-header">
            <h2>
              <button
                className="format-cycle-btn format-toggle"
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
                disabled={!displayIngglishClean}
                onClick={handleCopyIngglish}
              >
                {copiedIngglish ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          {isForeignMode ? (
            <ForeignOutputDisplay
              dictLoading={dictLoading}
              format={format}
              onScroll={() => {
                handleScroll('ingglish');
              }}
              scrollRef={ingglishRef as React.Ref<HTMLDivElement>}
              spokenWordIndex={speakingEnglish ? spokenWordCount : null}
              text={displayIngglish}
            />
          ) : (
            <OverlayTextarea
              onChange={handleIngglishChange}
              onFocus={
                lastEdited === 'english' && computedIngglish !== null
                  ? () => {
                      setIngglishText(computedIngglish);
                      setLastEdited('ingglish');
                    }
                  : undefined
              }
              onScroll={() => {
                handleScroll('ingglish');
              }}
              placeholder={OUTPUT_PLACEHOLDERS[format] ?? ''}
              scrollRef={ingglishRef as React.Ref<HTMLTextAreaElement>}
              spokenWordIndex={speakingEnglish ? spokenWordCount : null}
              text={lastEdited === 'ingglish' ? ingglishText : displayIngglish}
            />
          )}
        </div>
      </div>

      {!isForeignMode && lastEdited === 'english' && isAllCaps(englishText) && (
        <div className="warning-message">
          Ingglish is case-sensitive — type in normal case for accurate translations.
        </div>
      )}
    </div>
  );
}

export default TextTranslator;
