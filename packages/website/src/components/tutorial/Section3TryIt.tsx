import { translateSyncWithMapping } from 'ingglish';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { MappedWordDisplay } from '../MappedWordDisplay';

/** Returns true if the text is ALL CAPS (2+ letters). Ingglish is case-sensitive. */
function isAllCaps(text: string): boolean {
  const letters = text.replaceAll(/[^a-z]/gi, '');
  return letters.length >= 2 && letters === letters.toUpperCase();
}

const DEMO_SENTENCE = 'The knight thought through the night';
const TYPING_INTERVAL_MS = 60;
const POST_TYPING_PAUSE_MS = 500;

export function Section3TryIt({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [input, setInput] = useState('');
  const [isAutoTyping, setIsAutoTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(false);
  const userInteracted = useRef(false);
  const { ref, visible } = useScrollReveal<HTMLElement>();
  const tokens = input ? translateSyncWithMapping(input) : [];

  // Auto-type demo sentence when section becomes visible
  useEffect(() => {
    if (!visible || userInteracted.current) {
      return;
    }

    setIsAutoTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setInput(DEMO_SENTENCE.slice(0, i));
      if (i >= DEMO_SENTENCE.length) {
        clearInterval(interval);
        setIsAutoTyping(false);
        setTimeout(() => {
          if (!userInteracted.current) {
            setShowCursor(true);
          }
        }, POST_TYPING_PAUSE_MS);
      }
    }, TYPING_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [visible]);

  const handleFocus = useCallback(() => {
    if (!userInteracted.current) {
      userInteracted.current = true;
      setIsAutoTyping(false);
      setShowCursor(false);
      setInput('');
    }
  }, []);

  const handleNavigate = useCallback(
    (tab: string) => (e: React.MouseEvent) => {
      e.preventDefault();
      window.scrollTo(0, 0);
      onNavigate?.(tab);
    },
    [onNavigate]
  );

  return (
    <section className="tutorial-section tutorial-try-it" ref={ref}>
      <h2 className="tutorial-heading">Try it yourself</h2>
      <div className="try-it-container">
        <div className="try-it-input-wrapper">
          <input
            className={`try-it-input${showCursor ? ' demo-cursor' : ''}`}
            onChange={(e) => {
              setInput(e.target.value);
            }}
            onFocus={handleFocus}
            placeholder="Type any English sentence…"
            readOnly={isAutoTyping}
            type="text"
            value={input}
          />
        </div>
        {input && <MappedWordDisplay className="try-it-output" placeholder="" tokens={tokens} />}
        {isAllCaps(input) && (
          <div className="warning-message">
            Ingglish is case-sensitive — type in normal case for accurate translations.
          </div>
        )}
      </div>
      {onNavigate && (
        <div className="try-it-cta">
          <p className="try-it-cta-prompt">Want to translate more?</p>
          <a className="cta-primary" href="/text" onClick={handleNavigate('text')}>
            Translate Text
          </a>
          <a className="cta-secondary" href="/url" onClick={handleNavigate('url')}>
            Translate a Website
          </a>
        </div>
      )}
    </section>
  );
}
