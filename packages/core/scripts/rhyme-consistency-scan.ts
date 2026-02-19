/**
 * Find CMU dictionary errors by checking that words with identical spelling
 * endings are pronounced consistently.
 *
 * Approach:
 * 1. Group words by their final N characters (N=4, 5, 6)
 * 2. For each group, find the majority pronunciation of the shared ending
 * 3. Flag outliers that don't match the majority
 * 4. Sort by frequency to surface the most impactful errors
 *
 * This catches errors like:
 * - A word ending in "-tion" that uses T IH AH N instead of SH AH N
 * - A word ending in "-ight" that uses IH T instead of AY T
 * - A word ending in "-ence" with an unexpected vowel
 *
 * Usage: cd packages/core && npx vite-node scripts/rhyme-consistency-scan.ts
 */

import { loadDictionary, getDictionary } from '@ingglish/dictionary';
import { loadFrequencies, getWordFrequency } from '@ingglish/dictionary';
import { getCustomPronunciation } from '@ingglish/dictionary';

await loadDictionary();
await loadFrequencies();
const cmudict = getDictionary();

// All words without variant markers like "(2)", with frequency >= 5
const allWords = Object.keys(cmudict).filter((w) => {
  if (w.includes('(')) return false;
  const phonemes = cmudict[w];
  if (!Array.isArray(phonemes) || phonemes.length === 0) return false;
  const freq = getWordFrequency(w) ?? 0;
  if (freq < 5) return false;
  // Skip words already fixed in custom pronunciations
  if (getCustomPronunciation(w) !== undefined) return false;
  return true;
});

console.log(`Working with ${allWords.length} words (freq >= 5, not in custom pronunciations)\n`);

function stripStress(p: string): string {
  return p.replace(/[0-2]$/, '');
}

function getEndingPhonemes(phonemes: string[], numPhonemes: number): string {
  if (phonemes.length < numPhonemes) return '';
  return phonemes.slice(-numPhonemes).map(stripStress).join(' ');
}

interface Outlier {
  word: string;
  frequency: number;
  spelling_ending: string;
  ending_length: number;
  actual_ending_phonemes: string;
  expected_ending_phonemes: string;
  full_pronunciation: string[];
  group_size: number;
  majority_count: number;
  majority_pct: number;
}

const allOutliers: Outlier[] = [];
const seenWordEndings = new Set<string>(); // track word+ending combos to avoid duplicates

for (const endingLen of [4, 5, 6]) {
  // Group words by their final N characters of spelling
  const endingGroups = new Map<string, string[]>();

  for (const word of allWords) {
    if (word.length < endingLen + 2) continue; // word must be longer than just the ending
    const ending = word.slice(-endingLen);
    // Skip endings that are all the same letter (e.g., "aaaa")
    if (new Set(ending).size === 1) continue;
    if (!endingGroups.has(ending)) endingGroups.set(ending, []);
    endingGroups.get(ending)!.push(word);
  }

  // Process each group with >= 5 words
  for (const [ending, words] of endingGroups) {
    if (words.length < 5) continue;

    // We need to figure out how many ending phonemes correspond to the spelling ending.
    // Strategy: try different phoneme counts and find the one where the majority agrees.
    // We try phoneme counts from 1 up to max phonemes in the shortest word.
    const minPhonemeCount = Math.min(...words.map((w) => cmudict[w].length));
    const maxTry = Math.min(minPhonemeCount, endingLen + 2); // reasonable upper bound

    let bestPhonemeCount = 0;
    let bestMajorityPct = 0;
    let bestMajorityPron = '';
    let bestPronCounts = new Map<string, number>();

    for (let numPhonemes = 1; numPhonemes <= maxTry; numPhonemes++) {
      const pronCounts = new Map<string, number>();
      for (const word of words) {
        const endPron = getEndingPhonemes(cmudict[word], numPhonemes);
        if (!endPron) continue;
        pronCounts.set(endPron, (pronCounts.get(endPron) ?? 0) + 1);
      }

      // Find majority pronunciation
      let maxCount = 0;
      let majorityPron = '';
      for (const [pron, count] of pronCounts) {
        if (count > maxCount) {
          maxCount = count;
          majorityPron = pron;
        }
      }

      const majorityPct = maxCount / words.length;

      // We want a phoneme count where there's a strong majority (>= 60%)
      // and that is as long as possible (more specific = more useful)
      if (majorityPct >= 0.6 && numPhonemes >= bestPhonemeCount) {
        // Prefer longer phoneme sequences with strong majority
        if (numPhonemes > bestPhonemeCount || majorityPct > bestMajorityPct) {
          bestPhonemeCount = numPhonemes;
          bestMajorityPct = majorityPct;
          bestMajorityPron = majorityPron;
          bestPronCounts = pronCounts;
        }
      }
    }

    if (bestPhonemeCount === 0 || !bestMajorityPron) continue;

    // Require majority to be >= 70% to be confident
    if (bestMajorityPct < 0.7) continue;

    // Find outliers: words that don't match the majority pronunciation
    const majorityCount = bestPronCounts.get(bestMajorityPron) ?? 0;

    for (const word of words) {
      const actualEnding = getEndingPhonemes(cmudict[word], bestPhonemeCount);
      if (!actualEnding) continue;
      if (actualEnding === bestMajorityPron) continue;

      // This word is an outlier
      const freq = getWordFrequency(word) ?? 0;

      // Skip if this word+ending combo was already found at a different ending length
      const key = `${word}|${ending}`;
      if (seenWordEndings.has(key)) continue;
      seenWordEndings.add(key);

      allOutliers.push({
        word,
        frequency: freq,
        spelling_ending: ending,
        ending_length: endingLen,
        actual_ending_phonemes: actualEnding,
        expected_ending_phonemes: bestMajorityPron,
        full_pronunciation: cmudict[word],
        group_size: words.length,
        majority_count: majorityCount,
        majority_pct: bestMajorityPct,
      });
    }
  }
}

// Deduplicate: if the same word appears for multiple ending lengths, keep the
// most specific one (longest ending)
const bestPerWord = new Map<string, Outlier>();
for (const outlier of allOutliers) {
  const existing = bestPerWord.get(outlier.word);
  if (
    !existing ||
    outlier.ending_length > existing.ending_length ||
    (outlier.ending_length === existing.ending_length &&
      outlier.majority_pct > existing.majority_pct)
  ) {
    bestPerWord.set(outlier.word, outlier);
  }
}

const deduped = [...bestPerWord.values()];

// Sort by frequency descending (highest frequency outliers first)
deduped.sort((a, b) => b.frequency - a.frequency);

// Print results
console.log('='.repeat(90));
console.log('RHYME CONSISTENCY SCAN: Words with unexpected ending pronunciations');
console.log('='.repeat(90));
console.log(`Total outliers found: ${allOutliers.length}`);
console.log(`After deduplication (best per word): ${deduped.length}`);
console.log();

const top = deduped.slice(0, 50);
console.log(`Top ${top.length} most suspicious outliers (sorted by frequency):\n`);

console.log(
  `${'#'.padStart(3)} ` +
    `${'Word'.padEnd(20)} ` +
    `${'Freq'.padStart(6)} ` +
    `${'Ending'.padEnd(8)} ` +
    `${'Group'.padStart(5)} ` +
    `${'Maj%'.padStart(5)} ` +
    `${'Expected ending phonemes'.padEnd(28)} ` +
    `${'Actual ending phonemes'.padEnd(28)} ` +
    `Full pronunciation`
);
console.log('-'.repeat(140));

for (let i = 0; i < top.length; i++) {
  const o = top[i];
  console.log(
    `${String(i + 1).padStart(3)} ` +
      `${o.word.padEnd(20)} ` +
      `${String(o.frequency).padStart(6)} ` +
      `${('-' + o.spelling_ending).padEnd(8)} ` +
      `${String(o.group_size).padStart(5)} ` +
      `${(o.majority_pct * 100).toFixed(0).padStart(4)}% ` +
      `${o.expected_ending_phonemes.padEnd(28)} ` +
      `${o.actual_ending_phonemes.padEnd(28)} ` +
      `${o.full_pronunciation.join(' ')}`
  );
}

// Show breakdown by ending pattern
console.log(`\n${'='.repeat(90)}`);
console.log('BREAKDOWN BY ENDING PATTERN (top 30 endings with most outliers)');
console.log('='.repeat(90));

const byEnding = new Map<string, Outlier[]>();
for (const o of deduped) {
  const key = o.spelling_ending;
  if (!byEnding.has(key)) byEnding.set(key, []);
  byEnding.get(key)!.push(o);
}

const endingSorted = [...byEnding.entries()]
  .sort((a, b) => {
    // Sort by sum of frequencies of outliers (impact)
    const aFreqSum = a[1].reduce((s, o) => s + o.frequency, 0);
    const bFreqSum = b[1].reduce((s, o) => s + o.frequency, 0);
    return bFreqSum - aFreqSum;
  })
  .slice(0, 30);

for (const [ending, outliers] of endingSorted) {
  const sample = outliers[0];
  const freqSum = outliers.reduce((s, o) => s + o.frequency, 0);
  console.log(
    `\n  -${ending} (${outliers.length} outliers, group=${sample.group_size}, ` +
      `majority="${sample.expected_ending_phonemes}" @ ${(sample.majority_pct * 100).toFixed(0)}%, ` +
      `total freq impact=${freqSum})`
  );

  // Show top outliers for this ending, sorted by frequency
  const sorted = outliers.sort((a, b) => b.frequency - a.frequency).slice(0, 8);
  for (const o of sorted) {
    console.log(
      `    ${o.word.padEnd(20)} freq=${String(o.frequency).padStart(6)}  ` +
        `actual: ${o.actual_ending_phonemes.padEnd(24)} ` +
        `[${o.full_pronunciation.join(' ')}]`
    );
  }
  if (outliers.length > 8) {
    console.log(`    ... and ${outliers.length - 8} more`);
  }
}

// Summary
console.log(`\n${'='.repeat(90)}`);
console.log('SUMMARY');
console.log('='.repeat(90));
console.log(`Total words analyzed: ${allWords.length}`);
console.log(`Total outliers (deduplicated): ${deduped.length}`);
console.log(`Distinct ending patterns with outliers: ${byEnding.size}`);
console.log(`\nEnding length distribution:`);
const byLen = new Map<number, number>();
for (const o of deduped) byLen.set(o.ending_length, (byLen.get(o.ending_length) ?? 0) + 1);
for (const [len, count] of [...byLen.entries()].sort((a, b) => a[0] - b[0])) {
  console.log(`  ${len}-char endings: ${count} outliers`);
}
