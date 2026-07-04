#!/usr/bin/env -S npx vite-node --script
/**
 * Backtest the full fallback chain against the CMU dictionary.
 *
 * For each word in CMUdict, temporarily hides it from the dictionary
 * so the production fallback chain fires (compound → stemming → G2P).
 * Compares the result to the actual CMU pronunciation.
 *
 * Usage: npx vite-node --script scripts/g2p/backtest.ts
 */

import { loadDictionary, getDictionary, loadFrequencies } from '@ingglish/dictionary';
import { wordToArpabet } from '@ingglish/g2p';
import { stripStress, registerFormat } from '@ingglish/phonemes';
import { translateUnknown } from '@ingglish/fallback';
import { parseWordLimit } from './eval-g2p.js';

// Register an 'arpabet' format that returns phonemes joined with spaces
registerFormat('arpabet', {
  forward: (phonemes: string[]) => phonemes.join(' '),
  joinSeparator: ' ',
  label: 'ARPAbet',
});

export async function main() {
  const dict = await loadDictionary();
  await loadFrequencies();
  const limit = parseWordLimit();
  const words = Object.keys(dict);

  let total = 0;
  let exactMatch = 0;
  let stresslessMatch = 0;
  let g2pOnlyMatch = 0;

  const phonemeErrors: Record<string, number> = {};
  const suffixErrors: Record<string, number> = {};
  const prefixErrors: Record<string, number> = {};
  const wrongSamples: { word: string; got: string; want: string }[] = [];

  for (const word of words) {
    if (/[^a-z]/i.test(word)) continue;
    if (word.length < 3) continue;

    total++;
    if (total > limit) break;

    const cmuPhonemes = dict[word];
    const cmuStr = cmuPhonemes.join(' ');
    const cmuNoStress = cmuPhonemes.map(stripStress).join(' ');

    // Also track G2P-only for comparison
    const g2pNoStress = wordToArpabet(word).map(stripStress).join(' ');
    if (g2pNoStress === cmuNoStress) g2pOnlyMatch++;

    // Temporarily hide the word from the dictionary so fallback chain fires
    const saved = dict[word];
    delete dict[word];

    const fallbackStr = translateUnknown(word, 'arpabet' as 'ingglish');

    // Restore the word
    dict[word] = saved;

    if (fallbackStr === cmuStr) {
      exactMatch++;
      stresslessMatch++;
      continue;
    }

    const fbNoStress = fallbackStr.split(' ').map(stripStress).join(' ');
    if (fbNoStress === cmuNoStress) {
      stresslessMatch++;
      continue;
    }

    // Error analysis
    const cmuArr = cmuNoStress.split(' ');
    const fbArr = fbNoStress.split(' ');
    const minLen = Math.min(cmuArr.length, fbArr.length);

    for (let i = 0; i < minLen; i++) {
      if (cmuArr[i] !== fbArr[i]) {
        const key = `${fbArr[i]} should be ${cmuArr[i]}`;
        phonemeErrors[key] = (phonemeErrors[key] ?? 0) + 1;
        break;
      }
    }
    if (cmuArr.length !== fbArr.length) {
      const key = `len ${fbArr.length} should be ${cmuArr.length}`;
      phonemeErrors[key] = (phonemeErrors[key] ?? 0) + 1;
    }

    if (word.length >= 4) {
      const suffix = word.slice(-3);
      suffixErrors[suffix] = (suffixErrors[suffix] ?? 0) + 1;
    }
    if (word.length >= 4) {
      const prefix = word.slice(0, 3);
      prefixErrors[prefix] = (prefixErrors[prefix] ?? 0) + 1;
    }

    if (wrongSamples.length < 1000) {
      wrongSamples.push({ word, got: fallbackStr, want: cmuStr });
    }
  }

  const wrongCount = total - stresslessMatch;

  console.log('=== Fallback Chain Backtest Results ===\n');
  console.log(`Total words tested: ${total}`);
  console.log(
    `Exact match (with stress): ${exactMatch} (${((exactMatch / total) * 100).toFixed(1)}%)`
  );
  console.log(
    `Match (ignoring stress): ${stresslessMatch} (${((stresslessMatch / total) * 100).toFixed(1)}%)`
  );
  console.log(`Wrong: ${wrongCount} (${((wrongCount / total) * 100).toFixed(1)}%)`);
  console.log(`G2P-only baseline: ${g2pOnlyMatch} (${((g2pOnlyMatch / total) * 100).toFixed(1)}%)`);

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

  console.log(`\n=== Sample Wrong Words (all ${wrongSamples.length}) ===\n`);
  for (const { word, got, want } of wrongSamples.slice(0, 200)) {
    console.log(`  ${word.padEnd(20)} got: ${got.padEnd(35)} want: ${want}`);
  }
}

if (process.argv[1]?.includes('backtest')) main().catch(console.error);
