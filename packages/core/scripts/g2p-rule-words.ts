/**
 * Show words affected by a specific NRL rule and whether G2P got them right.
 * Useful for understanding the impact of modifying or removing a rule.
 *
 * Usage:
 *   npx tsx --conditions=source packages/core/scripts/g2p-rule-words.ts "RULE_STRING" [N]
 *
 * Example:
 *   npx tsx --conditions=source packages/core/scripts/g2p-rule-words.ts "[A]=/AE/" 30
 *
 * Options:
 *   RULE_STRING  The exact NRL rule string as shown in trace output
 *   N            Max wrong words to show (default 20)
 */
import { loadDictionary, loadFrequencies } from '@ingglish/dictionary';
import { wordToArpabetTraced } from '@ingglish/g2p';
import { stripStress } from '@ingglish/phonemes';
import { parseWordLimit } from './g2p/eval-g2p.js';

async function main() {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: g2p-rule-words.ts "RULE_STRING" [N]');
    process.exit(1);
  }
  const maxShow = parseInt(process.argv[3] || '20', 10);

  const dict = await loadDictionary();
  await loadFrequencies();
  const limit = parseWordLimit();

  console.log(`Rule: ${target}\n`);
  let shown = 0,
    correct = 0,
    wrong = 0;

  let count = 0;
  for (const word of Object.keys(dict)) {
    if (/[^a-z]/i.test(word) || word.length < 3) continue;
    if (++count > limit) break;
    const trace = wordToArpabetTraced(word);
    const g2p = trace.phonemes.map(stripStress).join(' ');
    const cmu = dict[word].map(stripStress).join(' ');
    for (const step of trace.steps) {
      if (step.rule === target) {
        if (g2p === cmu) {
          correct++;
        } else {
          wrong++;
          if (shown < maxShow) {
            console.log(`  WRONG: ${word.padEnd(20)} g2p: ${g2p.padEnd(40)} cmu: ${cmu}`);
            shown++;
          }
        }
        break;
      }
    }
  }
  console.log(
    `\nCorrect: ${correct}, Wrong: ${wrong}, Rate: ${((wrong / (correct + wrong)) * 100).toFixed(1)}%`
  );
}
main().catch(console.error);
