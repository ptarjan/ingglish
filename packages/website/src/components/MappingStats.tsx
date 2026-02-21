import { useState, useEffect, useRef } from 'react';
import { getDictionary, getWordFrequency } from '@ingglish/dictionary';
import { arpabetToFormat } from '@ingglish/phonemes';

/** Character-level Levenshtein distance */
function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) {
    prev[j] = j;
  }
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      curr[j] =
        a[i - 1] === b[j - 1] ? prev[j - 1]! : 1 + Math.min(prev[j - 1]!, prev[j]!, curr[j - 1]!);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n]!;
}

interface MappingStatsProps {
  version: number;
}

interface FormatStats {
  totalWords: number;
  /** % of real-world text (by frequency) with unambiguous spellings */
  uniquePct: number;
  /** % of real-world text (by frequency) that stays identical */
  textPreservedPct: number;
  /** Frequency-weighted average similarity to English spelling */
  readabilityPct: number;
  /** Collision map for collision analysis */
  collisionMap: Map<string, string[]>;
}

interface WordChange {
  word: string;
  standard: string;
  experiment: string;
}

/** Pre-compiled regex for filtering dictionary entries with punctuation */
const NON_ALPHA = /[^a-z]/i;

/**
 * Pre-computed standard Ingglish data. Computed once on first use since the
 * standard mapping never changes during a session.
 */
let cachedIngglish: {
  stats: FormatStats;
  /** word → standard spelling, for diff detection */
  spellings: Map<string, string>;
  /** For each word, the set of words it collides with */
  collisionGroupOf: Map<string, Set<string>>;
} | null = null;

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
  let readabilityFreqSum = 0;

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

    const maxLen = Math.max(wordLower.length, spelling.length);
    const similarity =
      maxLen > 0 ? 1 - editDistance(wordLower, spelling.toLowerCase()) / maxLen : 1;
    readabilityFreqSum += freq * similarity;

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
    stats: {
      totalWords,
      uniquePct: totalFreqSum > 0 ? ((totalFreqSum - collidingFreqSum) / totalFreqSum) * 100 : 100,
      textPreservedPct: totalFreqSum > 0 ? (identicalFreqSum / totalFreqSum) * 100 : 0,
      readabilityPct: totalFreqSum > 0 ? (readabilityFreqSum / totalFreqSum) * 100 : 100,
      collisionMap: spellingToWords,
    },
    spellings,
    collisionGroupOf,
  };
  return cachedIngglish;
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
  const changes: { word: string; standard: string; experiment: string; freq: number }[] = [];
  let identicalFreqSum = 0;
  let totalFreqSum = 0;
  let readabilityFreqSum = 0;

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

    const maxLen = Math.max(wordLower.length, expSpelling.length);
    const similarity =
      maxLen > 0 ? 1 - editDistance(wordLower, expSpelling.toLowerCase()) / maxLen : 1;
    readabilityFreqSum += freq * similarity;

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
      changes.push({ word, standard: stdSpelling, experiment: expSpelling, freq });
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
  const newCollisions: { spelling: string; words: string[]; score: number }[] = [];
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
    newCollisions.push({ spelling, words: expWords, score: maxFreq });
  }
  newCollisions.sort((a, b) => b.score - a.score);

  // Sort changes by frequency and take top 20
  changes.sort((a, b) => b.freq - a.freq);

  return {
    stats: {
      totalWords,
      uniquePct: totalFreqSum > 0 ? ((totalFreqSum - collidingFreqSum) / totalFreqSum) * 100 : 100,
      textPreservedPct: totalFreqSum > 0 ? (identicalFreqSum / totalFreqSum) * 100 : 0,
      readabilityPct: totalFreqSum > 0 ? (readabilityFreqSum / totalFreqSum) * 100 : 100,
      collisionMap: spellingToWords,
    },
    topChanges: changes.slice(0, 20).map(({ word, standard, experiment }) => ({
      word,
      standard,
      experiment,
    })),
    topCollisions: newCollisions.slice(0, 10).map(({ spelling, words }) => ({ spelling, words })),
  };
}

interface Stats {
  experiment: FormatStats;
  ingglish: FormatStats;
  topCollisions: { spelling: string; words: string[] }[];
  topChanges: WordChange[];
}

/** Format a delta between experiment and ingglish (positive = better) */
function DeltaBadge({ value }: { value: number }) {
  if (Math.abs(value) < 0.05) {
    return null;
  }
  const sign = value > 0 ? '+' : '';
  const className = value > 0 ? 'stat-delta stat-delta-better' : 'stat-delta stat-delta-worse';
  return (
    <span className={className}>
      {sign}
      {value.toFixed(1)}
    </span>
  );
}

function MappingStats({ version }: MappingStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null);
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
        topCollisions,
        topChanges,
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
          title="How similar translated text looks to standard English spelling — higher means easier for English readers to parse"
        >
          <div className="stat-value">
            {experiment.readabilityPct.toFixed(1)}%
            <DeltaBadge value={experiment.readabilityPct - ingglish.readabilityPct} />
          </div>
          <div className="stat-label">Readability</div>
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
              {stats.topChanges.map(({ word, standard, experiment: exp }) => (
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
