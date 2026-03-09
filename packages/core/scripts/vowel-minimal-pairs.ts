/**
 * Finds minimal pairs for every vowel pair in the dictionary,
 * weighted by SUBTLEX word frequency.
 *
 * A minimal pair for vowels X/Y is two words whose pronunciations
 * are identical except that one has X where the other has Y (ignoring stress).
 *
 * Output: a table of vowel pairs ranked by "functional load" —
 * the frequency-weighted count of minimal pairs. Low functional load
 * means the contrast carries little information and could potentially be merged.
 *
 * Usage: cd /Users/pt/github/ingglish2 && npx tsx --conditions=source packages/core/scripts/vowel-minimal-pairs.ts
 */

import {
  loadDictionary,
  getDictionary,
  loadFrequencies,
  getWordFrequency,
} from '@ingglish/dictionary';
import { ARPABET_VOWELS, stripStress } from '@ingglish/phonemes';
import { parseWordLimit } from './g2p/eval-g2p.js';

const VOWELS = new Set<string>(ARPABET_VOWELS);

interface MinimalPair {
  word1: string;
  word2: string;
  freq: number; // min frequency of the pair (both must be known)
}

async function main(): Promise<void> {
  await Promise.all([loadDictionary(), loadFrequencies()]);
  const limit = parseWordLimit();
  const dict = getDictionary();

  // Build a map: "frame" → Map<vowel, {word, freq}[]>
  // A "frame" is the pronunciation with one vowel position replaced by '*'
  // This lets us find words that differ only at that vowel position.
  const frames = new Map<string, Map<string, { word: string; freq: number }[]>>();

  const words = Object.keys(dict);
  let count = 0;
  for (const word of words) {
    if (/[^a-z]/.test(word)) continue;
    if (++count > limit) break;
    const phonemes = dict[word];
    const freq = getWordFrequency(word) ?? 0;
    if (freq === 0) continue; // skip words with no frequency data

    // Strip stress from all phonemes
    const stripped = phonemes.map((p) => stripStress(p));

    // For each vowel position, create a frame
    for (let i = 0; i < stripped.length; i++) {
      if (!VOWELS.has(stripped[i])) continue;

      const vowel = stripped[i];
      const frame = [...stripped];
      frame[i] = '*';
      const frameKey = frame.join(' ');

      let vowelMap = frames.get(frameKey);
      if (vowelMap === undefined) {
        vowelMap = new Map();
        frames.set(frameKey, vowelMap);
      }

      let entries = vowelMap.get(vowel);
      if (entries === undefined) {
        entries = [];
        vowelMap.set(vowel, entries);
      }
      // Keep only the highest-frequency word per vowel per frame
      // (avoids counting variant spellings as separate pairs)
      if (entries.length === 0 || entries[0].freq < freq) {
        entries[0] = { word, freq };
      }
    }
  }

  // Now count minimal pairs per vowel pair
  const vowelList = [...ARPABET_VOWELS];
  const pairCounts = new Map<string, { count: number; freqSum: number; examples: MinimalPair[] }>();

  // Initialize all pairs
  for (let i = 0; i < vowelList.length; i++) {
    for (let j = i + 1; j < vowelList.length; j++) {
      const key = `${vowelList[i]}/${vowelList[j]}`;
      pairCounts.set(key, { count: 0, freqSum: 0, examples: [] });
    }
  }

  // Scan frames for minimal pairs
  for (const vowelMap of frames.values()) {
    const vowelsInFrame = [...vowelMap.keys()];
    for (let i = 0; i < vowelsInFrame.length; i++) {
      for (let j = i + 1; j < vowelsInFrame.length; j++) {
        let v1 = vowelsInFrame[i];
        let v2 = vowelsInFrame[j];
        // Canonical order
        if (v1 > v2) [v1, v2] = [v2, v1];

        const key = `${v1}/${v2}`;
        const data = pairCounts.get(key);
        if (data === undefined) continue;

        const entries1 = vowelMap.get(v1)!;
        const entries2 = vowelMap.get(v2)!;
        const w1 = entries1[0];
        const w2 = entries2[0];
        const pairFreq = Math.min(w1.freq, w2.freq);

        data.count++;
        data.freqSum += pairFreq;
        // Keep top 5 examples by frequency
        data.examples.push({ word1: w1.word, word2: w2.word, freq: pairFreq });
        data.examples.sort((a, b) => b.freq - a.freq);
        if (data.examples.length > 5) data.examples.length = 5;
      }
    }
  }

  // Sort by frequency-weighted sum (functional load)
  const sorted = [...pairCounts.entries()].sort((a, b) => a[1].freqSum - b[1].freqSum);

  // Print results
  console.log('Vowel Minimal Pairs — ranked by functional load (freq-weighted)\n');
  console.log(
    `${'Pair'.padEnd(8)} ${'Count'.padStart(6)} ${'FreqLoad'.padStart(10)}  Top examples`
  );
  console.log('─'.repeat(90));

  for (const [pair, data] of sorted) {
    const examples = data.examples.map((e) => `${e.word1}/${e.word2}`).join(', ');
    console.log(
      `${pair.padEnd(8)} ${String(data.count).padStart(6)} ${String(data.freqSum).padStart(10)}  ${examples}`
    );
  }

  // Summary
  console.log('\n─'.repeat(90));
  console.log('\nLow functional load = fewer/rarer minimal pairs = safer to merge.');
  console.log(
    'High functional load = many common minimal pairs = merging would cause ambiguity.\n'
  );

  // Highlight merge candidates
  console.log('Potential merge candidates (bottom 10):');
  for (const [pair, data] of sorted.slice(0, 10)) {
    const [v1, v2] = pair.split('/');
    const spell1 = VOWEL_SPELLINGS[v1] ?? v1;
    const spell2 = VOWEL_SPELLINGS[v2] ?? v2;
    console.log(
      `  ${pair.padEnd(8)} (${spell1}/${spell2})`.padEnd(30) +
        `${data.count} pairs, load=${data.freqSum}`
    );
  }
}

const VOWEL_SPELLINGS: Record<string, string> = {
  AA: 'o',
  AE: 'a',
  AH: 'u',
  AO: 'aw',
  AW: 'ou',
  AY: 'ai',
  EH: 'e',
  ER: 'er',
  EY: 'ay',
  IH: 'i',
  IY: 'ee',
  OW: 'oh',
  OY: 'oi',
  UH: 'oo',
  UW: 'uu',
};

main().catch(console.error);
