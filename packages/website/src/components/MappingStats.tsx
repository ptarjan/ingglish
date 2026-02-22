import { useState, useEffect, useRef } from 'react';
import { getDictionary, getWordFrequency } from '@ingglish/dictionary';
import {
  arpabetToFormat,
  ARPABET_TO_INGGLISH_MAP,
  R_COLORED_FORWARD,
  stripStress,
} from '@ingglish/phonemes';

interface FormatStats {
  /** Collision map for collision analysis */
  collisionMap: Map<string, string[]>;
  /** Frequency-weighted spelling familiarity (how often each grapheme appears in English words with that phoneme) */
  familiarityPct: number;
  /** % of real-world text (by frequency) that stays identical */
  textPreservedPct: number;
  totalWords: number;
  /** % of real-world text (by frequency) with unambiguous spellings */
  uniquePct: number;
}

interface MappingStatsProps {
  experimentPhonemeMap: Record<string, string>;
  experimentRColoredPrefixes: Record<string, string>;
  version: number;
}

interface WordChange {
  experiment: string;
  standard: string;
  word: string;
}

/** Pre-compiled regex for filtering dictionary entries with punctuation */
const NON_ALPHA = /[^a-z]/i;

/** Standard Ingglish phoneme maps (separated into base + stress) */
const STD_MAPS = splitPhonemeMap({ ...ARPABET_TO_INGGLISH_MAP, AH0: 'a' });
const STD_R_COLORED = new Map(R_COLORED_FORWARD);

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
function computeExperimentStats(
  ingglishCache: ReturnType<typeof getIngglishCache>,
  expPhonemeMap: Record<string, string>,
  expRColoredPrefixes: Record<string, string>
): {
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
  let familiarityFreqSum = 0;

  // Build experiment maps
  const expMaps = splitPhonemeMap(expPhonemeMap);
  const expRColored = new Map(Object.entries(expRColoredPrefixes));

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

    // Spelling familiarity
    const units = getGraphemeUnits(phonemes, expMaps.base, expRColored, expMaps.stress);
    if (units.length > 0) {
      let hits = 0;
      for (const g of units) {
        if (wordLower.includes(g)) {
          hits++;
        }
      }
      familiarityFreqSum += freq * (hits / units.length);
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
      familiarityPct: totalFreqSum > 0 ? (familiarityFreqSum / totalFreqSum) * 100 : 100,
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

/**
 * Get grapheme units for a phoneme sequence under given mappings.
 * R-colored vowels merge vowel+R into a single unit (e.g., "ar").
 * Used for computing spelling familiarity per word.
 */
function getGraphemeUnits(
  rawPhonemes: string[],
  phonemeMap: Record<string, string>,
  rColoredMap: Map<string, string>,
  stressOverrides: Map<string, string>
): string[] {
  const units: string[] = [];
  const len = rawPhonemes.length;
  let skipNext = false;

  for (let i = 0; i < len; i++) {
    if (skipNext) {
      skipNext = false;
      continue;
    }
    const p = rawPhonemes[i]!;
    const base = stripStress(p);

    // R-colored vowel: combine vowel+R into single grapheme unit
    if (i + 1 < len && rawPhonemes[i + 1] === 'R') {
      const rPrefix = rColoredMap.get(base);
      if (rPrefix !== undefined) {
        units.push(rPrefix + (phonemeMap.R ?? 'r'));
        skipNext = true;
        continue;
      }
    }

    // Stress override (e.g., AH0 → 'a')
    const so = stressOverrides.get(p);
    if (so !== undefined) {
      units.push(so);
      continue;
    }

    // Base mapping
    units.push(phonemeMap[base] ?? base.toLowerCase());
  }

  return units;
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
  let familiarityFreqSum = 0;

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

    // Spelling familiarity: for each grapheme unit, check if it appears in the English word
    const units = getGraphemeUnits(phonemes, STD_MAPS.base, STD_R_COLORED, STD_MAPS.stress);
    if (units.length > 0) {
      let hits = 0;
      for (const g of units) {
        if (wordLower.includes(g)) {
          hits++;
        }
      }
      familiarityFreqSum += freq * (hits / units.length);
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
      familiarityPct: totalFreqSum > 0 ? (familiarityFreqSum / totalFreqSum) * 100 : 100,
      textPreservedPct: totalFreqSum > 0 ? (identicalFreqSum / totalFreqSum) * 100 : 0,
      totalWords,
      uniquePct: totalFreqSum > 0 ? ((totalFreqSum - collidingFreqSum) / totalFreqSum) * 100 : 100,
    },
  };
  return cachedIngglish;
}

function MappingStats({
  experimentPhonemeMap,
  experimentRColoredPrefixes,
  version,
}: MappingStatsProps) {
  const [stats, setStats] = useState<null | Stats>(null);
  const [computing, setComputing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Refs to avoid stale closures in the debounced timeout
  const expMapRef = useRef(experimentPhonemeMap);
  const expRColoredRef = useRef(experimentRColoredPrefixes);
  expMapRef.current = experimentPhonemeMap;
  expRColoredRef.current = experimentRColoredPrefixes;

  // Debounce stats computation
  useEffect(() => {
    clearTimeout(timerRef.current);
    setComputing(true);
    timerRef.current = setTimeout(() => {
      // Standard Ingglish is cached after first computation
      const ingglishCache = getIngglishCache();
      // Single pass for experiment stats + changes + new collisions
      const {
        stats: expStats,
        topChanges,
        topCollisions,
      } = computeExperimentStats(ingglishCache, expMapRef.current, expRColoredRef.current);

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
          title="How often each spelling choice already appears in English words with that sound — higher means English readers will find the spellings more intuitive"
        >
          <div className="stat-value">
            {experiment.familiarityPct.toFixed(1)}%
            <DeltaBadge value={experiment.familiarityPct - ingglish.familiarityPct} />
          </div>
          <div className="stat-label">Spelling familiarity</div>
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

/**
 * Split a full phoneme map (which may include stress keys like AH0)
 * into base phoneme map and stress overrides.
 */
function splitPhonemeMap(fullMap: Record<string, string>): {
  base: Record<string, string>;
  stress: Map<string, string>;
} {
  const base: Record<string, string> = {};
  const stress = new Map<string, string>();
  for (const [key, value] of Object.entries(fullMap)) {
    const lastChar = key.codePointAt(key.length - 1)!;
    if (lastChar >= 48 && lastChar <= 50) {
      stress.set(key, value);
    } else {
      base[key] = value;
    }
  }
  return { base, stress };
}

export default MappingStats;
