/**
 * Find highest-frequency words where G2P is wrong.
 * Shows freq-weighted impact of each error for hill-climbing prioritization.
 *
 * Usage:
 *   npx tsx --conditions=source packages/core/scripts/g2p-freq-errors.ts [N] [--skip-trivial]
 *
 * Options:
 *   N               Number of errors to show (default 80)
 *   --skip-trivial  Exclude errors where ALL diffs are AH→AE or IH→AH (schwa confusion)
 */
import { loadDictionary, loadFrequencies, getWordFrequency } from '@ingglish/dictionary';
import { wordToArpabet } from '@ingglish/g2p';
import { stripStress } from '@ingglish/phonemes';
import { parseWordLimit } from './g2p/eval-g2p.js';

async function main() {
  const args = process.argv.slice(2);
  const skipTrivial = args.includes('--skip-trivial');
  const n = parseInt(args.find((a) => !a.startsWith('--')) || '80', 10);

  const dict = await loadDictionary();
  await loadFrequencies();
  const limit = parseWordLimit();

  let freqTotal = 0;
  const errors: { word: string; freq: number; got: string; want: string }[] = [];

  let count = 0;
  for (const word of Object.keys(dict)) {
    if (/[^a-z]/i.test(word) || word.length < 3) continue;
    if (++count > limit) break;
    const freq = getWordFrequency(word) ?? 0;
    freqTotal += freq;
    const gotParts = wordToArpabet(word).map(stripStress);
    const wantParts = dict[word].map(stripStress);
    const got = gotParts.join(' ');
    const want = wantParts.join(' ');
    if (got === want) continue;

    if (skipTrivial && gotParts.length === wantParts.length) {
      let hasNonTrivial = false;
      for (let i = 0; i < gotParts.length; i++) {
        if (gotParts[i] !== wantParts[i]) {
          if (gotParts[i] === 'AH' && wantParts[i] === 'AE') continue;
          if (gotParts[i] === 'IH' && wantParts[i] === 'AH') continue;
          hasNonTrivial = true;
        }
      }
      if (!hasNonTrivial) continue;
    }

    errors.push({ word, freq, got, want });
  }

  errors.sort((a, b) => b.freq - a.freq);
  const totalErrFreq = errors.reduce((s, e) => s + e.freq, 0);
  console.log(
    `Total errors: ${errors.length}, Error freq sum: ${totalErrFreq} / ${freqTotal} (${((totalErrFreq / freqTotal) * 100).toFixed(2)}%)\n`
  );
  console.log(`=== Top ${n} Highest-Frequency G2P Errors ===\n`);
  let cumFreq = 0;
  for (const { word, freq, got, want } of errors.slice(0, n)) {
    cumFreq += freq;
    const pct = ((freq / freqTotal) * 100).toFixed(3);
    const cumPct = ((cumFreq / freqTotal) * 100).toFixed(2);
    console.log(
      `  ${freq.toString().padStart(6)} (${pct}%, cum ${cumPct}%) ${word.padEnd(20)} got: ${got.padEnd(35)} want: ${want}`
    );
  }
}
main().catch(console.error);
