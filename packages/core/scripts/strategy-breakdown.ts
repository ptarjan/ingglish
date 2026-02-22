/**
 * Analyze which fallback strategies produce errors and whether G2P would be better.
 * Simulates the fallback chain for each dictionary word and compares accuracy.
 *
 * Usage: npx tsx --conditions=source packages/core/scripts/strategy-breakdown.ts
 */
import { loadDictionary, getDictionary, loadFrequencies } from '@ingglish/dictionary';
import { wordToArpabet } from '@ingglish/g2p';
import { stripStress, registerFormat } from '@ingglish/phonemes';
import {
  translateAsBritish,
  translateAsCompound,
  translateWithStemming,
  isInitialism,
  translateAsAcronym,
} from '@ingglish/fallback';
import { wordToPhonetic } from '@ingglish/g2p';

registerFormat('arpabet', {
  forward: (phonemes: string[]) => phonemes.join(' '),
  joinSeparator: ' ',
  label: 'ARPAbet',
});

async function main() {
  const dict = await loadDictionary();
  await loadFrequencies();
  const words = Object.keys(dict).filter((w) => /^[a-z]+$/i.test(w) && w.length >= 3);

  const strategyErrors: Record<string, number> = {};
  const strategyCorrect: Record<string, number> = {};
  const g2pWouldFix: Record<string, string[]> = {
    stemming: [],
    compound: [],
    british: [],
  };

  for (const word of words) {
    const cmuNoStress = dict[word].map(stripStress).join(' ');

    // Temporarily hide from dictionary to simulate unknown word
    const saved = dict[word];
    delete dict[word];

    let strategy = 'g2p-pattern';
    let result = '';

    if (isInitialism(word)) {
      strategy = 'initialism';
      result = translateAsAcronym(word, 'arpabet' as 'ingglish');
    } else {
      const britishResult = translateAsBritish(word, 'arpabet' as 'ingglish');
      if (britishResult !== null && britishResult.length > 0) {
        strategy = 'british';
        result = britishResult;
      } else {
        const compoundResult = translateAsCompound(word, 'arpabet' as 'ingglish');
        if (compoundResult !== null && compoundResult.length > 0) {
          strategy = 'compound';
          result = compoundResult;
        } else {
          const stemmedResult = translateWithStemming(word, 'arpabet' as 'ingglish');
          if (stemmedResult !== null && stemmedResult.length > 0) {
            strategy = 'stemming';
            result = stemmedResult;
          } else {
            result = wordToPhonetic(word, 'arpabet' as 'ingglish');
          }
        }
      }
    }

    dict[word] = saved;

    const resultNoStress = result.split(' ').map(stripStress).join(' ');
    if (resultNoStress === cmuNoStress) {
      strategyCorrect[strategy] = (strategyCorrect[strategy] ?? 0) + 1;
    } else {
      strategyErrors[strategy] = (strategyErrors[strategy] ?? 0) + 1;

      // Would G2P pattern rules have been correct?
      const g2pResult = wordToArpabet(word).map(stripStress).join(' ');
      if (g2pResult === cmuNoStress && g2pWouldFix[strategy]) {
        g2pWouldFix[strategy].push(word);
      }
    }
  }

  console.log('=== Strategy Breakdown ===\n');
  const allStrategies = new Set([...Object.keys(strategyErrors), ...Object.keys(strategyCorrect)]);
  for (const s of [...allStrategies].sort()) {
    const correct = strategyCorrect[s] ?? 0;
    const errors = strategyErrors[s] ?? 0;
    const total = correct + errors;
    console.log(
      `  ${s.padEnd(15)} correct: ${correct.toString().padStart(6)}, errors: ${errors.toString().padStart(5)}, total: ${total.toString().padStart(6)} (${((errors / total) * 100).toFixed(1)}% error rate)`
    );
  }

  console.log(`\n=== G2P Would Fix ===`);
  for (const [strategy, words] of Object.entries(g2pWouldFix)) {
    console.log(`  From ${strategy}: ${words.length}`);
  }
  const totalFixable = Object.values(g2pWouldFix).reduce((s, w) => s + w.length, 0);
  console.log(`  Total fixable: ${totalFixable}`);

  for (const [strategy, fixableWords] of Object.entries(g2pWouldFix)) {
    if (fixableWords.length === 0) continue;
    console.log(`\n=== Sample ${strategy} errors where G2P is correct (first 20) ===`);
    for (const w of fixableWords.slice(0, 20)) {
      const cmu = dict[w].map(stripStress).join(' ');
      const g2p = wordToArpabet(w).map(stripStress).join(' ');
      console.log(`  ${w.padEnd(20)} g2p: ${g2p.padEnd(35)} want: ${cmu}`);
    }
  }
}

main().catch(console.error);
