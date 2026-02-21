#!/usr/bin/env npx vite-node
/**
 * Show words where a specific NRL rule fires.
 * Lists wrong words (up to 40) and correct/wrong counts with freq weighting.
 *
 * Usage: npx tsx --conditions=source packages/core/scripts/g2p/rule-words.ts "[RULE]=/PHONEMES/"
 * Example: npx tsx --conditions=source packages/core/scripts/g2p/rule-words.ts "[A]=/AE/"
 */
import { loadDictionary, loadFrequencies, getWordFrequency } from '@ingglish/dictionary';
import { wordToArpabetTraced } from '@ingglish/g2p';
import { stripStress } from '@ingglish/phonemes';
async function main() {
  const target = process.argv[2] || '';
  if (!target) {
    console.error('Usage: rule-words.ts "[RULE]=/PHONEMES/"');
    process.exit(1);
  }
  const dict = await loadDictionary();
  await loadFrequencies();
  console.log(`Rule: ${target}\n`);
  let shown = 0,
    correct = 0,
    wrong = 0;
  let freqCorrect = 0,
    freqWrong = 0;
  for (const word of Object.keys(dict)) {
    if (/[^a-z]/i.test(word) || word.length < 3) continue;
    const freq = getWordFrequency(word) ?? 0;
    const trace = wordToArpabetTraced(word);
    const g2p = trace.phonemes.map(stripStress).join(' ');
    const cmu = dict[word].map(stripStress).join(' ');
    for (const step of trace.steps) {
      if (step.rule === target) {
        if (g2p === cmu) {
          correct++;
          freqCorrect += freq;
        } else {
          wrong++;
          freqWrong += freq;
          if (shown < 40) {
            console.log(`  WRONG: ${word.padEnd(20)} g2p: ${g2p.padEnd(40)} cmu: ${cmu}`);
            shown++;
          }
        }
        break;
      }
    }
  }
  console.log(`\nCorrect: ${correct} (freq ${freqCorrect}), Wrong: ${wrong} (freq ${freqWrong})`);
  console.log(`Error rate: ${((wrong / (correct + wrong)) * 100).toFixed(1)}%`);
}
main().catch(console.error);
