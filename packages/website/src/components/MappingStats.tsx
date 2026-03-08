import { useState, useEffect, useRef } from 'react';
import { getDictionary, getWordFrequency } from '@ingglish/dictionary';
import { arpabetToFormat } from '@ingglish/phonemes';
import { computeWeightedMetrics, type MetricInput } from '../lib/mapping-metrics';

interface FormatStats {
  /** Collision map for collision analysis */
  collisionMap: Map<string, string[]>;
  /** Frequency-weighted character-level Levenshtein similarity (0.0–1.0) */
  editSimilarity: number;
  /** Frequency-weighted orthotactic probability (avg log bigram probability) */
  naturalness: number;
  /** Frequency-weighted G2P round-trip phoneme recovery rate (0.0–1.0) */
  pronounceability: number;
  /** Frequency-weighted grapheme-in-word substring match rate (0.0–1.0) */
  spellingFamiliarity: number;
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
  const metricEntries: MetricInput[] = [];

  for (const [word, phonemes] of Object.entries(dict)) {
    if (NON_ALPHA.test(word)) {
      continue;
    }

    const wordLower = word.toLowerCase();
    allWords.add(wordLower);
    const expSpelling = arpabetToFormat(phonemes, 'experiment');

    const freq = getWordFrequency(wordLower) ?? 0;
    wordFreqs.set(wordLower, freq);
    metricEntries.push({ english: wordLower, frequency: freq, phonemes, spelling: expSpelling });

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
  const metrics = computeWeightedMetrics(metricEntries, (p) => arpabetToFormat([p], 'experiment'));

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

  const totalFreqSum = metricEntries.reduce((sum, e) => sum + e.frequency, 0);

  return {
    stats: {
      ...metrics,
      collisionMap: spellingToWords,
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
  const metricEntries: MetricInput[] = [];

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
    metricEntries.push({ english: wordLower, frequency: freq, phonemes, spelling });

    const existing = spellingToWords.get(spelling);
    if (existing) {
      existing.push(word);
    } else {
      spellingToWords.set(spelling, [word]);
    }
  }

  const totalWords = allWords.size;
  const metrics = computeWeightedMetrics(metricEntries, (p) => arpabetToFormat([p], 'ingglish'));
  const totalFreqSum = metricEntries.reduce((sum, e) => sum + e.frequency, 0);

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
      ...metrics,
      collisionMap: spellingToWords,
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
      <div className="card mapping-stats">
        <h3>Statistics</h3>
        <div className="stats-loading">Computing...</div>
      </div>
    );
  }

  const { experiment, ingglish } = stats;

  return (
    <div className="card mapping-stats">
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
          <div className="stat-label">
            <a href="https://ingglish.com/docs/metrics#text-preserved">Text preserved</a>
          </div>
        </div>
        <div
          className="stat-card"
          title="What percentage of real-world text (by word frequency) has an unambiguous spelling — higher means fewer confusing homophones"
        >
          <div className="stat-value">
            {experiment.uniquePct.toFixed(1)}%
            <DeltaBadge value={experiment.uniquePct - ingglish.uniquePct} />
          </div>
          <div className="stat-label">
            <a href="https://ingglish.com/docs/metrics#unambiguous-text">Unambiguous text</a>
          </div>
        </div>
        <div
          className="stat-card"
          title="Would an English reader pronounce this correctly? G2P round-trip phoneme recovery rate — higher means more pronounceable"
        >
          <div className="stat-value">
            {(experiment.pronounceability * 100).toFixed(1)}%
            <DeltaBadge value={(experiment.pronounceability - ingglish.pronounceability) * 100} />
          </div>
          <div className="stat-label">
            <a href="https://ingglish.com/docs/metrics#pronounceability">Pronounceability</a>
          </div>
        </div>
      </div>

      <details className="stats-details">
        <summary>More metrics</summary>
        <div className="stats-extra">
          <div className="stats-extra-row">
            <div className="stats-extra-header">
              <span className="stats-extra-name">
                <a href="https://ingglish.com/docs/metrics#edit-similarity">Edit similarity</a>
              </span>
              <span className="stats-extra-value">
                {(experiment.editSimilarity * 100).toFixed(1)}%
                <DeltaBadge value={(experiment.editSimilarity - ingglish.editSimilarity) * 100} />
              </span>
            </div>
            <div className="stats-extra-desc">
              Character-level Levenshtein similarity to English spelling. Flaw: optimizes for
              character overlap, not readability.
            </div>
          </div>
          <div className="stats-extra-row">
            <div className="stats-extra-header">
              <span className="stats-extra-name">
                <a href="https://ingglish.com/docs/metrics#spelling-familiarity">
                  Spelling familiarity
                </a>
              </span>
              <span className="stats-extra-value">
                {(experiment.spellingFamiliarity * 100).toFixed(1)}%
                <DeltaBadge
                  value={(experiment.spellingFamiliarity - ingglish.spellingFamiliarity) * 100}
                />
              </span>
            </div>
            <div className="stats-extra-desc">
              How often each grapheme appears in the English word. Flaw: can&apos;t tell{' '}
              <em>why</em> a grapheme appears.
            </div>
          </div>
          <div className="stats-extra-row">
            <div className="stats-extra-header">
              <span className="stats-extra-name">
                <a href="https://ingglish.com/docs/metrics#naturalness">Naturalness</a>
              </span>
              <span className="stats-extra-value">
                {experiment.naturalness.toFixed(2)}
                <DeltaBadge
                  decimals={2}
                  threshold={0.005}
                  value={experiment.naturalness - ingglish.naturalness}
                />
              </span>
            </div>
            <div className="stats-extra-desc">
              Orthotactic probability (avg log bigram probability). Flaw: rewards common letter
              sequences regardless of pronunciation.
            </div>
          </div>
          <div className="stats-extra-link">
            <a
              href="https://ingglish.com/docs/metrics#why-surface-level-metrics-cant-optimize-mappings"
              rel="noopener noreferrer"
              target="_blank"
            >
              Why surface-level metrics can&apos;t optimize mappings
            </a>
          </div>
        </div>
      </details>

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
