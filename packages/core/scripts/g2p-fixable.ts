/**
 * Show fixable G2P errors: same-length phoneme mismatches and length mismatches.
 * Filters out trivial schwa confusion (AH→AE, IH→AH) by default.
 *
 * Usage:
 *   npx tsx --conditions=source packages/core/scripts/g2p-fixable.ts [--min-freq=N]
 *
 * Options:
 *   --min-freq=N  Minimum word frequency to show (default 200)
 */
import { loadDictionary, loadFrequencies, getWordFrequency } from '@ingglish/dictionary';
import { wordToArpabet } from '@ingglish/g2p';
import { stripStress } from '@ingglish/phonemes';
import { parseWordLimit } from './g2p/eval-g2p.js';

export async function main() {
  const args = process.argv.slice(2);
  const minFreqArg = args.find((a) => a.startsWith('--min-freq='));
  const minFreq = minFreqArg ? parseInt(minFreqArg.split('=')[1], 10) : 200;

  const dict = await loadDictionary();
  await loadFrequencies();
  const limit = parseWordLimit();
  const words = Object.keys(dict).filter((w) => /^[a-z]+$/.test(w) && w.length >= 3);
  const results: { word: string; freq: number; got: string; want: string }[] = [];

  let count = 0;
  for (const word of words) {
    if (++count > limit) break;
    const want = dict[word]!.map(stripStress).join(' ');
    const got = wordToArpabet(word).map(stripStress).join(' ');
    if (got !== want) {
      const freq = getWordFrequency(word) ?? 0;
      results.push({ word, freq, got, want });
    }
  }
  results.sort((a, b) => b.freq - a.freq);

  // Same-length fixable errors (excluding trivial schwa confusion)
  console.log(`=== FIXABLE ERRORS (freq >= ${minFreq}, sorted by frequency) ===`);
  let fixableCount = 0;
  for (const r of results) {
    const g = r.got.split(' ');
    const w = r.want.split(' ');
    if (g.length !== w.length) continue;
    let hasFixable = false;
    for (let i = 0; i < g.length; i++) {
      if (g[i] !== w[i]) {
        if (g[i] === 'AH' && w[i] === 'AE') continue;
        if (g[i] === 'IH' && w[i] === 'AH') continue;
        hasFixable = true;
      }
    }
    if (hasFixable && r.freq >= minFreq) {
      console.log(
        r.freq.toString().padStart(6) +
          '  ' +
          r.word.padEnd(18) +
          'got=' +
          r.got.padEnd(45) +
          'want=' +
          r.want
      );
      fixableCount++;
    }
  }

  // Length mismatches (extra/missing phonemes)
  console.log(`\n=== LENGTH MISMATCH (freq >= ${minFreq}, sorted by frequency) ===`);
  let mismatchCount = 0;
  for (const r of results) {
    const g = r.got.split(' ');
    const w = r.want.split(' ');
    if (g.length === w.length) continue;
    if (r.freq >= minFreq) {
      console.log(
        r.freq.toString().padStart(6) +
          '  ' +
          r.word.padEnd(18) +
          'got=' +
          r.got.padEnd(45) +
          'want=' +
          r.want
      );
      mismatchCount++;
    }
  }
  console.log(`\nFixable same-length: ${fixableCount}, Length mismatch: ${mismatchCount}`);
}
if (process.argv[1]?.includes('g2p-fixable')) main().catch(console.error);
