import { useState, useEffect, useCallback } from 'react';
import {
  silentLetterExamples,
  eeSoundExamples,
  aySoundExamples,
  simplifyExamples,
  thDhExamples,
  type ExampleWord,
} from '../../data/tutorial-data';
import {
  useScrollReveal,
  useStaggeredReveal,
  useStaggerComplete,
  useStickyActive,
} from '../../hooks/useScrollReveal';

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
  const hasEnHighlight = highlightEn !== undefined && highlightEn !== '';
  const hasIngHighlight = highlightIng !== undefined && highlightIng !== '';
  // When highlight is the same (th→th), use blue on both sides to show "preserved"
  // When highlight differs (th→dh) or is En-only (silent letters), use red on English side
  const sameHighlight =
    hasEnHighlight && hasIngHighlight && highlightEn.toLowerCase() === highlightIng.toLowerCase();
  const enHighlightClass = sameHighlight ? 'sound-highlight-new' : 'sound-highlight-old';

  return (
    <span className={`sound-word ${animate ? 'animate' : ''} ${morphed ? 'morphed' : ''}`}>
      <span className="sound-english">
        <HighlightedWord
          word={english}
          highlight={hasEnHighlight ? highlightEn : undefined}
          className={enHighlightClass}
        />
      </span>
      <span className="sound-arrow">&rarr;</span>
      {changed ? (
        <span className="sound-morph" data-orig={english}>
          <span className="sound-morph-before">
            <HighlightedWord
              word={english}
              highlight={hasEnHighlight ? highlightEn : undefined}
              className={enHighlightClass}
            />
          </span>
          <span className="sound-morph-after">
            <HighlightedWord
              word={ingglish}
              highlight={hasIngHighlight ? highlightIng : undefined}
              className="sound-highlight-new"
            />
          </span>
        </span>
      ) : (
        <span className="sound-ingglish">
          <HighlightedWord
            word={ingglish}
            highlight={hasIngHighlight ? highlightIng : undefined}
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

function SilentLetters({
  previousDone,
  onComplete,
}: {
  previousDone: boolean;
  onComplete: () => void;
}) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();
  const active = useStickyActive(visible, previousDone);
  const revealedCount = useStaggeredReveal(silentLetterExamples.length, active, 600);
  useStaggerComplete(revealedCount, silentLetterExamples.length, onComplete);

  return (
    <div ref={ref} className={`tutorial-substep ${active ? 'revealed' : ''}`}>
      <h3 className="tutorial-subheading">Drop the silent letters</h3>
      <p className="tutorial-caption">No silent letters. Every letter contributes to the sound.</p>
      <div className="sound-examples">
        {silentLetterExamples.map((ex, i) => (
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

function OneSound({ previousDone, onComplete }: { previousDone: boolean; onComplete: () => void }) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();
  const active = useStickyActive(visible, previousDone);
  const total = eeSoundExamples.length + aySoundExamples.length;
  const revealedCount = useStaggeredReveal(total, active, 600);
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
  const revealedCount = useStaggeredReveal(examples.length, active, 600);
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

export function Section5Transform() {
  // Track which substeps have finished their animations.
  // Each substep only starts when the previous one completes.
  const [completedStep, setCompletedStep] = useState(-1);
  const markComplete = useCallback((step: number) => {
    setCompletedStep((prev) => Math.max(prev, step));
  }, []);

  return (
    <section className="tutorial-section">
      <h2 className="tutorial-heading">How it works</h2>
      <SilentLetters
        previousDone
        onComplete={() => {
          markComplete(0);
        }}
      />
      <OneSound
        previousDone={completedStep >= 0}
        onComplete={() => {
          markComplete(1);
        }}
      />
      <SimpleRuleGroup
        title="Simplify the strange ones"
        caption="Complex letter combos become what they sound like."
        examples={simplifyExamples}
        previousDone={completedStep >= 1}
        onComplete={() => {
          markComplete(2);
        }}
      />
      <SimpleRuleGroup
        title="&ldquo;Th&rdquo; hides two sounds"
        caption={
          'Say "thin," then "the." Feel the vibration? Different sounds, different spellings. Only about 20 common words use "dh" — the, this, that, they, mother, other — but they\'re among the most frequent in English.'
        }
        examples={thDhExamples}
        previousDone={completedStep >= 2}
        onComplete={() => {
          markComplete(3);
        }}
      />
    </section>
  );
}
