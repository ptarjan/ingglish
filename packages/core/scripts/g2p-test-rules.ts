/**
 * Test individual G2P rule changes by temporarily modifying g2p-rules.ts
 * and running the backtest for each change.
 *
 * Usage:
 *   cd /Users/pt/github/ingglish2
 *   npx tsx --conditions=source packages/core/scripts/g2p-test-rules.ts
 */

import { loadDictionary, loadFrequencies, getWordFrequency } from '@ingglish/dictionary';
import { wordToArpabet } from '@ingglish/g2p';
import { stripStress } from '@ingglish/phonemes';

async function main() {
  const dict = await loadDictionary();
  await loadFrequencies();
  const words = Object.keys(dict).filter((w) => /^[a-z]+$/.test(w) && w.length >= 3);

  // Run baseline
  let baseline = 0;
  const wordResults = new Map<string, boolean>();
  for (const word of words) {
    const cmu = dict[word]!.map(stripStress);
    const g2p = wordToArpabet(word).map(stripStress);
    const match = cmu.join(' ') === g2p.join(' ');
    wordResults.set(word, match);
    if (match) baseline++;
  }
  console.log(
    `Baseline: ${baseline}/${words.length} (${((baseline / words.length) * 100).toFixed(1)}%)\n`
  );

  // For each word in the dictionary, find the ones that are wrong
  // and have the highest frequency. These are candidates for word-specific fixes.
  const wrongWords: { word: string; freq: number; got: string; want: string }[] = [];
  for (const word of words) {
    if (wordResults.get(word)) continue;
    const freq = getWordFrequency(word) ?? 0;
    const got = wordToArpabet(word).map(stripStress).join(' ');
    const want = dict[word]!.map(stripStress).join(' ');
    wrongWords.push({ word, freq, got, want });
  }

  wrongWords.sort((a, b) => b.freq - a.freq);

  // Print top 100 highest-frequency wrong words not yet handled
  console.log('=== TOP 100 HIGHEST-FREQUENCY WRONG WORDS ===\n');
  console.log('Rank  Freq    Word             Got                              Want');
  console.log(
    '----  ------  ---------------  -------------------------------  -------------------------------'
  );
  for (let i = 0; i < Math.min(100, wrongWords.length); i++) {
    const w = wrongWords[i]!;
    console.log(
      `${String(i + 1).padStart(4)}  ${String(w.freq).padStart(6)}  ${w.word.padEnd(15)}  ${w.got.padEnd(31)}  ${w.want}`
    );
  }

  // Also find words that are CLOSE to correct (edit distance 1)
  console.log('\n\n=== WORDS WITH EDIT DISTANCE 1 (EASY FIXES) ===\n');
  const closeMisses: typeof wrongWords = [];
  for (const w of wrongWords) {
    const gotParts = w.got.split(' ');
    const wantParts = w.want.split(' ');
    if (gotParts.length === wantParts.length) {
      let diffs = 0;
      for (let i = 0; i < gotParts.length; i++) {
        if (gotParts[i] !== wantParts[i]) diffs++;
      }
      if (diffs === 1) closeMisses.push(w);
    }
  }
  closeMisses.sort((a, b) => b.freq - a.freq);
  console.log(`Found ${closeMisses.length} words with exactly 1 phoneme wrong\n`);
  console.log('Rank  Freq    Word             Got                              Want');
  console.log(
    '----  ------  ---------------  -------------------------------  -------------------------------'
  );
  for (let i = 0; i < Math.min(80, closeMisses.length); i++) {
    const w = closeMisses[i]!;
    // Find the differing phoneme
    const gotParts = w.got.split(' ');
    const wantParts = w.want.split(' ');
    let diffIdx = -1;
    for (let j = 0; j < gotParts.length; j++) {
      if (gotParts[j] !== wantParts[j]) {
        diffIdx = j;
        break;
      }
    }
    const diff = `[${diffIdx}] ${gotParts[diffIdx!]}→${wantParts[diffIdx!]}`;
    console.log(
      `${String(i + 1).padStart(4)}  ${String(w.freq).padStart(6)}  ${w.word.padEnd(15)}  ${w.got.padEnd(31)}  ${w.want.padEnd(31)}  ${diff}`
    );
  }

  // Group edit-distance-1 errors by the specific phoneme substitution
  console.log('\n\n=== MOST COMMON SINGLE-PHONEME SUBSTITUTIONS ===\n');
  const subGroups = new Map<string, { count: number; freqSum: number; words: string[] }>();
  for (const w of closeMisses) {
    const gotParts = w.got.split(' ');
    const wantParts = w.want.split(' ');
    for (let j = 0; j < gotParts.length; j++) {
      if (gotParts[j] !== wantParts[j]) {
        const key = `${gotParts[j]}→${wantParts[j]}`;
        const existing = subGroups.get(key);
        if (existing) {
          existing.count++;
          existing.freqSum += w.freq;
          if (existing.words.length < 8) existing.words.push(w.word);
        } else {
          subGroups.set(key, { count: 1, freqSum: w.freq, words: [w.word] });
        }
        break;
      }
    }
  }

  const sortedSubs = [...subGroups.entries()].sort((a, b) => b[1].count - a[1].count);
  console.log('Count  FreqWt  Substitution       Sample words');
  console.log('-----  ------  -----------------  ----------------------------------------');
  for (const [sub, data] of sortedSubs.slice(0, 40)) {
    console.log(
      `${String(data.count).padStart(5)}  ${String(data.freqSum).padStart(6)}  ${sub.padEnd(17)}  ${data.words.join(', ')}`
    );
  }
}

main().catch(console.error);
