/**
 * Per-rule accuracy statistics for all NRL rules.
 * Shows rules ranked by wrong-word count, frequency weight, and error rate.
 * Useful for identifying which rules need improvement or replacement.
 *
 * Usage: npx tsx --conditions=source packages/core/scripts/g2p-rule-stats.ts [N]
 *   N = number of entries per section (default 30)
 */
import { loadDictionary, loadFrequencies, getWordFrequency } from '@ingglish/dictionary';
import { wordToArpabetTraced } from '@ingglish/g2p';
import { stripStress } from '@ingglish/phonemes';
import { parseWordLimit } from './g2p/eval-g2p.js';

async function main() {
  const n = parseInt(process.argv[2] || '30', 10);
  const dict = await loadDictionary();
  await loadFrequencies();
  const limit = parseWordLimit();

  const ruleStats: Record<
    string,
    { correct: number; wrong: number; freqWrong: number; freqCorrect: number }
  > = {};

  let count = 0;
  for (const word of Object.keys(dict)) {
    if (/[^a-z]/i.test(word) || word.length < 3) continue;
    if (++count > limit) break;

    const freq = getWordFrequency(word) ?? 0;
    const cmu = dict[word].map(stripStress);
    const trace = wordToArpabetTraced(word);
    const g2p = trace.phonemes.map(stripStress);
    const isCorrect = g2p.join(' ') === cmu.join(' ');

    for (const step of trace.steps) {
      const ruleStr = step.rule;
      if (!ruleStats[ruleStr]) {
        ruleStats[ruleStr] = { correct: 0, wrong: 0, freqWrong: 0, freqCorrect: 0 };
      }
      if (isCorrect) {
        ruleStats[ruleStr].correct++;
        ruleStats[ruleStr].freqCorrect += freq;
      } else {
        ruleStats[ruleStr].wrong++;
        ruleStats[ruleStr].freqWrong += freq;
      }
    }
  }

  console.log(`=== Top ${n} Rules with Most Wrong Words (by count) ===\n`);
  const sorted = Object.entries(ruleStats).sort((a, b) => b[1].wrong - a[1].wrong);
  for (const [rule, { correct, wrong, freqWrong }] of sorted.slice(0, n)) {
    const total = correct + wrong;
    const pct = ((wrong / total) * 100).toFixed(1);
    console.log(
      `  ${wrong.toString().padStart(5)} wrong / ${total.toString().padStart(6)} total (${pct}% err, freq ${freqWrong.toString().padStart(8)}) : ${rule}`
    );
  }

  console.log(`\n=== Top ${n} Rules with Most Wrong Frequency Weight ===\n`);
  const byFreq = Object.entries(ruleStats).sort((a, b) => b[1].freqWrong - a[1].freqWrong);
  for (const [rule, { correct, wrong, freqWrong }] of byFreq.slice(0, n)) {
    const total = correct + wrong;
    const pct = ((wrong / total) * 100).toFixed(1);
    console.log(
      `  freq ${freqWrong.toString().padStart(8)} (${wrong.toString().padStart(5)} wrong / ${total.toString().padStart(6)} total, ${pct}% err) : ${rule}`
    );
  }

  console.log(`\n=== Top ${n} Rules with Highest Error Rate (min 100 uses) ===\n`);
  const byRate = Object.entries(ruleStats)
    .filter(([, s]) => s.correct + s.wrong >= 100)
    .sort((a, b) => {
      const rateB = b[1].wrong / (b[1].correct + b[1].wrong);
      const rateA = a[1].wrong / (a[1].correct + a[1].wrong);
      return rateB - rateA;
    });
  for (const [rule, { correct, wrong, freqWrong }] of byRate.slice(0, n)) {
    const total = correct + wrong;
    const pct = ((wrong / total) * 100).toFixed(1);
    console.log(
      `  ${wrong.toString().padStart(5)} wrong / ${total.toString().padStart(6)} total (${pct}% err, freq ${freqWrong.toString().padStart(8)}) : ${rule}`
    );
  }
}

main().catch(console.error);
