/**
 * Analyze which NRL rules cause the most G2P errors.
 * For each error, tracks the rule that fired when the first phoneme mismatch occurs.
 * Ranked by frequency-weighted impact and by word count.
 *
 * Usage: npx tsx --conditions=source packages/core/scripts/g2p-rule-errors.ts [N]
 *   N = number of entries per section (default 50)
 */
import { loadDictionary, loadFrequencies, getWordFrequency } from '@ingglish/dictionary';
import { wordToArpabetTraced } from '@ingglish/g2p';
import { stripStress } from '@ingglish/phonemes';
import { parseWordLimit } from './g2p/eval-g2p.js';

export async function main() {
  const n = parseInt(process.argv[2] || '50', 10);
  const dict = await loadDictionary();
  await loadFrequencies();
  const limit = parseWordLimit();

  const ruleErrors: Record<string, { count: number; freqSum: number; examples: string[] }> = {};

  let total = 0;
  let errors = 0;

  for (const word of Object.keys(dict)) {
    if (/[^a-z]/i.test(word) || word.length < 3) continue;
    if (++total > limit) break;

    const freq = getWordFrequency(word) ?? 0;
    const cmu = dict[word].map(stripStress);
    const trace = wordToArpabetTraced(word);
    const g2p = trace.phonemes.map(stripStress);

    if (g2p.join(' ') === cmu.join(' ')) continue;
    errors++;

    // Walk through trace steps and CMU phonemes to find first mismatch
    let g2pIdx = 0;
    for (const step of trace.steps) {
      const stepPhonemes = step.phonemes.map(stripStress);
      for (let j = 0; j < stepPhonemes.length; j++) {
        const got = stepPhonemes[j];
        const want = g2pIdx < cmu.length ? cmu[g2pIdx] : '(end)';
        if (got !== want) {
          const key = `${step.rule} :: ${got}→${want}`;
          if (!ruleErrors[key]) ruleErrors[key] = { count: 0, freqSum: 0, examples: [] };
          ruleErrors[key].count++;
          ruleErrors[key].freqSum += freq;
          if (ruleErrors[key].examples.length < 3) {
            ruleErrors[key].examples.push(word);
          }
          break;
        }
        g2pIdx++;
      }
      if (g2pIdx < trace.phonemes.length) {
        const gotP = stripStress(trace.phonemes[g2pIdx]);
        const wantP = g2pIdx < cmu.length ? cmu[g2pIdx] : '(end)';
        if (gotP !== wantP) break;
      }
    }
  }

  console.log(`Total: ${total}, Errors: ${errors}\n`);

  console.log(`=== Top ${n} Rule-Level Errors (by freq weight) ===\n`);
  const byFreq = Object.entries(ruleErrors).sort((a, b) => b[1].freqSum - a[1].freqSum);
  for (const [key, { count, freqSum, examples }] of byFreq.slice(0, n)) {
    console.log(
      `  freq ${freqSum.toString().padStart(8)} (${count.toString().padStart(5)} words) : ${key}`
    );
    console.log(`          e.g.: ${examples.join(', ')}`);
  }

  console.log(`\n=== Top ${n} Rule-Level Errors (by word count) ===\n`);
  const byCount = Object.entries(ruleErrors).sort((a, b) => b[1].count - a[1].count);
  for (const [key, { count, freqSum, examples }] of byCount.slice(0, n)) {
    console.log(
      `  ${count.toString().padStart(5)} words (freq ${freqSum.toString().padStart(8)}) : ${key}`
    );
    console.log(`          e.g.: ${examples.join(', ')}`);
  }
}

if (process.argv[1]?.includes('g2p-rule-errors')) main().catch(console.error);
