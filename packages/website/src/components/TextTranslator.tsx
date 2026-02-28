import { reverseTranslate, translateSync } from 'ingglish';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { segmentKhmerText } from '@ingglish/ipa';
import { getFormatLabel } from '@ingglish/phonemes';
import { trackShare, trackSpeak, trackTextTranslate } from '../analytics';
import { useFormat } from '../contexts/FormatContext';
import { ALL_SAMPLES, pickSample } from '../data/language-samples';
import { useClipboard } from '../hooks/useClipboard';
import { useShare } from '../hooks/useShare';
import { useSpeech } from '../hooks/useSpeech';
import type { IpaDict } from '../pronounce/dict-loader';
import { LANGUAGES, loadDict } from '../pronounce/dict-loader';
import { NOT_FOUND_MARKER, translateForeign } from '../pronounce/ipa-to-ingglish';
import {
  CheckIcon,
  CloseIcon,
  CopyIcon,
  DiceIcon,
  ShareIcon,
  SpeakerIcon,
  StopIcon,
} from './Icons';

const WORD_RE = /[\p{L}\p{N}]/u;

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

interface TargetOutputDisplayProps {
  dictLoading: boolean;
  format: string;
  highlightedWordIndex?: null | number;
  onHoverWord?: (index: null | number) => void;
  onScroll?: () => void;
  scrollRef?: React.Ref<HTMLDivElement>;
  spokenRange?: [number, number] | null;
  text: string;
}

interface TextTranslatorProps {
  initialLang?: string;
  initialText?: string;
  onShare?: (text: string, lang?: string) => string;
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
  highlightedWordIndex = null,
  onChange,
  onFocus,
  onHoverWord,
  onScroll,
  placeholder,
  scrollRef,
  spokenRange,
  text,
}: {
  highlightedWordIndex?: null | number;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFocus?: () => void;
  onHoverWord?: (index: null | number) => void;
  onScroll?: () => void;
  placeholder?: string;
  scrollRef: React.Ref<HTMLTextAreaElement>;
  spokenRange: [number, number] | null;
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

  // Detect which overlay word token is under the cursor by temporarily
  // swapping pointer-events so elementFromPoint hits the overlay spans.
  // The textarea stays on top for native caret/selection behaviour.
  const lastHoveredRef = useRef<null | number>(null);
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLTextAreaElement>) => {
      if (!onHoverWord || !overlayRef.current) {
        return;
      }
      const textarea = e.currentTarget;
      const overlay = overlayRef.current;
      textarea.style.pointerEvents = 'none';
      overlay.style.pointerEvents = 'auto';
      const el = document.elementFromPoint(e.clientX, e.clientY);
      textarea.style.pointerEvents = '';
      overlay.style.pointerEvents = '';
      const attr = el instanceof HTMLElement ? el.dataset.wordIndex : undefined;
      const wordIdx = attr === undefined ? null : Number.parseInt(attr, 10);
      if (wordIdx !== lastHoveredRef.current) {
        lastHoveredRef.current = wordIdx;
        onHoverWord(wordIdx);
      }
    },
    [onHoverWord]
  );

  const handleMouseLeave = useCallback(() => {
    if (!onHoverWord) {
      return;
    }
    lastHoveredRef.current = null;
    onHoverWord(null);
  }, [onHoverWord]);

  const segments = text.split(/(\s+)/);
  let wordIndex = 0;
  return (
    <div className="overlay-textarea">
      <textarea
        className="text-input"
        onChange={onChange}
        onFocus={onFocus}
        onMouseLeave={onHoverWord ? handleMouseLeave : undefined}
        onMouseMove={onHoverWord ? handleMouseMove : undefined}
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
            // Punctuation-only tokens (em dashes, ellipses, etc.) don't get
            // boundary events from the Speech API, so skip the word index.
            const isWord = /[\p{L}\p{N}]/u.test(seg);
            const idx = isWord ? wordIndex++ : -1;
            const isHighlighted = idx >= 0 && idx === highlightedWordIndex;
            const isSpoken =
              idx >= 0 && spokenRange !== null && idx >= spokenRange[0] && idx <= spokenRange[1];
            return (
              <span
                className={`word-token ${isHighlighted ? 'highlighted' : ''} ${isSpoken ? 'spoken' : ''}`}
                data-word-index={idx >= 0 ? idx : undefined}
                key={i}
              >
                {seg}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TargetOutputDisplay({
  dictLoading,
  format,
  highlightedWordIndex = null,
  onHoverWord,
  onScroll,
  scrollRef,
  spokenRange = null,
  text,
}: TargetOutputDisplayProps) {
  if (dictLoading) {
    return (
      <div className="text-input target-output" ref={scrollRef}>
        <span className="target-output-loading">Loading dictionary...</span>
      </div>
    );
  }

  if (!text.trim()) {
    return (
      <div className="text-input target-output" onScroll={onScroll} ref={scrollRef}>
        <span className="target-output-placeholder">
          {OUTPUT_PLACEHOLDERS[format] ?? 'Translation will appear here\u2026'}
        </span>
      </div>
    );
  }

  // Parse text: NOT_FOUND_MARKER prefixed words are "not found"
  const segments = text.split(/(\s+)/);
  let wordIndex = 0;
  return (
    <div
      className="text-input target-output"
      onMouseLeave={
        onHoverWord
          ? () => {
              onHoverWord(null);
            }
          : undefined
      }
      onScroll={onScroll}
      ref={scrollRef}
    >
      {segments.map((seg, i) => {
        if (/^\s+$/.test(seg)) {
          return <span key={i}>{seg}</span>;
        }
        // Only count segments with letters/digits as words, matching
        // useSpeech and OverlayTextarea (punctuation-only tokens are skipped)
        const isWord = WORD_RE.test(
          seg.startsWith(NOT_FOUND_MARKER) ? seg.slice(NOT_FOUND_MARKER.length) : seg
        );
        const idx = isWord ? wordIndex++ : -1;
        const isHighlighted = idx >= 0 && idx === highlightedWordIndex;
        const isSpoken =
          idx >= 0 && spokenRange !== null && idx >= spokenRange[0] && idx <= spokenRange[1];
        if (seg.startsWith(NOT_FOUND_MARKER)) {
          const word = seg.slice(NOT_FOUND_MARKER.length);
          return (
            <span
              className={`word-token target-not-found ${isHighlighted ? 'highlighted' : ''} ${isSpoken ? 'spoken' : ''}`}
              key={i}
              onMouseEnter={
                onHoverWord
                  ? () => {
                      onHoverWord(idx);
                    }
                  : undefined
              }
              title="Not found in dictionary"
            >
              {word}
            </span>
          );
        }
        return (
          <span
            className={`word-token ${isHighlighted ? 'highlighted' : ''} ${isSpoken ? 'spoken' : ''}`}
            key={i}
            onMouseEnter={
              onHoverWord
                ? () => {
                    onHoverWord(idx);
                  }
                : undefined
            }
          >
            {seg}
          </span>
        );
      })}
    </div>
  );
}

function TextTranslator({ initialLang, initialText = '', onShare }: TextTranslatorProps) {
  const { format, toggleFormat } = useFormat();

  // Target language state (declared early so initial sample can use it)
  const [selectedLanguage, setSelectedLanguage] = useState(
    () => initialLang ?? localStorage.getItem('selectedLanguage') ?? 'en'
  );

  const [englishText, setEnglishText] = useState(() => {
    if (initialText) {
      return initialText;
    }
    return pickSample(selectedLanguage, '') ?? '';
  });
  const [ingglishText, setIngglishText] = useState('');
  const [lastEdited, setLastEdited] = useState<EditingPane>('english');
  const [copiedEnglish, copyEnglish] = useClipboard();
  const [copiedIngglish, copyIngglish] = useClipboard();
  const [copiedShare, shareUrl] = useShare();
  const [speakingEnglish, speakEnglish, stopEnglish, speechSupported, spokenRange, hasVoice] =
    useSpeech();

  // Cross-pane word highlighting: hover on right → highlight on left
  const [hoveredWordIndex, setHoveredWordIndex] = useState<null | number>(null);
  const [targetDict, setTargetDict] = useState<IpaDict | null>(null);
  const [dictLoading, setDictLoading] = useState(false);
  const isTargetLangMode = selectedLanguage !== 'en';

  // Load target-language dictionary when language changes
  useEffect(() => {
    if (!isTargetLangMode) {
      setTargetDict(null);
      return;
    }
    let cancelled = false;
    setDictLoading(true);
    loadDict(selectedLanguage)
      .then((dict) => {
        if (!cancelled) {
          setTargetDict(dict);
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
  }, [selectedLanguage, isTargetLangMode]);

  // Reset panes when switching languages
  const handleLanguageChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const lang = e.target.value;
      stopEnglish();
      setSelectedLanguage(lang);
      localStorage.setItem('selectedLanguage', lang);
      // Auto-load a random sample for the new language
      const sample = pickSample(lang, '');
      setEnglishText(sample ?? '');
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
    if (isTargetLangMode) {
      if (!targetDict) {
        return null;
      }
      return translateForeign(deferredEnglish, targetDict, format);
    }
    try {
      return translateSync(deferredEnglish, { format });
    } catch (error) {
      console.warn('Translation failed:', error);
      return null;
    }
  }, [deferredEnglish, lastEdited, format, isTargetLangMode, targetDict]);

  // Async reverse translation with useEffect
  const [computedEnglish, setComputedEnglish] = useState<null | string>(null);
  useEffect(() => {
    if (isTargetLangMode) {
      setComputedEnglish(null);
      return;
    }
    if (lastEdited !== 'ingglish' || !deferredIngglish.trim()) {
      setComputedEnglish(null);
      return;
    }
    let cancelled = false;
    reverseTranslate(deferredIngglish, { format })
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
  }, [deferredIngglish, lastEdited, format, isTargetLangMode]);

  // Display values: show computed translation in the non-edited pane
  // Fall back to the stored text (not empty) during deferred value transitions
  // Segment Khmer text so input pane word boundaries match translated output
  const rawEnglish = lastEdited === 'ingglish' ? (computedEnglish ?? englishText) : englishText;
  const displayEnglish = selectedLanguage === 'km' ? segmentKhmerText(rawEnglish) : rawEnglish;
  const displayIngglish =
    lastEdited === 'english' ? (computedIngglish ?? ingglishText) : ingglishText;

  // Strip NOT_FOUND_MARKER from display (the TargetOutputDisplay handles rendering)
  const displayIngglishClean = isTargetLangMode
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

  // Sample data for current language
  const samples = useMemo(() => ALL_SAMPLES[selectedLanguage] ?? [], [selectedLanguage]);
  const selectedSampleIndex = samples.findIndex((s) => s.text === englishText);

  const handleSampleSelect = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const index = Number.parseInt(e.target.value, 10);
      if (!Number.isNaN(index) && samples[index] !== undefined) {
        setEnglishText(samples[index].text);
        setLastEdited('english');
        trackTextTranslate(samples[index].text.length, format);
      }
    },
    [samples, format]
  );

  const handleRandom = useCallback(() => {
    const text = pickSample(selectedLanguage, englishText);
    if (text) {
      setEnglishText(text);
      setLastEdited('english');
      trackTextTranslate(text.length, format);
    }
  }, [format, englishText, selectedLanguage]);

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
        isTargetLangMode ? selectedLanguage : undefined
      );
    }
  }, [
    speakingEnglish,
    stopEnglish,
    displayEnglish,
    speakEnglish,
    isTargetLangMode,
    selectedLanguage,
  ]);

  const handleClear = useCallback(() => {
    stopEnglish();
    setEnglishText('');
    setIngglishText('');
  }, [stopEnglish]);

  const handleShare = useCallback(() => {
    if (onShare && displayEnglish.trim()) {
      const url = onShare(displayEnglish, isTargetLangMode ? selectedLanguage : undefined);
      shareUrl(url, 'Ingglish Text Translation');
      trackShare('text', typeof navigator.share === 'function' ? 'webshare' : 'clipboard');
    }
  }, [onShare, displayEnglish, shareUrl, isTargetLangMode, selectedLanguage]);

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

  // Source URL for the currently selected sample (if any)
  const selectedSampleSource =
    selectedSampleIndex === -1 ? null : (samples[selectedSampleIndex]?.source ?? null);

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

  const languageLabel = isTargetLangMode
    ? (LANGUAGES.find((l) => l.code === selectedLanguage)?.label ?? selectedLanguage)
    : 'English';

  return (
    <div className="text-translator">
      <div className="translator-grid">
        <div className="input-section">
          <div className="section-header">
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
            <div className="button-group">
              {speechSupported && hasVoice(isTargetLangMode ? selectedLanguage : 'en') && (
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
              <button
                aria-label="Random sample"
                className="btn-secondary btn-icon"
                onClick={handleRandom}
                title="Random"
              >
                <DiceIcon />
              </button>
              <button
                aria-label={copiedEnglish ? 'Copied' : 'Copy'}
                className={`btn-secondary btn-icon ${copiedEnglish ? 'btn-copied' : ''}`}
                disabled={!displayEnglish}
                onClick={handleCopyEnglish}
                title={copiedEnglish ? 'Copied!' : 'Copy'}
              >
                {copiedEnglish ? <CheckIcon /> : <CopyIcon />}
              </button>
              <button
                aria-label="Clear"
                className="btn-secondary btn-icon"
                disabled={!hasContent}
                onClick={handleClear}
                title="Clear"
              >
                <CloseIcon />
              </button>
            </div>
          </div>
          <OverlayTextarea
            highlightedWordIndex={hoveredWordIndex}
            onChange={handleEnglishChange}
            onFocus={
              !isTargetLangMode && lastEdited === 'ingglish' && computedEnglish !== null
                ? () => {
                    setEnglishText(computedEnglish);
                    setLastEdited('english');
                  }
                : undefined
            }
            onHoverWord={setHoveredWordIndex}
            onScroll={() => {
              handleScroll('english');
            }}
            placeholder={
              isTargetLangMode ? `Type ${languageLabel} text here...` : 'Type English text here...'
            }
            scrollRef={englishRef}
            spokenRange={speakingEnglish ? spokenRange : null}
            text={displayEnglish}
          />
          <div className="section-footer">
            <select
              aria-label="Load sample passage"
              className="sample-select"
              onChange={handleSampleSelect}
              value={selectedSampleIndex === -1 ? '' : String(selectedSampleIndex)}
            >
              <option disabled value="">
                Sample...
              </option>
              {samples.map((s, i) => (
                <option key={i} value={i}>
                  {s.label}
                </option>
              ))}
            </select>
            {selectedSampleSource && (
              <a
                className="sample-source-link"
                href={`/url?url=${encodeURIComponent(selectedSampleSource)}${isTargetLangMode ? `&lang=${selectedLanguage}` : ''}`}
              >
                Read full page &#x2197;
              </a>
            )}
            {onShare && (
              <button
                aria-label={copiedShare ? 'Link copied' : 'Share'}
                className={`btn-secondary btn-icon ${copiedShare ? 'btn-copied' : ''}`}
                disabled={!hasContent}
                onClick={handleShare}
                title={copiedShare ? 'Copied!' : 'Share'}
              >
                {copiedShare ? <CheckIcon /> : <ShareIcon />}
              </button>
            )}
          </div>
        </div>

        <div className="input-section ingglish-section">
          <div className="section-header">
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
            <div className="button-group">
              <button
                aria-label={copiedIngglish ? 'Copied' : 'Copy'}
                className={`btn-secondary btn-icon ${copiedIngglish ? 'btn-copied' : ''}`}
                disabled={!displayIngglishClean}
                onClick={handleCopyIngglish}
                title={copiedIngglish ? 'Copied!' : 'Copy'}
              >
                {copiedIngglish ? <CheckIcon /> : <CopyIcon />}
              </button>
            </div>
          </div>
          {isTargetLangMode ? (
            <TargetOutputDisplay
              dictLoading={dictLoading}
              format={format}
              highlightedWordIndex={hoveredWordIndex}
              onHoverWord={setHoveredWordIndex}
              onScroll={() => {
                handleScroll('ingglish');
              }}
              scrollRef={ingglishRef as React.Ref<HTMLDivElement>}
              spokenRange={speakingEnglish ? spokenRange : null}
              text={displayIngglish}
            />
          ) : (
            <OverlayTextarea
              highlightedWordIndex={hoveredWordIndex}
              onChange={handleIngglishChange}
              onFocus={
                lastEdited === 'english' && computedIngglish !== null
                  ? () => {
                      setIngglishText(computedIngglish);
                      setLastEdited('ingglish');
                    }
                  : undefined
              }
              onHoverWord={setHoveredWordIndex}
              onScroll={() => {
                handleScroll('ingglish');
              }}
              placeholder={OUTPUT_PLACEHOLDERS[format] ?? ''}
              scrollRef={ingglishRef as React.Ref<HTMLTextAreaElement>}
              spokenRange={speakingEnglish ? spokenRange : null}
              text={lastEdited === 'ingglish' ? ingglishText : displayIngglish}
            />
          )}
        </div>
      </div>

      {!isTargetLangMode && lastEdited === 'english' && isAllCaps(englishText) && (
        <div className="warning-message">
          Ingglish is case-sensitive — type in normal case for accurate translations.
        </div>
      )}
    </div>
  );
}

export default TextTranslator;
