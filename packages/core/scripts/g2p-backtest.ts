/**
 * Backtest G2P rules against the CMU dictionary.
 *
 * For each word in the CMU dictionary, run the G2P rules to produce
 * phonemes, then compare to the actual CMU pronunciation. Report
 * accuracy and common error patterns.
 *
 * Usage: npx tsx scripts/g2p-backtest.ts
 */

import { loadDictionary } from '../src/dictionary/loader';
import { wordToArpabet } from '../src/fallback/g2p-rules';
import { stripStress } from '../src/phonemes/arpabet';

async function main() {
  const dict = await loadDictionary();
  const words = Object.keys(dict);

  let total = 0;
  let exactMatch = 0;
  let stresslessMatch = 0;

  // Track error patterns: which grapheme→phoneme mappings are most wrong
  const phonemeErrors: Record<string, number> = {};
  // Track which word patterns cause errors
  const suffixErrors: Record<string, number> = {};
  const prefixErrors: Record<string, number> = {};
  // Sample wrong words for review
  const wrongSamples: { word: string; g2p: string; cmu: string }[] = [];

  for (const word of words) {
    // Skip words with numbers, hyphens, or apostrophes
    if (/[^a-z]/i.test(word)) continue;
    // Skip very short words (1-2 chars) — too ambiguous
    if (word.length < 3) continue;

    total++;

    const cmuPhonemes = dict[word];
    const g2pPhonemes = wordToArpabet(word);

    const cmuStr = cmuPhonemes.join(' ');
    const g2pStr = g2pPhonemes.join(' ');

    if (cmuStr === g2pStr) {
      exactMatch++;
      stresslessMatch++;
      continue;
    }

    // Compare without stress markers
    const cmuNoStress = cmuPhonemes.map(stripStress).join(' ');
    const g2pNoStress = g2pPhonemes.map(stripStress).join(' ');

    if (cmuNoStress === g2pNoStress) {
      stresslessMatch++;
      continue;
    }

    // It's wrong — analyze the error
    // Find first differing phoneme
    const cmuArr = cmuNoStress.split(' ');
    const g2pArr = g2pNoStress.split(' ');
    const minLen = Math.min(cmuArr.length, g2pArr.length);

    for (let i = 0; i < minLen; i++) {
      if (cmuArr[i] !== g2pArr[i]) {
        const key = `${g2pArr[i]} should be ${cmuArr[i]}`;
        phonemeErrors[key] = (phonemeErrors[key] ?? 0) + 1;
        break;
      }
    }
    if (cmuArr.length !== g2pArr.length) {
      const key = `len ${g2pArr.length} should be ${cmuArr.length}`;
      phonemeErrors[key] = (phonemeErrors[key] ?? 0) + 1;
    }

    // Track suffix patterns (last 3 chars)
    if (word.length >= 4) {
      const suffix = word.slice(-3);
      suffixErrors[suffix] = (suffixErrors[suffix] ?? 0) + 1;
    }
    // Track prefix patterns (first 3 chars)
    if (word.length >= 4) {
      const prefix = word.slice(0, 3);
      prefixErrors[prefix] = (prefixErrors[prefix] ?? 0) + 1;
    }

    // Collect samples (limit to keep output manageable)
    if (wrongSamples.length < 200) {
      wrongSamples.push({ word, g2p: g2pStr, cmu: cmuStr });
    }
  }

  const wrongCount = total - stresslessMatch;

  console.log('=== G2P Backtest Results ===\n');
  console.log(`Total words tested: ${total}`);
  console.log(
    `Exact match (with stress): ${exactMatch} (${((exactMatch / total) * 100).toFixed(1)}%)`
  );
  console.log(
    `Match (ignoring stress): ${stresslessMatch} (${((stresslessMatch / total) * 100).toFixed(1)}%)`
  );
  console.log(`Wrong: ${wrongCount} (${((wrongCount / total) * 100).toFixed(1)}%)`);

  console.log('\n=== Top 30 Phoneme Error Patterns ===\n');
  const sortedErrors = Object.entries(phonemeErrors).sort((a, b) => b[1] - a[1]);
  for (const [pattern, count] of sortedErrors.slice(0, 30)) {
    console.log(`  ${count.toString().padStart(5)} : ${pattern}`);
  }

  console.log('\n=== Top 20 Suffix Error Patterns ===\n');
  const sortedSuffixes = Object.entries(suffixErrors).sort((a, b) => b[1] - a[1]);
  for (const [suffix, count] of sortedSuffixes.slice(0, 20)) {
    console.log(`  ${count.toString().padStart(5)} : -${suffix}`);
  }

  console.log('\n=== Top 20 Prefix Error Patterns ===\n');
  const sortedPrefixes = Object.entries(prefixErrors).sort((a, b) => b[1] - a[1]);
  for (const [prefix, count] of sortedPrefixes.slice(0, 20)) {
    console.log(`  ${count.toString().padStart(5)} : ${prefix}-`);
  }

  console.log('\n=== Sample Wrong Words (first 50) ===\n');
  for (const { word, g2p, cmu } of wrongSamples.slice(0, 50)) {
    console.log(`  ${word.padEnd(20)} G2P: ${g2p.padEnd(35)} CMU: ${cmu}`);
  }
}

main().catch(console.error);
