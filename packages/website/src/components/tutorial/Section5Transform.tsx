import { useCallback, useEffect, useState } from 'react';
import {
  aySoundExamples,
  eeSoundExamples,
  type ExampleWord,
  silentLetterExamples,
  simplifyExamples,
  thDhExamples,
} from '../../data/tutorial-data';
import {
  useScrollReveal,
  useStaggerComplete,
  useStaggeredReveal,
  useStickyActive,
} from '../../hooks/useScrollReveal';

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
        onComplete={() => {
          markComplete(0);
        }}
        previousDone
      />
      <OneSound
        onComplete={() => {
          markComplete(1);
        }}
        previousDone={completedStep >= 0}
      />
      <SimpleRuleGroup
        caption="Complex letter combos become what they sound like."
        examples={simplifyExamples}
        onComplete={() => {
          markComplete(2);
        }}
        previousDone={completedStep >= 1}
        title="Simplify the strange ones"
      />
      <SimpleRuleGroup
        caption={
          'Say "thin," then "the." Feel the vibration? Different sounds, different spellings. Only about 20 common words use "dh" — the, this, that, they, mother, other — but they\'re among the most frequent in English.'
        }
        examples={thDhExamples}
        onComplete={() => {
          markComplete(3);
        }}
        previousDone={completedStep >= 2}
        title="&ldquo;Th&rdquo; hides two sounds"
      />
    </section>
  );
}

function AnimatedSoundWord({
  animate,
  english,
  highlightEn,
  highlightIng,
  ingglish,
}: {
  animate: boolean;
  english: string;
  highlightEn?: string;
  highlightIng?: string;
  ingglish: string;
}) {
  const [morphed, setMorphed] = useState(false);

  useEffect(() => {
    if (!animate) {
      setMorphed(false);
      return;
    }
    if (globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
          className={enHighlightClass}
          highlight={hasEnHighlight ? highlightEn : undefined}
          word={english}
        />
      </span>
      <span className="sound-arrow">&rarr;</span>
      {changed ? (
        <span className="sound-morph" data-orig={english}>
          <span className="sound-morph-before">
            <HighlightedWord
              className={enHighlightClass}
              highlight={hasEnHighlight ? highlightEn : undefined}
              word={english}
            />
          </span>
          <span className="sound-morph-after">
            <HighlightedWord
              className="sound-highlight-new"
              highlight={hasIngHighlight ? highlightIng : undefined}
              word={ingglish}
            />
          </span>
        </span>
      ) : (
        <span className="sound-ingglish">
          <HighlightedWord
            className="sound-highlight-new"
            highlight={hasIngHighlight ? highlightIng : undefined}
            word={ingglish}
          />
        </span>
      )}
    </span>
  );
}

/** Renders a word with an optional colored highlight span. */
function HighlightedWord({
  className,
  highlight,
  word,
}: {
  className: string;
  highlight: string | undefined;
  word: string;
}) {
  const { after, before, highlighted } = splitHighlight(word, highlight);
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

function OneSound({ onComplete, previousDone }: { onComplete: () => void; previousDone: boolean }) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();
  const active = useStickyActive(visible, previousDone);
  const total = eeSoundExamples.length + aySoundExamples.length;
  const revealedCount = useStaggeredReveal(total, active, 600);
  useStaggerComplete(revealedCount, total, onComplete);

  return (
    <div className={`tutorial-substep ${active ? 'revealed' : ''}`} ref={ref}>
      <h3 className="tutorial-subheading">One sound, one spelling</h3>
      <p className="tutorial-caption">Same sound always written the same way.</p>
      <SoundGroup
        examples={eeSoundExamples}
        revealedCount={revealedCount}
        sound="ee"
        startIndex={0}
      />
      <SoundGroup
        examples={aySoundExamples}
        revealedCount={revealedCount}
        sound="ay"
        startIndex={eeSoundExamples.length}
      />
    </div>
  );
}

function SilentLetters({
  onComplete,
  previousDone,
}: {
  onComplete: () => void;
  previousDone: boolean;
}) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();
  const active = useStickyActive(visible, previousDone);
  const revealedCount = useStaggeredReveal(silentLetterExamples.length, active, 600);
  useStaggerComplete(revealedCount, silentLetterExamples.length, onComplete);

  return (
    <div className={`tutorial-substep ${active ? 'revealed' : ''}`} ref={ref}>
      <h3 className="tutorial-subheading">Drop the silent letters</h3>
      <p className="tutorial-caption">No silent letters. Every letter contributes to the sound.</p>
      <div className="sound-examples">
        {silentLetterExamples.map((ex, i) => (
          <AnimatedSoundWord
            animate={i < revealedCount}
            english={ex.english}
            highlightEn={ex.highlightEn}
            highlightIng={ex.highlightIng}
            ingglish={ex.ingglish}
            key={ex.english}
          />
        ))}
      </div>
    </div>
  );
}

function SimpleRuleGroup({
  caption,
  examples,
  onComplete,
  previousDone,
  title,
}: {
  caption: string;
  examples: ExampleWord[];
  onComplete: () => void;
  previousDone: boolean;
  title: string;
}) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();
  const active = useStickyActive(visible, previousDone);
  const revealedCount = useStaggeredReveal(examples.length, active, 600);
  useStaggerComplete(revealedCount, examples.length, onComplete);

  return (
    <div className={`tutorial-substep ${active ? 'revealed' : ''}`} ref={ref}>
      <h3 className="tutorial-subheading">{title}</h3>
      <p className="tutorial-caption">{caption}</p>
      <div className="sound-examples">
        {examples.map((ex, i) => (
          <AnimatedSoundWord
            animate={i < revealedCount}
            english={ex.english}
            highlightEn={ex.highlightEn}
            highlightIng={ex.highlightIng}
            ingglish={ex.ingglish}
            key={ex.english}
          />
        ))}
      </div>
    </div>
  );
}

function SoundGroup({
  examples,
  revealedCount,
  sound,
  startIndex,
}: {
  examples: ExampleWord[];
  revealedCount: number;
  sound: string;
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
            animate={revealedCount > startIndex + i}
            english={ex.english}
            highlightEn={ex.highlightEn}
            highlightIng={ex.highlightIng}
            ingglish={ex.ingglish}
            key={ex.english}
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

/**
 * Splits a word around a highlight substring.
 * Returns before, highlighted, and after parts.
 */
function splitHighlight(word: string, highlight: string | undefined) {
  if (highlight === undefined || highlight === '') {
    return { after: '', before: word, highlighted: '' };
  }
  const idx = word.toLowerCase().indexOf(highlight.toLowerCase());
  if (idx === -1) {
    return { after: '', before: word, highlighted: '' };
  }
  return {
    after: word.slice(idx + highlight.length),
    before: word.slice(0, idx),
    highlighted: word.slice(idx, idx + highlight.length),
  };
}
