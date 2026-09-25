#!/usr/bin/env -S npx vite-node --script
/**
 * Collision analysis: Find words where Ingglish translation matches another English word.
 * Usage: npm run analyze-collisions
 */
import {
  loadDictionary,
  getDictionary,
  loadFrequencies,
  getWordFrequency,
  getCorpusTotal,
} from '@ingglish/dictionary';
import { loadLangDict } from '../../src/index.js';
import { translateWord } from '../../src/translate/forward.js';

/** A word counts as common at or above this many occurrences per million words. */
const COMMON_PER_MILLION = 20;

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
  bothCommonCollisions: Collision[];
}

/**
 * Analyze all word collisions in the Ingglish translation.
 */
async function analyzeCollisions(): Promise<AnalysisResult> {
  await Promise.all([loadDictionary(), loadFrequencies(), loadLangDict('en')]);
  const dict = getDictionary();

  const words = Object.keys(dict).filter(
    (w) => !w.includes('(') && !w.includes("'") && /^[a-z]+$/.test(w)
  );

  const englishWords = new Set(words);
  const ingglishToEnglish = new Map<string, string[]>();

  for (const word of words) {
    const ingglish = translateWord(word).toLowerCase();
    const existing = ingglishToEnglish.get(ingglish);
    if (existing !== undefined) {
      existing.push(word);
    } else {
      ingglishToEnglish.set(ingglish, [word]);
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
  const homophones = collisions.filter((c) => c.sources.length > 1);

  const freqOf = (w: string): number => getWordFrequency(w) ?? 0;
  const commonThreshold = (COMMON_PER_MILLION * getCorpusTotal()) / 1_000_000;
  const commonWordCollisions = englishCollisions.filter((c) =>
    [...c.sources, c.ingglish].some((w) => freqOf(w) >= commonThreshold)
  );
  const bothCommonCollisions = commonWordCollisions.filter(
    (c) =>
      freqOf(c.ingglish) >= commonThreshold && c.sources.some((w) => freqOf(w) >= commonThreshold)
  );
  commonWordCollisions.sort(
    (a, b) =>
      Math.max(...b.sources.map(freqOf), freqOf(b.ingglish)) -
      Math.max(...a.sources.map(freqOf), freqOf(a.ingglish))
  );

  // Rank homophone groups by their second most frequent member, so the top of
  // the list is groups of two or more everyday words, not clusters of rare names.
  const secondFreq = (c: Collision): number => c.sources.map(freqOf).sort((x, y) => y - x)[1] ?? 0;
  homophones.sort((a, b) => secondFreq(b) - secondFreq(a));

  return {
    totalWords: words.length,
    englishCollisions,
    homophones,
    commonWordCollisions,
    bothCommonCollisions,
  };
}

export async function main() {
  const result = await analyzeCollisions();

  // Compute corpus total for per-million rates
  const corpusTotal = getCorpusTotal();
  const fmtPM = (raw: number): string => {
    const pm = (raw / corpusTotal) * 1_000_000;
    if (pm >= 1000) return `${(pm / 1000).toFixed(1)}K`;
    if (pm >= 1) return pm.toFixed(0);
    if (pm >= 0.1) return pm.toFixed(1);
    if (raw > 0) return '<1';
    return '0';
  };

  const withFreq = (w: string): string => {
    const f = getWordFrequency(w);
    return f !== undefined ? `${w}(${fmtPM(f)} /M)` : w;
  };
  const wordsInHomophoneGroups = result.homophones.reduce((n, c) => n + c.sources.length, 0);

  console.log('\n# Ingglish Collision Analysis\n');
  console.log('## Summary\n');
  console.log(`- Total words analyzed: ${result.totalWords}`);
  console.log(
    `- Ingglish spellings that match different English words: ${result.englishCollisions.length}`
  );
  console.log(
    `- Homophone groups (2+ English words -> same Ingglish): ${result.homophones.length}`
  );
  console.log(`- Words in homophone groups: ${wordsInHomophoneGroups}`);
  console.log(
    `- False friends involving a common word (freq >= ${COMMON_PER_MILLION} /M): ${result.commonWordCollisions.length}`
  );
  console.log(
    `- False friends where both words are common: ${result.bothCommonCollisions.length} (${result.bothCommonCollisions.map((c) => `${c.sources.join('/')}->${c.ingglish}`).join(', ')})`
  );
  console.log('\n---\n');

  console.log('## False Friends Involving Common Words\n');
  console.log('Ingglish spelling (its own English frequency) <- English source words:\n');
  for (const c of result.commonWordCollisions) {
    console.log(`- **${withFreq(c.ingglish)}** <- ${c.sources.map(withFreq).join(', ')}`);
  }

  console.log('\n## All False Friends\n');
  for (const c of result.englishCollisions) {
    console.log(`- **${c.ingglish}** <- ${c.sources.join(', ')}`);
  }

  console.log('\n## Homophones (2+ words -> same Ingglish), most common first\n');
  for (const c of result.homophones.slice(0, 100)) {
    console.log(`- **${c.ingglish}** <- ${c.sources.map(withFreq).join(', ')}`);
  }
  if (result.homophones.length > 100) {
    console.log(`\n... and ${result.homophones.length - 100} more`);
  }
}

if (process.argv[1]?.includes('collision-analysis'))
  main().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
