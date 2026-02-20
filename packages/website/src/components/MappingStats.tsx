import { useState, useEffect, useRef } from 'react';
import { getDictionary, getWordFrequency } from '@ingglish/dictionary';
import { arpabetToFormat } from '@ingglish/phonemes';

interface MappingStatsProps {
  version: number;
}

interface FormatStats {
  totalWords: number;
  /** % of words with unique (non-colliding) spellings */
  uniquePct: number;
  /** % of real-world text (by frequency) that stays identical */
  textPreservedPct: number;
  /** % of unique spellings that don't match a different English word */
  clarityPct: number;
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
  let identicalFreqSum = 0;
  let totalFreqSum = 0;

  for (const [word, phonemes] of Object.entries(dict)) {
    if (NON_ALPHA.test(word)) {
      continue;
    }

    const wordLower = word.toLowerCase();
    allWords.add(wordLower);
    const spelling = arpabetToFormat(phonemes, 'ingglish');
    spellings.set(wordLower, spelling);

    const freq = getWordFrequency(wordLower) ?? 0;
    totalFreqSum += freq;
    if (wordLower === spelling.toLowerCase()) {
      identicalFreqSum += freq;
    }

    const existing = spellingToWords.get(spelling);
    if (existing) {
      existing.push(word);
    } else {
      spellingToWords.set(spelling, [word]);
    }
  }

  const totalWords = allWords.size;

  let collidingWords = 0;
  let falseFriends = 0;
  let totalUniqueSpellings = 0;
  for (const [spelling, words] of spellingToWords) {
    totalUniqueSpellings++;
    if (words.length > 1) {
      collidingWords += words.length;
    }
    const spellingLower = spelling.toLowerCase();
    if (allWords.has(spellingLower)) {
      const isOwnWord = words.some((w) => w.toLowerCase() === spellingLower);
      if (!isOwnWord) {
        falseFriends++;
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
      uniquePct: totalWords > 0 ? ((totalWords - collidingWords) / totalWords) * 100 : 100,
      textPreservedPct: totalFreqSum > 0 ? (identicalFreqSum / totalFreqSum) * 100 : 0,
      clarityPct:
        totalUniqueSpellings > 0
          ? ((totalUniqueSpellings - falseFriends) / totalUniqueSpellings) * 100
          : 100,
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
  const changes: { word: string; standard: string; experiment: string; freq: number }[] = [];
  let identicalFreqSum = 0;
  let totalFreqSum = 0;

  for (const [word, phonemes] of Object.entries(dict)) {
    if (NON_ALPHA.test(word)) {
      continue;
    }

    const wordLower = word.toLowerCase();
    allWords.add(wordLower);
    const expSpelling = arpabetToFormat(phonemes, 'experiment');

    const freq = getWordFrequency(wordLower) ?? 0;
    totalFreqSum += freq;
    if (wordLower === expSpelling.toLowerCase()) {
      identicalFreqSum += freq;
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
      changes.push({ word, standard: stdSpelling, experiment: expSpelling, freq });
    }
  }

  const totalWords = allWords.size;

  // Count collisions and false friends
  let collidingWords = 0;
  let falseFriends = 0;
  let totalUniqueSpellings = 0;
  for (const [spelling, words] of spellingToWords) {
    totalUniqueSpellings++;
    if (words.length > 1) {
      collidingWords += words.length;
    }
    const spellingLower = spelling.toLowerCase();
    if (allWords.has(spellingLower)) {
      const isOwnWord = words.some((w) => w.toLowerCase() === spellingLower);
      if (!isOwnWord) {
        falseFriends++;
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
      uniquePct: totalWords > 0 ? ((totalWords - collidingWords) / totalWords) * 100 : 100,
      textPreservedPct: totalFreqSum > 0 ? (identicalFreqSum / totalFreqSum) * 100 : 0,
      clarityPct:
        totalUniqueSpellings > 0
          ? ((totalUniqueSpellings - falseFriends) / totalUniqueSpellings) * 100
          : 100,
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
          title="What percentage of dictionary words have a unique (non-colliding) spelling — higher means fewer ambiguous words"
        >
          <div className="stat-value">
            {experiment.uniquePct.toFixed(1)}%
            <DeltaBadge value={experiment.uniquePct - ingglish.uniquePct} />
          </div>
          <div className="stat-label">Unique spellings</div>
        </div>
        <div
          className="stat-card"
          title="What percentage of translated spellings don't accidentally look like a different English word — higher means less confusion"
        >
          <div className="stat-value">
            {experiment.clarityPct.toFixed(1)}%
            <DeltaBadge value={experiment.clarityPct - ingglish.clarityPct} />
          </div>
          <div className="stat-label">Clarity</div>
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
