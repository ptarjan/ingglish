import { useState, useEffect, useRef, useCallback } from 'react';
import { translateSyncWithMapping } from 'ingglish';
import { MappedWordDisplay } from '../MappedWordDisplay';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { isAllCaps } from '../../translation/text';

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
    <section ref={ref} className="tutorial-section tutorial-try-it">
      <h2 className="tutorial-heading">Try it yourself</h2>
      <div className="try-it-container">
        <div className="try-it-input-wrapper">
          <input
            className={`try-it-input${showCursor ? ' demo-cursor' : ''}`}
            type="text"
            placeholder="Type any English sentence…"
            value={input}
            readOnly={isAutoTyping}
            onFocus={handleFocus}
            onChange={(e) => {
              setInput(e.target.value);
            }}
          />
        </div>
        {input && <MappedWordDisplay tokens={tokens} className="try-it-output" placeholder="" />}
        {isAllCaps(input) && (
          <div className="warning-message">
            Ingglish is case-sensitive — type in normal case for accurate translations.
          </div>
        )}
      </div>
      {onNavigate && (
        <div className="try-it-cta">
          <p className="try-it-cta-prompt">Want to translate more?</p>
          <a href="/text" className="cta-primary" onClick={handleNavigate('text')}>
            Translate Text
          </a>
          <a href="/url" className="cta-secondary" onClick={handleNavigate('url')}>
            Translate a Website
          </a>
        </div>
      )}
    </section>
  );
}
