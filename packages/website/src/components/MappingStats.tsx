import { useState, useEffect, useRef, useMemo } from 'react';
import { getDictionary, getWordFrequency } from '@ingglish/dictionary';
import { arpabetToFormat } from '@ingglish/phonemes';

interface MappingStatsProps {
  version: number;
}

interface Stats {
  collisionCount: number;
  identicalCount: number;
  homophoneGroups: number;
  lettersUsed: number;
  ingglishCollisionCount: number;
  topCollisions: { spelling: string; words: string[] }[];
}

function computeStats(format: 'experiment' | 'ingglish'): {
  collisionCount: number;
  identicalCount: number;
  homophoneGroups: number;
  lettersUsed: number;
  collisionMap: Map<string, string[]>;
} {
  const dict = getDictionary();
  const spellingToWords = new Map<string, string[]>();
  const lettersSet = new Set<string>();
  let identicalCount = 0;

  for (const [word, phonemes] of Object.entries(dict)) {
    // Skip entries with punctuation (contractions, abbreviations)
    if (/[^a-z]/i.test(word)) {
      continue;
    }

    const spelling = arpabetToFormat(phonemes, format);

    // Track letters used
    for (const ch of spelling.toLowerCase()) {
      if (ch >= 'a' && ch <= 'z') {
        lettersSet.add(ch);
      }
    }

    // Check if word is identical to its translation
    if (word.toLowerCase() === spelling.toLowerCase()) {
      identicalCount++;
    }

    // Group words by spelling
    const existing = spellingToWords.get(spelling);
    if (existing) {
      existing.push(word);
    } else {
      spellingToWords.set(spelling, [word]);
    }
  }

  // Count collisions (groups with >1 word)
  let collisionCount = 0;
  let homophoneGroups = 0;
  for (const words of spellingToWords.values()) {
    if (words.length > 1) {
      collisionCount += words.length;
      homophoneGroups++;
    }
  }

  return {
    collisionCount,
    identicalCount,
    homophoneGroups,
    lettersUsed: lettersSet.size,
    collisionMap: spellingToWords,
  };
}

function getTopCollisions(
  collisionMap: Map<string, string[]>,
  count: number
): { spelling: string; words: string[] }[] {
  const collisions: { spelling: string; words: string[]; score: number }[] = [];

  for (const [spelling, words] of collisionMap) {
    if (words.length <= 1) {
      continue;
    }

    // Score by max word frequency in the group
    let maxFreq = 0;
    for (const word of words) {
      const freq = getWordFrequency(word) ?? 0;
      if (freq > maxFreq) {
        maxFreq = freq;
      }
    }

    collisions.push({ spelling, words, score: maxFreq });
  }

  // Sort by frequency score (most impactful collisions first)
  collisions.sort((a, b) => b.score - a.score);

  return collisions.slice(0, count).map(({ spelling, words }) => ({ spelling, words }));
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
        collisionCount: experiment.collisionCount,
        identicalCount: experiment.identicalCount,
        homophoneGroups: experiment.homophoneGroups,
        lettersUsed: experiment.lettersUsed,
        ingglishCollisionCount: ingglish.collisionCount,
        topCollisions: getTopCollisions(experiment.collisionMap, 10),
      });
      setComputing(false);
    }, 500);

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [version]);

  const collisionDiff = useMemo(() => {
    if (stats === null) {
      return null;
    }
    const diff = stats.collisionCount - stats.ingglishCollisionCount;
    if (diff > 0) {
      return `${diff} more collisions than standard Ingglish`;
    }
    if (diff < 0) {
      return `${Math.abs(diff)} fewer collisions than standard Ingglish`;
    }
    return 'Same collision count as standard Ingglish';
  }, [stats]);

  if (stats === null) {
    return (
      <div className="mapping-stats">
        <h3>Statistics</h3>
        <div className="stats-loading">Computing...</div>
      </div>
    );
  }

  return (
    <div className="mapping-stats">
      <h3>Statistics {computing && <span className="stats-updating">(updating...)</span>}</h3>

      <div className="stats-cards">
        <div
          className="stat-card"
          title="Words that map to the same spelling as another word (e.g. to/too/two all become 'tuu')"
        >
          <div className="stat-value">{stats.collisionCount.toLocaleString()}</div>
          <div className="stat-label">Collisions</div>
        </div>
        <div
          className="stat-card"
          title="Words whose spelling stays exactly the same after translation (e.g. 'bed' stays 'bed')"
        >
          <div className="stat-value">{stats.identicalCount.toLocaleString()}</div>
          <div className="stat-label">Identical words</div>
        </div>
        <div
          className="stat-card"
          title="Groups of 2+ words that share the same translated spelling"
        >
          <div className="stat-value">{stats.homophoneGroups.toLocaleString()}</div>
          <div className="stat-label">Homophone groups</div>
        </div>
        <div
          className="stat-card"
          title="How many of the 26 Latin letters appear in translated output"
        >
          <div className="stat-value">{stats.lettersUsed} / 26</div>
          <div className="stat-label">Letters used</div>
        </div>
      </div>

      {collisionDiff !== null && <p className="stats-comparison">{collisionDiff}</p>}

      {stats.topCollisions.length > 0 && (
        <div className="top-collisions">
          <h4>Top collisions (by word frequency)</h4>
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
