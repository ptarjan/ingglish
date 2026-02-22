import { useState, useEffect, useRef } from 'react';
import { getDictionary, getWordFrequency } from '@ingglish/dictionary';
import { arpabetToFormat } from '@ingglish/phonemes';

interface FormatStats {
  /** Collision map for collision analysis */
  collisionMap: Map<string, string[]>;
  /** Frequency-weighted orthotactic probability (how English-looking the respelled words are) */
  naturalness: number;
  /** % of real-world text (by frequency) that stays identical */
  textPreservedPct: number;
  totalWords: number;
  /** % of real-world text (by frequency) with unambiguous spellings */
  uniquePct: number;
}

interface MappingStatsProps {
  version: number;
}

interface WordChange {
  experiment: string;
  standard: string;
  word: string;
}

/** Pre-compiled regex for filtering dictionary entries with punctuation */
const NON_ALPHA = /[^a-z]/i;

// ============================================================
// Bigram model for orthotactic probability
// ============================================================

const SMOOTHING_K = 0.01;

/** Cached bigram model, built once from dictionary English words */
let bigramModel: null | {
  bigramCounts: Map<string, number>;
  unigramCounts: Map<string, number>;
  vocabSize: number;
} = null;

function getBigramModel() {
  if (bigramModel !== null) {
    return bigramModel;
  }

  const dict = getDictionary();
  const bigramCounts = new Map<string, number>();
  const unigramCounts = new Map<string, number>();
  const alphabet = new Set<string>();

  for (const word of Object.keys(dict)) {
    const w = word.toLowerCase();
    if (NON_ALPHA.test(w)) {
      continue;
    }
    const freq = getWordFrequency(w) ?? 0;
    const weight = Math.log(freq + 1);
    const chars = '^' + w + '$';
    for (let i = 0; i < chars.length - 1; i++) {
      const c1 = chars[i]!;
      const c2 = chars[i + 1]!;
      alphabet.add(c1);
      alphabet.add(c2);
      const key = c1 + c2;
      bigramCounts.set(key, (bigramCounts.get(key) ?? 0) + weight);
      unigramCounts.set(c1, (unigramCounts.get(c1) ?? 0) + weight);
    }
  }

  bigramModel = { bigramCounts, unigramCounts, vocabSize: alphabet.size };
  return bigramModel;
}

/** Score a word by average log bigram probability (higher = more English-looking) */
function scoreWordOrthotactic(word: string): number {
  const { bigramCounts, unigramCounts, vocabSize } = getBigramModel();
  const w = word.toLowerCase();
  const chars = '^' + w + '$';
  const n = chars.length - 1;
  if (n === 0) {
    return -Infinity;
  }

  let sum = 0;
  for (let i = 0; i < n; i++) {
    const count = bigramCounts.get(chars[i]! + chars[i + 1]!) ?? 0;
    const total = unigramCounts.get(chars[i]!) ?? 0;
    sum += Math.log((count + SMOOTHING_K) / (total + SMOOTHING_K * vocabSize));
  }
  return sum / n;
}

/**
 * Pre-computed standard Ingglish data. Computed once on first use since the
 * standard mapping never changes during a session.
 */
let cachedIngglish: {
  /** For each word, the set of words it collides with */
  collisionGroupOf: Map<string, Set<string>>;
  /** word → standard spelling, for diff detection */
  spellings: Map<string, string>;
  stats: FormatStats;
} | null = null;

interface Stats {
  experiment: FormatStats;
  ingglish: FormatStats;
  topChanges: WordChange[];
  topCollisions: { spelling: string; words: string[] }[];
}

/**
 * Single-pass computation: experiment stats + top changes + new collisions.
 * Uses cached standard Ingglish data to avoid redundant dictionary iteration.
 */
function computeExperimentStats(ingglishCache: ReturnType<typeof getIngglishCache>): {
  stats: FormatStats;
  topChanges: WordChange[];
  topCollisions: { spelling: string; words: string[] }[];
} {
  const dict = getDictionary();
  const allWords = new Set<string>();
  const spellingToWords = new Map<string, string[]>();
  const wordFreqs = new Map<string, number>();
  const changes: { experiment: string; freq: number; standard: string; word: string }[] = [];
  let identicalFreqSum = 0;
  let totalFreqSum = 0;
  let naturalnessWeightedSum = 0;

  for (const [word, phonemes] of Object.entries(dict)) {
    if (NON_ALPHA.test(word)) {
      continue;
    }

    const wordLower = word.toLowerCase();
    allWords.add(wordLower);
    const expSpelling = arpabetToFormat(phonemes, 'experiment');

    const freq = getWordFrequency(wordLower) ?? 0;
    wordFreqs.set(wordLower, freq);
    totalFreqSum += freq;
    if (wordLower === expSpelling.toLowerCase()) {
      identicalFreqSum += freq;
    }

    // Orthotactic probability (naturalness)
    if (freq > 0) {
      const score = scoreWordOrthotactic(expSpelling);
      if (score !== -Infinity) {
        naturalnessWeightedSum += score * freq;
      }
    }

    // Group words by experiment spelling
    const existing = spellingToWords.get(expSpelling);
    if (existing) {
      existing.push(word);
    } else {
      spellingToWords.set(expSpelling, [word]);
    }

    // Collect changes vs standard (using cached standard spellings)
    const stdSpelling = ingglishCache.spellings.get(wordLower);
    if (stdSpelling !== undefined && stdSpelling !== expSpelling) {
      changes.push({ experiment: expSpelling, freq, standard: stdSpelling, word });
    }
  }

  const totalWords = allWords.size;

  // Count frequency-weighted collisions
  let collidingFreqSum = 0;
  for (const words of spellingToWords.values()) {
    if (words.length > 1) {
      for (const w of words) {
        collidingFreqSum += wordFreqs.get(w.toLowerCase()) ?? 0;
      }
    }
  }

  // Find new collisions (not present in standard Ingglish)
  const newCollisions: { score: number; spelling: string; words: string[] }[] = [];
  for (const [spelling, expWords] of spellingToWords) {
    if (expWords.length <= 1) {
      continue;
    }
    // Check if every word already collided together in standard
    const lowerWords = expWords.map((w) => w.toLowerCase());
    const standardGroup = ingglishCache.collisionGroupOf.get(lowerWords[0]!);
    if (standardGroup !== undefined && lowerWords.every((w) => standardGroup.has(w))) {
      continue;
    }
    let maxFreq = 0;
    for (const w of expWords) {
      const f = getWordFrequency(w) ?? 0;
      if (f > maxFreq) {
        maxFreq = f;
      }
    }
    newCollisions.push({ score: maxFreq, spelling, words: expWords });
  }
  newCollisions.sort((a, b) => b.score - a.score);

  // Sort changes by frequency and take top 20
  changes.sort((a, b) => b.freq - a.freq);

  return {
    stats: {
      collisionMap: spellingToWords,
      naturalness: totalFreqSum > 0 ? naturalnessWeightedSum / totalFreqSum : -Infinity,
      textPreservedPct: totalFreqSum > 0 ? (identicalFreqSum / totalFreqSum) * 100 : 0,
      totalWords,
      uniquePct: totalFreqSum > 0 ? ((totalFreqSum - collidingFreqSum) / totalFreqSum) * 100 : 100,
    },
    topChanges: changes.slice(0, 20).map(({ experiment, standard, word }) => ({
      experiment,
      standard,
      word,
    })),
    topCollisions: newCollisions.slice(0, 10).map(({ spelling, words }) => ({ spelling, words })),
  };
}

/** Format a delta between experiment and ingglish (positive = better) */
function DeltaBadge({
  decimals = 1,
  threshold = 0.05,
  value,
}: {
  decimals?: number;
  threshold?: number;
  value: number;
}) {
  if (Math.abs(value) < threshold) {
    return null;
  }
  const sign = value > 0 ? '+' : '';
  const className = value > 0 ? 'stat-delta stat-delta-better' : 'stat-delta stat-delta-worse';
  return (
    <span className={className}>
      {sign}
      {value.toFixed(decimals)}
    </span>
  );
}

function getIngglishCache() {
  if (cachedIngglish !== null) {
    return cachedIngglish;
  }

  const dict = getDictionary();
  const allWords = new Set<string>();
  const spellingToWords = new Map<string, string[]>();
  const spellings = new Map<string, string>();
  const wordFreqs = new Map<string, number>();
  let identicalFreqSum = 0;
  let totalFreqSum = 0;
  let naturalnessWeightedSum = 0;

  for (const [word, phonemes] of Object.entries(dict)) {
    if (NON_ALPHA.test(word)) {
      continue;
    }

    const wordLower = word.toLowerCase();
    allWords.add(wordLower);
    const spelling = arpabetToFormat(phonemes, 'ingglish');
    spellings.set(wordLower, spelling);

    const freq = getWordFrequency(wordLower) ?? 0;
    wordFreqs.set(wordLower, freq);
    totalFreqSum += freq;
    if (wordLower === spelling.toLowerCase()) {
      identicalFreqSum += freq;
    }

    // Orthotactic probability (naturalness)
    if (freq > 0) {
      const score = scoreWordOrthotactic(spelling);
      if (score !== -Infinity) {
        naturalnessWeightedSum += score * freq;
      }
    }

    const existing = spellingToWords.get(spelling);
    if (existing) {
      existing.push(word);
    } else {
      spellingToWords.set(spelling, [word]);
    }
  }

  const totalWords = allWords.size;

  let collidingFreqSum = 0;
  for (const words of spellingToWords.values()) {
    if (words.length > 1) {
      for (const w of words) {
        collidingFreqSum += wordFreqs.get(w.toLowerCase()) ?? 0;
      }
    }
  }

  // Build collision group lookup for new-collision detection
  const collisionGroupOf = new Map<string, Set<string>>();
  for (const words of spellingToWords.values()) {
    if (words.length > 1) {
      const lowerWords = new Set(words.map((w) => w.toLowerCase()));
      for (const w of lowerWords) {
        collisionGroupOf.set(w, lowerWords);
      }
    }
  }

  cachedIngglish = {
    collisionGroupOf,
    spellings,
    stats: {
      collisionMap: spellingToWords,
      naturalness: totalFreqSum > 0 ? naturalnessWeightedSum / totalFreqSum : -Infinity,
      textPreservedPct: totalFreqSum > 0 ? (identicalFreqSum / totalFreqSum) * 100 : 0,
      totalWords,
      uniquePct: totalFreqSum > 0 ? ((totalFreqSum - collidingFreqSum) / totalFreqSum) * 100 : 100,
    },
  };
  return cachedIngglish;
}

function MappingStats({ version }: MappingStatsProps) {
  const [stats, setStats] = useState<null | Stats>(null);
  const [computing, setComputing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Debounce stats computation
  useEffect(() => {
    clearTimeout(timerRef.current);
    setComputing(true);
    timerRef.current = setTimeout(() => {
      // Standard Ingglish is cached after first computation
      const ingglishCache = getIngglishCache();
      // Single pass for experiment stats + changes + new collisions
      const { stats: expStats, topChanges, topCollisions } = computeExperimentStats(ingglishCache);

      setStats({
        experiment: expStats,
        ingglish: ingglishCache.stats,
        topChanges,
        topCollisions,
      });
      setComputing(false);
    }, 500);

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [version]);

  if (stats === null) {
    return (
      <div className="mapping-stats">
        <h3>Statistics</h3>
        <div className="stats-loading">Computing...</div>
      </div>
    );
  }

  const { experiment, ingglish } = stats;

  return (
    <div className="mapping-stats">
      <h3>Statistics {computing && <span className="stats-updating">(updating...)</span>}</h3>

      <div className="stats-cards">
        <div
          className="stat-card"
          title="What percentage of real-world text (by word frequency) stays identical after translation — higher means more familiar to English readers"
        >
          <div className="stat-value">
            {experiment.textPreservedPct.toFixed(1)}%
            <DeltaBadge value={experiment.textPreservedPct - ingglish.textPreservedPct} />
          </div>
          <div className="stat-label">Text preserved</div>
        </div>
        <div
          className="stat-card"
          title="What percentage of real-world text (by word frequency) has an unambiguous spelling — higher means fewer confusing homophones"
        >
          <div className="stat-value">
            {experiment.uniquePct.toFixed(1)}%
            <DeltaBadge value={experiment.uniquePct - ingglish.uniquePct} />
          </div>
          <div className="stat-label">Unambiguous text</div>
        </div>
        <div
          className="stat-card"
          title="How English-looking the respelled words are, based on character bigram statistics — higher (less negative) means more natural-looking"
        >
          <div className="stat-value">
            {experiment.naturalness.toFixed(2)}
            <DeltaBadge
              decimals={2}
              threshold={0.005}
              value={experiment.naturalness - ingglish.naturalness}
            />
          </div>
          <div className="stat-label">Naturalness</div>
        </div>
      </div>

      {stats.topChanges.length > 0 && (
        <div className="top-changes">
          <h4>Most common words affected</h4>
          <table className="changes-table">
            <thead>
              <tr>
                <th>Word</th>
                <th>Ingglish</th>
                <th>Yours</th>
              </tr>
            </thead>
            <tbody>
              {stats.topChanges.map(({ experiment: exp, standard, word }) => (
                <tr key={word}>
                  <td>{word}</td>
                  <td>{standard}</td>
                  <td>{exp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {stats.topCollisions.length > 0 && (
        <div className="top-collisions">
          <h4>New collisions from your changes</h4>
          <table className="changes-table">
            <thead>
              <tr>
                <th>English words</th>
                <th>Now both spell</th>
              </tr>
            </thead>
            <tbody>
              {stats.topCollisions.map(({ spelling, words }) => (
                <tr key={spelling}>
                  <td>{words.join(', ')}</td>
                  <td>{spelling}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MappingStats;
