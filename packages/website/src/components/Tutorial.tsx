import { useEffect, useRef, useState, useCallback } from 'react';
import { translateSyncWithMapping } from '@ingglish/core';
import { MappedWordDisplay } from './TextTranslator';
import {
  oughExamples,
  silentLetterExamples,
  eeSoundExamples,
  aySoundExamples,
  phExamples,
  ckExamples,
  ightExamples,
  tionExamples,
  voicelessTh,
  voicedTh,
  paragraphWords,
  stepCaptions,
  poemWords,
  readingTestWords,
  readingTestAttribution,
  type ExampleWord,
} from './tutorial-data';

// --- Scroll reveal hooks ---

function useScrollReveal<T extends HTMLElement>(
  threshold = 0.15
): { ref: React.RefObject<T | null>; visible: boolean } {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  return { ref, visible };
}

function useStaggeredReveal(count: number, visible: boolean, delayMs = 200): number {
  const [revealedCount, setRevealedCount] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!visible || doneRef.current) {
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRevealedCount(count);
      doneRef.current = true;
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setRevealedCount(i);
      if (i >= count) {
        clearInterval(interval);
        doneRef.current = true;
      }
    }, delayMs);
    return () => {
      clearInterval(interval);
    };
  }, [visible, count, delayMs]);

  return revealedCount;
}

// --- Components ---

interface TutorialProps {
  onNavigate: (tab: string) => void;
}

function OughCard({
  prefix,
  suffix,
  sound,
  animate,
}: {
  prefix: string;
  suffix: string;
  sound: string;
  animate: boolean;
}) {
  return (
    <div className={`ough-card ${animate ? 'revealed' : ''}`}>
      <div className="ough-english-word">
        <span>{prefix}</span>
        <span className="ough-highlight-old">ough</span>
        <span>{suffix}</span>
      </div>
      <div className={`ough-arrow ${animate ? 'shown' : ''}`}>&rarr;</div>
      <div className={`ough-ingglish-word ${animate ? 'shown' : ''}`}>
        <span className="ough-ingglish-text" data-orig={`${prefix}ough${suffix}`}>
          <span>{prefix}</span>
          <span className="ough-highlight-new">{sound}</span>
          <span>{suffix}</span>
        </span>
      </div>
    </div>
  );
}

function Section1_Ough() {
  const { ref, visible } = useScrollReveal<HTMLElement>();
  const revealedCount = useStaggeredReveal(oughExamples.length, visible, 1500);

  return (
    <section ref={ref} className={`tutorial-section ${visible ? 'revealed' : ''}`}>
      <h2 className="tutorial-heading">One spelling. Six sounds.</h2>
      <div className="ough-grid">
        {oughExamples.map((ex, i) => (
          <OughCard key={i} {...ex} animate={i < revealedCount} />
        ))}
      </div>
      <p className="tutorial-punchline">
        Same four letters. Six different sounds. This is English.
      </p>
    </section>
  );
}

function Section2_WhatIf() {
  const { ref, visible } = useScrollReveal<HTMLElement>(0.05);
  const revealedCount = useStaggeredReveal(3, visible, 1200);

  const lines = [
    'What if every letter always made the same sound?',
    "What if you could read any word correctly\u2009\u2014\u2009even one you'd never seen before?",
    "That's Ingglish.",
  ];

  return (
    <section ref={ref} className="tutorial-section tutorial-whatif revealed">
      {lines.map((line, i) => (
        <p
          key={i}
          className={`whatif-line ${i === 0 || i < revealedCount ? 'revealed' : ''} ${i === 2 ? 'whatif-punchline' : ''}`}
        >
          {line}
        </p>
      ))}
    </section>
  );
}

function SilentLetterWord({
  english,
  ingglish,
  silent,
  silentPos,
  animate,
}: {
  english: string;
  ingglish: string;
  silent: string;
  silentPos: 'start' | 'mid' | 'end';
  animate: boolean;
}) {
  // Split the word to highlight the silent letter
  let before: string, silentChar: string, after: string;
  if (silentPos === 'start') {
    silentChar = english[0];
    before = '';
    after = english.slice(1);
  } else if (silentPos === 'end') {
    silentChar = english[english.length - 1];
    before = english.slice(0, -1);
    after = '';
  } else {
    // mid - find the silent letter
    const idx = english.indexOf(silent);
    before = english.slice(0, idx);
    silentChar = english[idx];
    after = english.slice(idx + 1);
  }

  return (
    <span className={`silent-word ${animate ? 'animate' : ''}`}>
      <span className="silent-english">
        {before}
        <span className="silent-letter">{silentChar}</span>
        {after}
      </span>
      <span className="silent-arrow">&rarr;</span>
      <span className="silent-ingglish" data-orig={english}>
        {ingglish}
      </span>
    </span>
  );
}

/**
 * Hook: calls onComplete once revealedCount reaches total,
 * after a delay for the last item's animation to finish.
 */
function useStaggerComplete(revealedCount: number, total: number, onComplete: () => void) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (revealedCount >= total) {
      const timer = setTimeout(() => {
        onCompleteRef.current();
      }, 1000);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [revealedCount, total]);
}

/** Once active becomes true, it stays true (prevents animation replay). */
function useStickyActive(visible: boolean, previousDone: boolean): boolean {
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (visible && previousDone && !active) {
      setActive(true);
    }
  }, [visible, previousDone, active]);
  return active;
}

function Section3a_SilentLetters({
  previousDone,
  onComplete,
}: {
  previousDone: boolean;
  onComplete: () => void;
}) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();
  const active = useStickyActive(visible, previousDone);
  const revealedCount = useStaggeredReveal(silentLetterExamples.length, active, 800);
  useStaggerComplete(revealedCount, silentLetterExamples.length, onComplete);

  return (
    <div ref={ref} className={`tutorial-substep ${active ? 'revealed' : ''}`}>
      <h3 className="tutorial-subheading">Drop the silent letters</h3>
      <p className="tutorial-caption">Every letter you see is a letter you say.</p>
      <div className="silent-list">
        {silentLetterExamples.map((ex, i) => (
          <SilentLetterWord key={ex.english} {...ex} animate={i < revealedCount} />
        ))}
      </div>
    </div>
  );
}

/**
 * Splits a word around a highlight substring.
 * Returns before, highlighted, and after parts.
 */
function splitHighlight(word: string, highlight: string | undefined) {
  if (highlight === undefined || highlight === '') {
    return { before: word, highlighted: '', after: '' };
  }
  const idx = word.toLowerCase().indexOf(highlight.toLowerCase());
  if (idx === -1) {
    return { before: word, highlighted: '', after: '' };
  }
  return {
    before: word.slice(0, idx),
    highlighted: word.slice(idx, idx + highlight.length),
    after: word.slice(idx + highlight.length),
  };
}

/** Renders a word with an optional colored highlight span. */
function HighlightedWord({
  word,
  highlight,
  className,
}: {
  word: string;
  highlight: string | undefined;
  className: string;
}) {
  const { before, highlighted, after } = splitHighlight(word, highlight);
  if (!highlighted) {
    return <>{word}</>;
  }
  return (
    <>
      {before}
      <span className={className}>{highlighted}</span>
      {after}
    </>
  );
}

function AnimatedSoundWord({
  english,
  ingglish,
  highlightEn,
  highlightIng,
  animate,
}: {
  english: string;
  ingglish: string;
  highlightEn?: string;
  highlightIng?: string;
  animate: boolean;
}) {
  const [morphed, setMorphed] = useState(false);

  useEffect(() => {
    if (!animate) {
      setMorphed(false);
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setMorphed(true);
      return;
    }
    const timer = setTimeout(() => {
      setMorphed(true);
    }, 800);
    return () => {
      clearTimeout(timer);
    };
  }, [animate]);

  const changed = english.toLowerCase() !== ingglish.toLowerCase();
  const showHighlight =
    highlightEn !== undefined &&
    highlightEn !== '' &&
    highlightIng !== undefined &&
    highlightIng !== '';
  // When highlight is the same (th→th), use blue on both sides to show "preserved"
  // When highlight differs (th→dh), use red on English side to show "changing"
  const sameHighlight = showHighlight && highlightEn.toLowerCase() === highlightIng.toLowerCase();
  const enHighlightClass = sameHighlight ? 'sound-highlight-new' : 'sound-highlight-old';

  return (
    <span className={`sound-word ${animate ? 'animate' : ''} ${morphed ? 'morphed' : ''}`}>
      <span className="sound-english">
        <HighlightedWord
          word={english}
          highlight={showHighlight ? highlightEn : undefined}
          className={enHighlightClass}
        />
      </span>
      <span className="sound-arrow">&rarr;</span>
      {changed ? (
        <span className="sound-morph" data-orig={english}>
          <span className="sound-morph-before">
            <HighlightedWord
              word={english}
              highlight={showHighlight ? highlightEn : undefined}
              className={enHighlightClass}
            />
          </span>
          <span className="sound-morph-after">
            <HighlightedWord
              word={ingglish}
              highlight={showHighlight ? highlightIng : undefined}
              className="sound-highlight-new"
            />
          </span>
        </span>
      ) : (
        <span className="sound-ingglish">
          <HighlightedWord
            word={ingglish}
            highlight={showHighlight ? highlightIng : undefined}
            className="sound-highlight-new"
          />
        </span>
      )}
    </span>
  );
}

function SoundGroup({
  examples,
  sound,
  revealedCount,
  startIndex,
}: {
  examples: ExampleWord[];
  sound: string;
  revealedCount: number;
  startIndex: number;
}) {
  // Delay the description until the last word's morph animation finishes (800ms)
  const allRevealed = revealedCount >= startIndex + examples.length;
  const [descVisible, setDescVisible] = useState(false);
  useEffect(() => {
    if (!allRevealed) {
      return;
    }
    const timer = setTimeout(() => {
      setDescVisible(true);
    }, 1000);
    return () => {
      clearTimeout(timer);
    };
  }, [allRevealed]);

  return (
    <div className="sound-group">
      <div className="sound-examples">
        {examples.map((ex, i) => (
          <AnimatedSoundWord
            key={ex.english}
            english={ex.english}
            ingglish={ex.ingglish}
            highlightEn={ex.highlightEn}
            highlightIng={ex.highlightIng}
            animate={revealedCount > startIndex + i}
          />
        ))}
      </div>
      <p className={`sound-description ${descVisible ? 'animate' : ''}`}>
        {examples.length} different spellings for the same sound. In Ingglish, they&rsquo;re all
        &ldquo;<strong>{sound}</strong>.&rdquo;
      </p>
    </div>
  );
}

function Section3b_OneSound({
  previousDone,
  onComplete,
}: {
  previousDone: boolean;
  onComplete: () => void;
}) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();
  const active = useStickyActive(visible, previousDone);
  const total = eeSoundExamples.length + aySoundExamples.length;
  const revealedCount = useStaggeredReveal(total, active, 1200);
  useStaggerComplete(revealedCount, total, onComplete);

  return (
    <div ref={ref} className={`tutorial-substep ${active ? 'revealed' : ''}`}>
      <h3 className="tutorial-subheading">One sound, one spelling</h3>
      <p className="tutorial-caption">Same sound always written the same way.</p>
      <SoundGroup
        examples={eeSoundExamples}
        sound="ee"
        revealedCount={revealedCount}
        startIndex={0}
      />
      <SoundGroup
        examples={aySoundExamples}
        sound="ay"
        revealedCount={revealedCount}
        startIndex={eeSoundExamples.length}
      />
    </div>
  );
}

function SimpleRuleGroup({
  title,
  caption,
  examples,
  previousDone,
  onComplete,
}: {
  title: string;
  caption: string;
  examples: ExampleWord[];
  previousDone: boolean;
  onComplete: () => void;
}) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();
  const active = useStickyActive(visible, previousDone);
  const revealedCount = useStaggeredReveal(examples.length, active, 1200);
  useStaggerComplete(revealedCount, examples.length, onComplete);

  return (
    <div ref={ref} className={`tutorial-substep ${active ? 'revealed' : ''}`}>
      <h3 className="tutorial-subheading">{title}</h3>
      <p className="tutorial-caption">{caption}</p>
      <div className="sound-examples">
        {examples.map((ex, i) => (
          <AnimatedSoundWord
            key={ex.english}
            english={ex.english}
            ingglish={ex.ingglish}
            highlightEn={ex.highlightEn}
            highlightIng={ex.highlightIng}
            animate={i < revealedCount}
          />
        ))}
      </div>
    </div>
  );
}

function Section3c_ThDh({
  previousDone,
  onComplete,
}: {
  previousDone: boolean;
  onComplete: () => void;
}) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();
  const active = useStickyActive(visible, previousDone);
  const total = voicelessTh.length + voicedTh.length;
  const revealedCount = useStaggeredReveal(total, active, 1200);
  useStaggerComplete(revealedCount, total, onComplete);

  return (
    <div ref={ref} className={`tutorial-substep ${active ? 'revealed' : ''}`}>
      <h3 className="tutorial-subheading">Two sounds hiding in &ldquo;th&rdquo;</h3>
      <p className="tutorial-caption">
        Say &ldquo;thin,&rdquo; then &ldquo;the.&rdquo; Feel your throat vibrate? Different sounds
        &mdash; different spellings.
      </p>
      <div className="thdh-comparison">
        <div className="thdh-column">
          <h4>Voiceless (th)</h4>
          <div className="sound-examples">
            {voicelessTh.map((ex, i) => (
              <AnimatedSoundWord
                key={ex.english}
                english={ex.english}
                ingglish={ex.ingglish}
                highlightEn={ex.highlightEn}
                highlightIng={ex.highlightIng}
                animate={i < revealedCount}
              />
            ))}
          </div>
        </div>
        <div className="thdh-column">
          <h4>Voiced (dh)</h4>
          <div className="sound-examples">
            {voicedTh.map((ex, i) => (
              <AnimatedSoundWord
                key={ex.english}
                english={ex.english}
                ingglish={ex.ingglish}
                highlightEn={ex.highlightEn}
                highlightIng={ex.highlightIng}
                animate={revealedCount > voicelessTh.length + i}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section3_Transform() {
  // Track which substeps have finished their animations.
  // Each substep only starts when the previous one completes.
  const [completedStep, setCompletedStep] = useState(-1);
  const markComplete = useCallback((step: number) => {
    setCompletedStep((prev) => Math.max(prev, step));
  }, []);

  return (
    <section className="tutorial-section">
      <h2 className="tutorial-heading">How it works</h2>
      <Section3a_SilentLetters
        previousDone
        onComplete={() => {
          markComplete(0);
        }}
      />
      <Section3b_OneSound
        previousDone={completedStep >= 0}
        onComplete={() => {
          markComplete(1);
        }}
      />
      <SimpleRuleGroup
        title={'"ph" is just "f"'}
        caption="Why use two letters when one already makes the sound?"
        examples={phExamples}
        previousDone={completedStep >= 1}
        onComplete={() => {
          markComplete(2);
        }}
      />
      <SimpleRuleGroup
        title="C can't make up its mind"
        caption={'Sometimes it\'s "k," sometimes it\'s "s." Ingglish picks one and sticks with it.'}
        examples={ckExamples}
        previousDone={completedStep >= 2}
        onComplete={() => {
          markComplete(3);
        }}
      />
      <SimpleRuleGroup
        title="The silent &ldquo;ght&rdquo; club"
        caption="The gh is silent, the i is really &ldquo;ai&rdquo; — so just write what you hear."
        examples={ightExamples}
        previousDone={completedStep >= 3}
        onComplete={() => {
          markComplete(4);
        }}
      />
      <SimpleRuleGroup
        title={'"Shun" hiding in disguise'}
        caption={'The "sh" sound hides behind -tion, -cean, -sure. In Ingglish, it\'s always "sh."'}
        examples={tionExamples}
        previousDone={completedStep >= 4}
        onComplete={() => {
          markComplete(5);
        }}
      />
      <Section3c_ThDh
        previousDone={completedStep >= 5}
        onComplete={() => {
          markComplete(6);
        }}
      />
    </section>
  );
}

function Section4_Progressive() {
  const [currentStep, setCurrentStep] = useState(0);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [lockedHeight, setLockedHeight] = useState<number | null>(null);

  // Lock the text height on mount (step 0 = English text, generally tallest)
  // so the controls below don't shift when words transform to shorter spellings.
  useEffect(() => {
    if (textRef.current && lockedHeight === null) {
      setLockedHeight(textRef.current.scrollHeight);
    }
  }, [lockedHeight]);

  return (
    <section className="tutorial-section">
      <h2 className="tutorial-heading">See it in action</h2>
      <div className="progressive-paragraph">
        <p
          className="progressive-text"
          ref={textRef}
          style={lockedHeight !== null ? { minHeight: lockedHeight } : undefined}
        >
          {paragraphWords.map((w, i) => {
            const transformed = w.step > 0 && currentStep >= w.step;
            const justTransformed = w.step > 0 && currentStep === w.step;
            const displayWord = transformed ? w.ingglish : w.english;
            const actuallyChanged = w.english.toLowerCase() !== w.ingglish.toLowerCase();
            return (
              <span key={i}>
                <span
                  className={`progressive-word${transformed ? ' transformed' : ''}${justTransformed ? ' highlighted' : ''}`}
                  data-orig={transformed && actuallyChanged ? w.english : undefined}
                >
                  {displayWord}
                </span>
                {w.trailing ?? ''}{' '}
              </span>
            );
          })}
        </p>
        <p className="progressive-caption">
          {currentStep > 0 ? stepCaptions[currentStep] : '\u00A0'}
        </p>
        <p
          className="progressive-caption"
          style={{ visibility: currentStep > 0 ? 'visible' : 'hidden' }}
        >
          Hover any blue word to see the original.
        </p>
        <div className="progressive-controls">
          <button
            className="progressive-btn"
            onClick={() => {
              setCurrentStep((s) => Math.max(0, s - 1));
            }}
            disabled={currentStep === 0}
          >
            &larr; Back
          </button>
          <span className="progressive-indicator">
            {currentStep === 0 ? 'Original' : `Step ${currentStep} of 6`}
          </span>
          <button
            className="progressive-btn progressive-btn-next"
            onClick={() => {
              setCurrentStep((s) => Math.min(6, s + 1));
            }}
            disabled={currentStep === 6}
          >
            Next &rarr;
          </button>
        </div>
      </div>
    </section>
  );
}

function Section5_Poem() {
  const { ref, visible } = useScrollReveal<HTMLDivElement>(0.3);
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  // Bumped to restart the auto-advance effect (replay or unpause)
  const [advanceToken, setAdvanceToken] = useState(0);

  const totalSteps = 24;
  const finished = step > totalSteps;
  const advancing = visible && !finished && !paused;

  // Auto-advance steps once visible (24 lines, one at a time).
  // Uses a ref to read step without depending on it, so the effect
  // only re-runs when visibility/pause/replay changes.
  const stepRef = useRef(step);
  stepRef.current = step;

  useEffect(() => {
    if (!visible || paused) {
      return;
    }

    const currentStep = stepRef.current;
    if (currentStep > totalSteps) {
      return;
    }

    const delayMs = 1500;
    const initialDelayMs = currentStep === 0 ? 2000 : delayMs;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStep(totalSteps + 1);
      return;
    }

    const remaining = totalSteps + 1 - currentStep;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= remaining; i++) {
      timers.push(
        setTimeout(
          () => {
            setStep(currentStep + i);
          },
          initialDelayMs + (i - 1) * delayMs
        )
      );
    }

    return () => {
      timers.forEach((t) => {
        clearTimeout(t);
      });
    };
  }, [visible, paused, advanceToken]);

  return (
    <section ref={ref} className="tutorial-section">
      <h2 className="tutorial-heading">Hints on Pronunciation for Foreigners</h2>
      <p className="poem-attribution">&mdash; attributed to T.S. Watt, 1954</p>
      <div className="poem-paragraph">
        <div className="poem-controls">
          {advancing && (
            <button
              className="poem-control-btn"
              onClick={() => {
                setPaused(true);
              }}
              title="Pause"
            >
              &#x23f8;
            </button>
          )}
          {paused && !finished && (
            <button
              className="poem-control-btn"
              onClick={() => {
                setPaused(false);
              }}
              title="Play"
            >
              &#x25b6;
            </button>
          )}
          {finished && (
            <button
              className="poem-control-btn"
              onClick={() => {
                setStep(0);
                setPaused(false);
                setAdvanceToken((c) => c + 1);
              }}
              title="Replay"
            >
              &#x21bb;
            </button>
          )}
        </div>
        <p className="poem-text">
          {poemWords.map((w, i) => {
            if (w.e === '\n') {
              return <br key={i} />;
            }
            const transformed = step >= w.s && w.s > 0;
            const actuallyChanged = w.e.toLowerCase() !== w.i.toLowerCase();
            const justChanged = step === w.s && w.s > 0 && actuallyChanged;
            const display = transformed ? w.i : w.e;
            return (
              <span key={i}>
                <span
                  className={`poem-word${transformed && actuallyChanged ? ' transformed' : ''}${justChanged ? ' highlighted' : ''}`}
                  data-orig={transformed && actuallyChanged ? w.e : undefined}
                >
                  {display}
                </span>{' '}
              </span>
            );
          })}
        </p>
      </div>
    </section>
  );
}

function Section6_ReadingTest() {
  return (
    <section className="tutorial-section">
      <h2 className="tutorial-heading">Can you read this?</h2>
      <div className="reading-test">
        <p className="reading-ingglish">
          {readingTestWords.map(([ingglish, english], i) => (
            <span key={i}>
              <span data-orig={english ?? undefined}>{ingglish}</span>{' '}
            </span>
          ))}
        </p>
        <p className="reading-attribution">&mdash; {readingTestAttribution}</p>
      </div>
    </section>
  );
}

function Section7_TryIt() {
  const [input, setInput] = useState('');
  const tokens = input ? translateSyncWithMapping(input) : [];

  return (
    <section className="tutorial-section">
      <h2 className="tutorial-heading">Try it yourself</h2>
      <div className="try-it-container">
        <input
          className="try-it-input"
          type="text"
          placeholder="Type English here…"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
          }}
        />
        {tokens.length > 0 && (
          <MappedWordDisplay tokens={tokens} className="try-it-output" placeholder="" />
        )}
      </div>
    </section>
  );
}

function Section8_CTA({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { ref, visible } = useScrollReveal<HTMLElement>();

  const handleNavigate = useCallback(
    (tab: string) => (e: React.MouseEvent) => {
      e.preventDefault();
      window.scrollTo(0, 0);
      onNavigate(tab);
    },
    [onNavigate]
  );

  return (
    <section ref={ref} className={`tutorial-section tutorial-cta ${visible ? 'revealed' : ''}`}>
      <h2 className="tutorial-heading">Try Ingglish</h2>
      <div className="cta-buttons">
        <a href="#text" className="cta-primary" onClick={handleNavigate('text')}>
          Translate Text
        </a>
        <a href="#url" className="cta-secondary" onClick={handleNavigate('url')}>
          Translate a Website
        </a>
        <a href="#guide" className="cta-secondary" onClick={handleNavigate('guide')}>
          Spelling Guide
        </a>
        <a href="#poems" className="cta-secondary" onClick={handleNavigate('poems')}>
          Poems
        </a>
      </div>
    </section>
  );
}

export default function Tutorial({ onNavigate }: TutorialProps) {
  return (
    <div className="tutorial">
      <Section1_Ough />
      <Section2_WhatIf />
      <Section3_Transform />
      <Section4_Progressive />
      <Section5_Poem />
      <Section6_ReadingTest />
      <Section7_TryIt />
      <Section8_CTA onNavigate={onNavigate} />
    </div>
  );
}
