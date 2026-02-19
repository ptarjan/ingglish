#!/usr/bin/env npx vite-node
/**
 * Collision analysis: Find words where Ingglish translation matches another English word.
 * Usage: npm run analyze-collisions
 */
import {
  loadDictionary,
  getDictionary,
  loadFrequencies,
  getWordFrequency,
} from '@ingglish/dictionary';
import { translateWord } from '../src/translate/forward.js';

interface Collision {
  ingglish: string;
  sources: string[];
  collidesWithEnglish: boolean;
}

interface AnalysisResult {
  totalWords: number;
  englishCollisions: Collision[];
  homophones: Collision[];
  commonWordCollisions: Collision[];
}

/**
 * Analyze all word collisions in the Ingglish translation.
 */
async function analyzeCollisions(): Promise<AnalysisResult> {
  await Promise.all([loadDictionary(), loadFrequencies()]);
  const dict = getDictionary();

  const words = Object.keys(dict).filter(
    (w) => !w.includes('(') && !w.includes("'") && /^[a-z]+$/.test(w)
  );

  const englishWords = new Set(words);
  const ingglishToEnglish = new Map<string, string[]>();

  for (const word of words) {
    try {
      const ingglish = translateWord(word, 'ingglish').toLowerCase();
      const existing = ingglishToEnglish.get(ingglish);
      if (existing !== undefined) {
        existing.push(word);
      } else {
        ingglishToEnglish.set(ingglish, [word]);
      }
    } catch {
      // Skip errors
    }
  }

  const collisions: Collision[] = [];

  for (const [ingglish, sources] of ingglishToEnglish) {
    const isEnglishWord = englishWords.has(ingglish);
    const collidesWithDifferentEnglish = isEnglishWord && !sources.includes(ingglish);

    if (sources.length > 1 || collidesWithDifferentEnglish) {
      collisions.push({ ingglish, sources, collidesWithEnglish: collidesWithDifferentEnglish });
    }
  }

  const englishCollisions = collisions.filter((c) => c.collidesWithEnglish);
  const homophones = collisions.filter((c) => !c.collidesWithEnglish && c.sources.length > 1);

  // Find collisions involving common words (frequency >= 1000 in SUBTLEX corpus)
  const COMMON_THRESHOLD = 1000;
  const commonWordCollisions = englishCollisions.filter((c) => {
    // Check if any source word or the collision target is common
    const hasCommonSource = c.sources.some((w) => {
      const freq = getWordFrequency(w);
      return freq !== undefined && freq >= COMMON_THRESHOLD;
    });
    const targetFreq = getWordFrequency(c.ingglish);
    const hasCommonTarget = targetFreq !== undefined && targetFreq >= COMMON_THRESHOLD;
    return hasCommonSource || hasCommonTarget;
  });

  // Sort by frequency (most common first - higher frequency = more common)
  commonWordCollisions.sort((a, b) => {
    const freqA = Math.max(
      ...a.sources.map((w) => getWordFrequency(w) ?? 0),
      getWordFrequency(a.ingglish) ?? 0
    );
    const freqB = Math.max(
      ...b.sources.map((w) => getWordFrequency(w) ?? 0),
      getWordFrequency(b.ingglish) ?? 0
    );
    return freqB - freqA; // Higher frequency first
  });

  return {
    totalWords: words.length,
    englishCollisions,
    homophones,
    commonWordCollisions,
  };
}

async function main() {
  const result = await analyzeCollisions();

  // Compute corpus total for per-million rates
  const freqData = await loadFrequencies();
  const corpusTotal = Object.values(freqData).reduce((sum, v) => sum + v, 0);
  const fmtPM = (raw: number): string => {
    const pm = (raw / corpusTotal) * 1_000_000;
    if (pm >= 1000) return `${(pm / 1000).toFixed(1)}K`;
    if (pm >= 1) return pm.toFixed(0);
    if (pm >= 0.1) return pm.toFixed(1);
    if (raw > 0) return '<1';
    return '0';
  };

  console.log('\n# Ingglish Collision Analysis\n');
  console.log('## Summary\n');
  console.log('- Total words analyzed: %d', result.totalWords);
  console.log(
    '- Ingglish spellings that match different English words: %d',
    result.englishCollisions.length
  );
  console.log('- Homophones (same Ingglish, different English): %d', result.homophones.length);
  console.log(
    '- Collisions involving common words (freq >= 20 /M): %d',
    result.commonWordCollisions.length
  );
  console.log('\n---\n');

  console.log('## Most Problematic Collisions (Common Words)\n');
  console.log('These involve frequently-used words:\n');

  for (const c of result.commonWordCollisions.slice(0, 50)) {
    const freqs = c.sources.map((w) => {
      const f = getWordFrequency(w);
      return f !== undefined ? `${w}(${fmtPM(f)} /M)` : w;
    });
    const targetFreq = getWordFrequency(c.ingglish);
    const targetInfo =
      targetFreq !== undefined ? `${c.ingglish}(${fmtPM(targetFreq)} /M)` : c.ingglish;
    console.log('- **%s** <- %s', targetInfo, freqs.join(', '));
  }

  console.log('\n## All Collisions with English Words\n');

  for (const c of result.englishCollisions) {
    console.log('- **%s** <- %s', c.ingglish, c.sources.join(', '));
  }

  console.log('\n## Homophones (2+ words -> same Ingglish)\n');

  // Sort homophones by size (most sources first)
  const sortedHomophones = [...result.homophones].sort(
    (a, b) => b.sources.length - a.sources.length
  );

  for (const c of sortedHomophones.slice(0, 100)) {
    console.log('- **%s** <- %s', c.ingglish, c.sources.join(', '));
  }
  if (result.homophones.length > 100) {
    console.log('\n... and %d more', result.homophones.length - 100);
  }
}

main().catch(console.error);
