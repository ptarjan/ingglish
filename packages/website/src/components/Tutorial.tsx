import { useEffect, useRef, useState, useCallback } from 'react';

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

  useEffect(() => {
    if (!visible) {
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRevealedCount(count);
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setRevealedCount(i);
      if (i >= count) {
        clearInterval(interval);
      }
    }, delayMs);
    return () => {
      clearInterval(interval);
    };
  }, [visible, count, delayMs]);

  return revealedCount;
}

// --- Data ---

const oughExamples = [
  { prefix: 'thr', suffix: '', sound: 'oo' },
  { prefix: 'th', suffix: '', sound: 'oh' },
  { prefix: 'th', suffix: 't', sound: 'aw' },
  { prefix: 't', suffix: '', sound: 'uf' },
  { prefix: 'c', suffix: '', sound: 'of' },
  { prefix: 'b', suffix: '', sound: 'ow' },
];

const silentLetterExamples = [
  { english: 'knee', ingglish: 'nee', silent: 'k', silentPos: 'start' as const },
  { english: 'wrap', ingglish: 'rap', silent: 'w', silentPos: 'start' as const },
  { english: 'lamb', ingglish: 'lam', silent: 'b', silentPos: 'end' as const },
  { english: 'doubt', ingglish: 'dout', silent: 'b', silentPos: 'mid' as const },
  { english: 'gnaw', ingglish: 'naw', silent: 'g', silentPos: 'start' as const },
];

const eeSoundExamples = [
  { english: 'sea', ingglish: 'see', highlight: 'ea' },
  { english: 'key', ingglish: 'kee', highlight: 'ey' },
  { english: 'me', ingglish: 'mee', highlight: 'e' },
  { english: 'field', ingglish: 'feeld', highlight: 'ie' },
];

const aySoundExamples = [
  { english: 'day', ingglish: 'day', highlight: 'ay' },
  { english: 'weigh', ingglish: 'way', highlight: 'eigh' },
  { english: 'steak', ingglish: 'stayk', highlight: 'ea' },
  { english: 'great', ingglish: 'grayt', highlight: 'ea' },
];

const phExamples = [
  { english: 'phone', ingglish: 'fohn' },
  { english: 'photo', ingglish: 'fohtoh' },
  { english: 'graph', ingglish: 'graf' },
  { english: 'elephant', ingglish: 'elufunt' },
];

const ckExamples = [
  { english: 'cat', ingglish: 'kat' },
  { english: 'city', ingglish: 'sitee' },
  { english: 'queen', ingglish: 'kween' },
  { english: 'back', ingglish: 'bak' },
];

const ightExamples = [
  { english: 'night', ingglish: 'nait' },
  { english: 'light', ingglish: 'lait' },
  { english: 'knight', ingglish: 'nait' },
  { english: 'weight', ingglish: 'wayt' },
];

const tionExamples = [
  { english: 'nation', ingglish: 'nayshun' },
  { english: 'station', ingglish: 'stayshun' },
  { english: 'ocean', ingglish: 'ohshun' },
  { english: 'sure', ingglish: 'shoor' },
];

const voicelessTh = [
  { english: 'think', ingglish: 'thingk' },
  { english: 'thin', ingglish: 'thin' },
  { english: 'thought', ingglish: 'thawt' },
];

const voicedTh = [
  { english: 'the', ingglish: 'dhu' },
  { english: 'this', ingglish: 'dhis' },
  { english: 'that', ingglish: 'dhat' },
];

// Progressive paragraph data
// Steps match the "How it works" teaching order:
// 1 = silent letters, 2 = one sound one spelling (vowels),
// 3 = ph→f, 4 = c→k/s, 5 = -ight/-tion, 6 = th/dh
interface ParagraphWord {
  english: string;
  ingglish: string;
  step: number;
  trailing?: string;
}

// "The knight thought he could phone the city office to schedule a flight through
// the night, but the receptionist said the physician was caught in traffic."
const paragraphWords: ParagraphWord[] = [
  { english: 'The', ingglish: 'Dhu', step: 6 },
  { english: 'knight', ingglish: 'nait', step: 1 },
  { english: 'thought', ingglish: 'thawt', step: 2 },
  { english: 'he', ingglish: 'hee', step: 2 },
  { english: 'could', ingglish: 'kood', step: 1 },
  { english: 'phone', ingglish: 'fohn', step: 3 },
  { english: 'the', ingglish: 'dhu', step: 6 },
  { english: 'city', ingglish: 'sitee', step: 4 },
  { english: 'office', ingglish: 'awfis', step: 4 },
  { english: 'to', ingglish: 'tuu', step: 2 },
  { english: 'schedule', ingglish: 'skejool', step: 4 },
  { english: 'a', ingglish: 'u', step: 2 },
  { english: 'flight', ingglish: 'flait', step: 5 },
  { english: 'through', ingglish: 'thruu', step: 2 },
  { english: 'the', ingglish: 'dhu', step: 6 },
  { english: 'night,', ingglish: 'nait,', step: 5 },
  { english: 'but', ingglish: 'but', step: 0 },
  { english: 'the', ingglish: 'dhu', step: 6 },
  { english: 'receptionist', ingglish: 'risepshunist', step: 4 },
  { english: 'said', ingglish: 'sed', step: 2 },
  { english: 'the', ingglish: 'dhu', step: 6 },
  { english: 'physician', ingglish: 'fuzishun', step: 3 },
  { english: 'was', ingglish: 'woz', step: 2 },
  { english: 'caught', ingglish: 'kot', step: 5 },
  { english: 'in', ingglish: 'in', step: 0 },
  { english: 'traffic.', ingglish: 'trafik.', step: 4 },
];

const stepCaptions = [
  '',
  'Drop the silent letters \u2014 knight, could.',
  'One sound, one spelling \u2014 consistent vowels.',
  '"Ph" is just "f" \u2014 phone, physician.',
  'C picks a lane \u2014 city, office, schedule.',
  'The silent "ght" club \u2014 flight, night, caught.',
  '"Th" vs "dh" \u2014 the gets its own sound.',
];

// "Hints on Pronunciation for Foreigners" (anonymous, public domain).
// Each couplet points out a different absurdity — the Ingglish transformation fixes it.
// e = english, i = ingglish, s = step (0 = never changes, '\n' = line break)
interface PoemWord {
  e: string;
  i: string;
  s: number;
}

// 24 lines, each its own step. Transforms one line at a time.
const poemWords: PoemWord[] = [
  // Line 1: "I take it you already know"
  { e: 'I', i: 'Ai', s: 1 },
  { e: 'take', i: 'tayk', s: 1 },
  { e: 'it', i: 'it', s: 1 },
  { e: 'you', i: 'yuu', s: 1 },
  { e: 'already', i: 'awlredee', s: 1 },
  { e: 'know', i: 'noh', s: 1 },
  { e: '\n', i: '\n', s: 0 },
  // Line 2: "Of tough and bough and cough and dough?"
  { e: 'Of', i: 'Uv', s: 2 },
  { e: 'tough', i: 'tuf', s: 2 },
  { e: 'and', i: 'und', s: 2 },
  { e: 'bough', i: 'bou', s: 2 },
  { e: 'and', i: 'und', s: 2 },
  { e: 'cough', i: 'kof', s: 2 },
  { e: 'and', i: 'und', s: 2 },
  { e: 'dough?', i: 'doh?', s: 2 },
  { e: '\n', i: '\n', s: 0 },
  // Line 3: "Others may stumble, but not you,"
  { e: 'Others', i: 'Udherz', s: 3 },
  { e: 'may', i: 'may', s: 3 },
  { e: 'stumble,', i: 'stumbul,', s: 3 },
  { e: 'but', i: 'but', s: 3 },
  { e: 'not', i: 'not', s: 3 },
  { e: 'you,', i: 'yuu,', s: 3 },
  { e: '\n', i: '\n', s: 0 },
  // Line 4: "On hiccup, thorough, laugh, and through."
  { e: 'On', i: 'On', s: 4 },
  { e: 'hiccup,', i: 'hikup,', s: 4 },
  { e: 'thorough,', i: 'theroh,', s: 4 },
  { e: 'laugh,', i: 'laf,', s: 4 },
  { e: 'and', i: 'und', s: 4 },
  { e: 'through.', i: 'thruu.', s: 4 },
  { e: '\n', i: '\n', s: 0 },
  // Line 5: "Well done! And now you wish, perhaps,"
  { e: 'Well', i: 'Wel', s: 5 },
  { e: 'done!', i: 'dun!', s: 5 },
  { e: 'And', i: 'Und', s: 5 },
  { e: 'now', i: 'nou', s: 5 },
  { e: 'you', i: 'yuu', s: 5 },
  { e: 'wish,', i: 'wish,', s: 5 },
  { e: 'perhaps,', i: 'perhaps,', s: 5 },
  { e: '\n', i: '\n', s: 0 },
  // Line 6: "To learn of these familiar traps?"
  { e: 'To', i: 'Tuu', s: 6 },
  { e: 'learn', i: 'lern', s: 6 },
  { e: 'of', i: 'uv', s: 6 },
  { e: 'these', i: 'dheez', s: 6 },
  { e: 'familiar', i: 'fumilyer', s: 6 },
  { e: 'traps?', i: 'traps?', s: 6 },
  { e: '\n', i: '\n', s: 0 },
  // Line 7: "Beware of heard, a dreadful word,"
  { e: 'Beware', i: 'Biwair', s: 7 },
  { e: 'of', i: 'uv', s: 7 },
  { e: 'heard,', i: 'herd,', s: 7 },
  { e: 'a', i: 'u', s: 7 },
  { e: 'dreadful', i: 'dredful', s: 7 },
  { e: 'word,', i: 'werd,', s: 7 },
  { e: '\n', i: '\n', s: 0 },
  // Line 8: "That looks like beard and sounds like bird."
  { e: 'That', i: 'Dhat', s: 8 },
  { e: 'looks', i: 'looks', s: 8 },
  { e: 'like', i: 'laik', s: 8 },
  { e: 'beard', i: 'beerd', s: 8 },
  { e: 'and', i: 'und', s: 8 },
  { e: 'sounds', i: 'soundz', s: 8 },
  { e: 'like', i: 'laik', s: 8 },
  { e: 'bird.', i: 'berd.', s: 8 },
  { e: '\n', i: '\n', s: 0 },
  // Line 9: "And dead: it's said like bed, not bead,"
  { e: 'And', i: 'Und', s: 9 },
  { e: 'dead:', i: 'ded:', s: 9 },
  { e: "it's", i: "it's", s: 9 },
  { e: 'said', i: 'sed', s: 9 },
  { e: 'like', i: 'laik', s: 9 },
  { e: 'bed,', i: 'bed,', s: 9 },
  { e: 'not', i: 'not', s: 9 },
  { e: 'bead,', i: 'beed,', s: 9 },
  { e: '\n', i: '\n', s: 0 },
  // Line 10: "For goodness' sake, don't call it deed!"
  { e: 'For', i: 'For', s: 10 },
  { e: "goodness'", i: "goodnus'", s: 10 },
  { e: 'sake,', i: 'sayk,', s: 10 },
  { e: "don't", i: 'dohnt', s: 10 },
  { e: 'call', i: 'kawl', s: 10 },
  { e: 'it', i: 'it', s: 10 },
  { e: 'deed!', i: 'deed!', s: 10 },
  { e: '\n', i: '\n', s: 0 },
  // Line 11: "Watch out for meat and great and threat,"
  { e: 'Watch', i: 'Woch', s: 11 },
  { e: 'out', i: 'out', s: 11 },
  { e: 'for', i: 'for', s: 11 },
  { e: 'meat', i: 'meet', s: 11 },
  { e: 'and', i: 'und', s: 11 },
  { e: 'great', i: 'grayt', s: 11 },
  { e: 'and', i: 'und', s: 11 },
  { e: 'threat,', i: 'thret,', s: 11 },
  { e: '\n', i: '\n', s: 0 },
  // Line 12: "They rhyme with suite and straight and debt."
  { e: 'They', i: 'Dhay', s: 12 },
  { e: 'rhyme', i: 'raim', s: 12 },
  { e: 'with', i: 'widh', s: 12 },
  { e: 'suite', i: 'sweet', s: 12 },
  { e: 'and', i: 'und', s: 12 },
  { e: 'straight', i: 'strayt', s: 12 },
  { e: 'and', i: 'und', s: 12 },
  { e: 'debt.', i: 'det.', s: 12 },
  { e: '\n', i: '\n', s: 0 },
  // Line 13: "A moth is not a moth in mother,"
  { e: 'A', i: 'U', s: 13 },
  { e: 'moth', i: 'mawth', s: 13 },
  { e: 'is', i: 'iz', s: 13 },
  { e: 'not', i: 'not', s: 13 },
  { e: 'a', i: 'u', s: 13 },
  { e: 'moth', i: 'mawth', s: 13 },
  { e: 'in', i: 'in', s: 13 },
  { e: 'mother,', i: 'mudher,', s: 13 },
  { e: '\n', i: '\n', s: 0 },
  // Line 14: "Nor both in bother, broth in brother."
  { e: 'Nor', i: 'Nor', s: 14 },
  { e: 'both', i: 'bohth', s: 14 },
  { e: 'in', i: 'in', s: 14 },
  { e: 'bother,', i: 'bodher,', s: 14 },
  { e: 'broth', i: 'brawth', s: 14 },
  { e: 'in', i: 'in', s: 14 },
  { e: 'brother.', i: 'brudher.', s: 14 },
  { e: '\n', i: '\n', s: 0 },
  // Line 15: "And here is not a match for there,"
  { e: 'And', i: 'Und', s: 15 },
  { e: 'here', i: 'heer', s: 15 },
  { e: 'is', i: 'iz', s: 15 },
  { e: 'not', i: 'not', s: 15 },
  { e: 'a', i: 'u', s: 15 },
  { e: 'match', i: 'mach', s: 15 },
  { e: 'for', i: 'for', s: 15 },
  { e: 'there,', i: 'dhair,', s: 15 },
  { e: '\n', i: '\n', s: 0 },
  // Line 16: "Nor dear and fear for bear and pear."
  { e: 'Nor', i: 'Nor', s: 16 },
  { e: 'dear', i: 'deer', s: 16 },
  { e: 'and', i: 'und', s: 16 },
  { e: 'fear', i: 'feer', s: 16 },
  { e: 'for', i: 'for', s: 16 },
  { e: 'bear', i: 'bair', s: 16 },
  { e: 'and', i: 'und', s: 16 },
  { e: 'pear.', i: 'pair.', s: 16 },
  { e: '\n', i: '\n', s: 0 },
  // Line 17: "And then there's does and rose and lose —"
  { e: 'And', i: 'Und', s: 17 },
  { e: 'then', i: 'dhen', s: 17 },
  { e: "there's", i: 'dhairz', s: 17 },
  { e: 'does', i: 'duz', s: 17 },
  { e: 'and', i: 'und', s: 17 },
  { e: 'rose', i: 'rohz', s: 17 },
  { e: 'and', i: 'und', s: 17 },
  { e: 'lose', i: 'luuz', s: 17 },
  { e: '\u2014', i: '\u2014', s: 17 },
  { e: '\n', i: '\n', s: 0 },
  // Line 18: "Just look them up — and goose and choose."
  { e: 'Just', i: 'Just', s: 18 },
  { e: 'look', i: 'look', s: 18 },
  { e: 'them', i: 'dhem', s: 18 },
  { e: 'up', i: 'up', s: 18 },
  { e: '\u2014', i: '\u2014', s: 18 },
  { e: 'and', i: 'und', s: 18 },
  { e: 'goose', i: 'guus', s: 18 },
  { e: 'and', i: 'und', s: 18 },
  { e: 'choose.', i: 'chuuz.', s: 18 },
  { e: '\n', i: '\n', s: 0 },
  // Line 19: "And cork and work and card and ward,"
  { e: 'And', i: 'Und', s: 19 },
  { e: 'cork', i: 'kork', s: 19 },
  { e: 'and', i: 'und', s: 19 },
  { e: 'work', i: 'werk', s: 19 },
  { e: 'and', i: 'und', s: 19 },
  { e: 'card', i: 'kard', s: 19 },
  { e: 'and', i: 'und', s: 19 },
  { e: 'ward,', i: 'word,', s: 19 },
  { e: '\n', i: '\n', s: 0 },
  // Line 20: "And font and front and word and sword."
  { e: 'And', i: 'Und', s: 20 },
  { e: 'font', i: 'font', s: 20 },
  { e: 'and', i: 'und', s: 20 },
  { e: 'front', i: 'frunt', s: 20 },
  { e: 'and', i: 'und', s: 20 },
  { e: 'word', i: 'werd', s: 20 },
  { e: 'and', i: 'und', s: 20 },
  { e: 'sword.', i: 'sord.', s: 20 },
  { e: '\n', i: '\n', s: 0 },
  // Line 21: "And do and go and thwart and cart —"
  { e: 'And', i: 'Und', s: 21 },
  { e: 'do', i: 'duu', s: 21 },
  { e: 'and', i: 'und', s: 21 },
  { e: 'go', i: 'goh', s: 21 },
  { e: 'and', i: 'und', s: 21 },
  { e: 'thwart', i: 'thwort', s: 21 },
  { e: 'and', i: 'und', s: 21 },
  { e: 'cart', i: 'kart', s: 21 },
  { e: '\u2014', i: '\u2014', s: 21 },
  { e: '\n', i: '\n', s: 0 },
  // Line 22: "Come, come, I've hardly made a start!"
  { e: 'Come,', i: 'Kum,', s: 22 },
  { e: 'come,', i: 'kum,', s: 22 },
  { e: "I've", i: 'aiv', s: 22 },
  { e: 'hardly', i: 'hardlee', s: 22 },
  { e: 'made', i: 'mayd', s: 22 },
  { e: 'a', i: 'u', s: 22 },
  { e: 'start!', i: 'start!', s: 22 },
  { e: '\n', i: '\n', s: 0 },
  // Line 23: "A dreadful language? Man alive,"
  { e: 'A', i: 'U', s: 23 },
  { e: 'dreadful', i: 'dredful', s: 23 },
  { e: 'language?', i: 'langgwuj?', s: 23 },
  { e: 'Man', i: 'Man', s: 23 },
  { e: 'alive,', i: 'ulaiv,', s: 23 },
  { e: '\n', i: '\n', s: 0 },
  // Line 24: "I'd mastered it when I was five!"
  { e: "I'd", i: 'Aid', s: 24 },
  { e: 'mastered', i: 'masterd', s: 24 },
  { e: 'it', i: 'it', s: 24 },
  { e: 'when', i: 'wen', s: 24 },
  { e: 'I', i: 'ai', s: 24 },
  { e: 'was', i: 'woz', s: 24 },
  { e: 'five!', i: 'faiv!', s: 24 },
];

// Reading test: word-by-word for tooltips. [ingglish, english] pairs.
// Only include english when it differs (for tooltip).
const readingTestWords: [string, string | null][] = [
  ['Tuu', 'To'],
  ['bee,', 'be,'],
  ['or', null],
  ['not', null],
  ['tuu', 'to'],
  ['bee,', 'be,'],
  ['dhat', 'that'],
  ['iz', 'is'],
  ['dhu', 'the'],
  ['kweschun:', 'question:'],
  ['Wedher', 'Whether'],
  ["'tiz", "'tis"],
  ['nohbler', 'nobler'],
  ['in', null],
  ['dhu', 'the'],
  ['maind', 'mind'],
  ['tuu', 'to'],
  ['sufer', 'suffer'],
  ['dhu', 'the'],
  ['slingz', 'slings'],
  ['und', 'and'],
  ['arrohz', 'arrows'],
  ['uv', 'of'],
  ['outrayjus', 'outrageous'],
  ['forchun,', 'fortune,'],
  ['or', null],
  ['tuu', 'to'],
  ['tayk', 'take'],
  ['armz', 'arms'],
  ['ugenst', 'against'],
  ['u', 'a'],
  ['see', 'sea'],
  ['uv', 'of'],
  ['trubulz.', 'troubles.'],
];
const readingTestAttribution = 'William Shakespeare, Hamlet';

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
      <div
        className={`ough-ingglish-word ${animate ? 'shown' : ''}`}
        data-orig={`${prefix}ough${suffix}`}
      >
        <span>{prefix}</span>
        <span className="ough-highlight-new">{sound}</span>
        <span>{suffix}</span>
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

function Section3a_SilentLetters() {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();
  const revealedCount = useStaggeredReveal(silentLetterExamples.length, visible, 1200);

  return (
    <div ref={ref} className="tutorial-substep revealed">
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

function SoundGroup({
  examples,
  sound,
}: {
  examples: { english: string; ingglish: string; highlight: string }[];
  sound: string;
}) {
  return (
    <div className="sound-group revealed">
      <div className="sound-examples">
        {examples.map((ex) => (
          <span key={ex.english} className="sound-word revealed">
            <span className="sound-english">{ex.english}</span>
            <span className="sound-arrow">&rarr;</span>
            <span className="sound-ingglish" data-orig={ex.english}>
              {ex.ingglish}
            </span>
          </span>
        ))}
      </div>
      <p className="sound-description revealed">
        {examples.length} different spellings for the same sound. In Ingglish, they&rsquo;re all
        &ldquo;<strong>{sound}</strong>.&rdquo;
      </p>
    </div>
  );
}

function Section3b_OneSound() {
  return (
    <div className="tutorial-substep revealed">
      <h3 className="tutorial-subheading">One sound, one spelling</h3>
      <p className="tutorial-caption">Same sound always written the same way.</p>
      <SoundGroup examples={eeSoundExamples} sound="ee" />
      <SoundGroup examples={aySoundExamples} sound="ay" />
    </div>
  );
}

function SimpleRuleGroup({
  title,
  caption,
  examples,
}: {
  title: string;
  caption: string;
  examples: { english: string; ingglish: string }[];
}) {
  return (
    <div className="tutorial-substep">
      <h3 className="tutorial-subheading">{title}</h3>
      <p className="tutorial-caption">{caption}</p>
      <div className="sound-examples">
        {examples.map((ex) => (
          <span key={ex.english} className="sound-word">
            <span className="sound-english">{ex.english}</span>
            <span className="sound-arrow">&rarr;</span>
            <span className="sound-ingglish" data-orig={ex.english}>
              {ex.ingglish}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Section3c_ThDh() {
  return (
    <div className="tutorial-substep">
      <h3 className="tutorial-subheading">Two sounds hiding in &ldquo;th&rdquo;</h3>
      <p className="tutorial-caption">
        Say &ldquo;thin,&rdquo; then &ldquo;the.&rdquo; Feel your throat vibrate? Different sounds
        &mdash; different spellings.
      </p>
      <div className="thdh-comparison">
        <div className="thdh-column">
          <h4>Voiceless (th)</h4>
          <div className="sound-examples">
            {voicelessTh.map((ex) => (
              <span key={ex.english} className="sound-word">
                <span className="sound-english">{ex.english}</span>
                <span className="sound-arrow">&rarr;</span>
                <span className="sound-ingglish" data-orig={ex.english}>
                  {ex.ingglish}
                </span>
              </span>
            ))}
          </div>
        </div>
        <div className="thdh-column">
          <h4>Voiced (dh)</h4>
          <div className="sound-examples">
            {voicedTh.map((ex) => (
              <span key={ex.english} className="sound-word">
                <span className="sound-english">{ex.english}</span>
                <span className="sound-arrow">&rarr;</span>
                <span className="sound-ingglish" data-orig={ex.english}>
                  {ex.ingglish}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section3_Transform() {
  return (
    <section className="tutorial-section">
      <h2 className="tutorial-heading">How it works</h2>
      <Section3a_SilentLetters />
      <Section3b_OneSound />
      <SimpleRuleGroup
        title={'"ph" is just "f"'}
        caption="Why use two letters when one already makes the sound?"
        examples={phExamples}
      />
      <SimpleRuleGroup
        title="C can't make up its mind"
        caption={'Sometimes it\'s "k," sometimes it\'s "s." Ingglish picks one and sticks with it.'}
        examples={ckExamples}
      />
      <SimpleRuleGroup
        title="The silent &ldquo;ght&rdquo; club"
        caption="The gh is silent, the i is really &ldquo;ai&rdquo; — so just write what you hear."
        examples={ightExamples}
      />
      <SimpleRuleGroup
        title={'"Shun" hiding in disguise'}
        caption={'The "sh" sound hides behind -tion, -cean, -sure. In Ingglish, it\'s always "sh."'}
        examples={tionExamples}
      />
      <Section3c_ThDh />
    </section>
  );
}

function Section4_Progressive() {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <section className="tutorial-section">
      <h2 className="tutorial-heading">See it in action</h2>
      <div className="progressive-paragraph">
        <p className="progressive-text">
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

  const [runCount, setRunCount] = useState(0);

  // Auto-advance steps once visible (24 lines, one at a time)
  useEffect(() => {
    if (!visible) {
      return;
    }

    const totalSteps = 24;
    const delayMs = 1500;
    const initialDelayMs = 2000;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStep(totalSteps + 1);
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= totalSteps + 1; i++) {
      timers.push(
        setTimeout(
          () => {
            setStep(i);
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
  }, [visible, runCount]);

  return (
    <section ref={ref} className="tutorial-section">
      <h2 className="tutorial-heading">Hints on Pronunciation for Foreigners</h2>
      <div className="twain-paragraph">
        <p className="twain-text">
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
                  className={`twain-word${transformed && actuallyChanged ? ' transformed' : ''}${justChanged ? ' highlighted' : ''}`}
                  data-orig={transformed && actuallyChanged ? w.e : undefined}
                >
                  {display}
                </span>{' '}
              </span>
            );
          })}
        </p>
      </div>
      {step > 24 && (
        <div className="progressive-controls">
          <button
            className="progressive-btn"
            onClick={() => {
              setStep(0);
              setRunCount((c) => c + 1);
            }}
          >
            &#x21bb; Replay
          </button>
        </div>
      )}
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

function Section7_CTA({ onNavigate }: { onNavigate: (tab: string) => void }) {
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
      <h2 className="tutorial-heading">See your own words in Ingglish</h2>
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
      <Section6_ReadingTest />
      <Section5_Poem />
      <Section7_CTA onNavigate={onNavigate} />
    </div>
  );
}
