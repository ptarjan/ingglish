/**
 * For words where a default fallback rule fires and is wrong,
 * analyze the surrounding letter context to find new rules.
 * Useful for discovering missing NRL patterns.
 *
 * Usage: npx tsx --conditions=source packages/core/scripts/g2p/default-errors.ts
 */
import { loadDictionary, loadFrequencies, getWordFrequency } from '@ingglish/dictionary';
import { wordToArpabetTraced } from '@ingglish/g2p';
import { stripStress } from '@ingglish/phonemes';

async function main() {
  const dict = await loadDictionary();
  await loadFrequencies();

  const contextErrors: Record<string, Record<string, { count: number; freqSum: number }>> = {};

  for (const word of Object.keys(dict)) {
    if (/[^a-z]/i.test(word) || word.length < 3) continue;

    const freq = getWordFrequency(word) ?? 0;
    const cmu = dict[word].map(stripStress);
    const trace = wordToArpabetTraced(word);
    const g2p = trace.phonemes.map(stripStress);
    if (g2p.join(' ') === cmu.join(' ')) continue;

    let g2pIdx = 0;
    const upper = word.toUpperCase();
    let letterIdx = 0;

    for (const step of trace.steps) {
      const stepP = step.phonemes.map(stripStress);
      let stepWrong = false;

      for (let j = 0; j < stepP.length; j++) {
        if (g2pIdx + j >= cmu.length || stepP[j] !== cmu[g2pIdx + j]) {
          stepWrong = true;
          break;
        }
      }

      const defaultRules = ['[A]=/AE/', '[E]=/EH/', '[I]=/IH/', '[O]=/AA/', '[U]=/Y UW/'];
      if (stepWrong && defaultRules.includes(step.rule)) {
        const letter = step.letters;
        const pos = upper.indexOf(letter, letterIdx);
        if (pos >= 0) {
          const before = upper.substring(Math.max(0, pos - 2), pos);
          const after = upper.substring(pos + letter.length, pos + letter.length + 2);
          const ctx = `${before}[${letter}]${after}`;
          const wantedPhoneme = g2pIdx < cmu.length ? cmu[g2pIdx] : '?';

          if (!contextErrors[step.rule]) contextErrors[step.rule] = {};
          const key = `${ctx} → should be ${wantedPhoneme}`;
          if (!contextErrors[step.rule][key])
            contextErrors[step.rule][key] = { count: 0, freqSum: 0 };
          contextErrors[step.rule][key].count++;
          contextErrors[step.rule][key].freqSum += freq;
        }
      }

      letterIdx = upper.indexOf(step.letters, letterIdx) + step.letters.length;
      g2pIdx += stepP.length;
    }
  }

  for (const [rule, errors] of Object.entries(contextErrors)) {
    console.log(`\n=== ${rule} — Top 40 wrong contexts (by freq) ===\n`);
    const sorted = Object.entries(errors).sort((a, b) => b[1].freqSum - a[1].freqSum);
    for (const [ctx, { count, freqSum }] of sorted.slice(0, 40)) {
      console.log(
        `  ${count.toString().padStart(4)} words (freq ${freqSum.toString().padStart(7)}) : ${ctx}`
      );
    }
  }
}

main().catch(console.error);
