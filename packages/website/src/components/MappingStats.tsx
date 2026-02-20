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
  /** Collision map for top-collisions table */
  collisionMap: Map<string, string[]>;
}

function computeStats(format: 'experiment' | 'ingglish'): FormatStats {
  const dict = getDictionary();
  const allWords = new Set<string>();
  const spellingToWords = new Map<string, string[]>();
  let identicalFreqSum = 0;
  let totalFreqSum = 0;

  for (const [word, phonemes] of Object.entries(dict)) {
    // Skip entries with punctuation (contractions, abbreviations)
    if (/[^a-z]/i.test(word)) {
      continue;
    }

    const wordLower = word.toLowerCase();
    allWords.add(wordLower);
    const spelling = arpabetToFormat(phonemes, format);

    // Track frequency-weighted text preservation
    const freq = getWordFrequency(wordLower) ?? 0;
    totalFreqSum += freq;
    if (wordLower === spelling.toLowerCase()) {
      identicalFreqSum += freq;
    }

    // Group words by spelling
    const existing = spellingToWords.get(spelling);
    if (existing) {
      existing.push(word);
    } else {
      spellingToWords.set(spelling, [word]);
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
    // False friend: translated spelling matches a different English word
    const spellingLower = spelling.toLowerCase();
    if (allWords.has(spellingLower)) {
      const isOwnWord = words.some((w) => w.toLowerCase() === spellingLower);
      if (!isOwnWord) {
        falseFriends++;
      }
    }
  }

  return {
    totalWords,
    uniquePct: totalWords > 0 ? ((totalWords - collidingWords) / totalWords) * 100 : 100,
    textPreservedPct: totalFreqSum > 0 ? (identicalFreqSum / totalFreqSum) * 100 : 0,
    clarityPct:
      totalUniqueSpellings > 0
        ? ((totalUniqueSpellings - falseFriends) / totalUniqueSpellings) * 100
        : 100,
    collisionMap: spellingToWords,
  };
}

/** Find collisions in experiment that don't exist in standard Ingglish.
 *  Compares by word groups, not spelling — so a renamed collision (wood→wuhd)
 *  that contains the same words is still filtered out. */
function getNewCollisions(
  experimentMap: Map<string, string[]>,
  ingglishMap: Map<string, string[]>,
  count: number
): { spelling: string; words: string[] }[] {
  // Build a set of collision groups in standard Ingglish (by sorted word list)
  const ingglishGroups = new Set<string>();
  for (const words of ingglishMap.values()) {
    if (words.length > 1) {
      const key = words
        .map((w) => w.toLowerCase())
        .sort()
        .join('\0');
      ingglishGroups.add(key);
    }
  }

  const results: { spelling: string; words: string[]; score: number }[] = [];

  for (const [spelling, expWords] of experimentMap) {
    if (expWords.length <= 1) {
      continue;
    }

    // Check if this same group of words already collides in standard Ingglish
    const key = expWords
      .map((w) => w.toLowerCase())
      .sort()
      .join('\0');
    if (ingglishGroups.has(key)) {
      continue;
    }

    // Score by max word frequency in the group
    let maxFreq = 0;
    for (const word of expWords) {
      const freq = getWordFrequency(word) ?? 0;
      if (freq > maxFreq) {
        maxFreq = freq;
      }
    }

    results.push({ spelling, words: expWords, score: maxFreq });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, count).map(({ spelling, words }) => ({ spelling, words }));
}

interface WordChange {
  word: string;
  standard: string;
  experiment: string;
}

/** Find the most common words whose spelling changed between standard and experiment */
function getTopChanges(count: number): WordChange[] {
  const dict = getDictionary();
  const changes: { word: string; standard: string; experiment: string; freq: number }[] = [];

  for (const [word, phonemes] of Object.entries(dict)) {
    if (/[^a-z]/i.test(word)) {
      continue;
    }
    const standard = arpabetToFormat(phonemes, 'ingglish');
    const experiment = arpabetToFormat(phonemes, 'experiment');
    if (standard !== experiment) {
      const freq = getWordFrequency(word) ?? 0;
      changes.push({ word, standard, experiment, freq });
    }
  }

  changes.sort((a, b) => b.freq - a.freq);
  return changes.slice(0, count).map(({ word, standard, experiment }) => ({
    word,
    standard,
    experiment,
  }));
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
      const experiment = computeStats('experiment');
      const ingglish = computeStats('ingglish');

      setStats({
        experiment,
        ingglish,
        topCollisions: getNewCollisions(experiment.collisionMap, ingglish.collisionMap, 10),
        topChanges: getTopChanges(20),
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
                <th>Standard</th>
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
          <table className="mapping-table collision-table">
            <thead>
              <tr>
                <th>Spelling</th>
                <th>Words</th>
              </tr>
            </thead>
            <tbody>
              {stats.topCollisions.map(({ spelling, words }) => (
                <tr key={spelling}>
                  <td className="ingglish-cell">{spelling}</td>
                  <td className="examples-cell">{words.join(', ')}</td>
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
