#!/usr/bin/env npx vite-node
/**
 * Systematically test removing each NRL rule and measure accuracy delta.
 *
 * For each rule, removes it from the rule set, re-evaluates only the
 * affected words (words where that rule fired), and reports the net
 * change in correct words and frequency-weighted accuracy.
 *
 * Usage: npx tsx --conditions=source packages/core/scripts/g2p/try-removal.ts [LETTER]
 *   LETTER = optional single letter to test (default: all letters)
 *
 * Output is sorted by biggest positive freq delta first (best removals on top).
 */
import {
  parseNRLRules,
  compileRules,
  patchCompiledRules,
  evaluateWordTraced,
  traceAllWords,
  loadTestData,
  stripStress,
} from './eval-g2p';

async function main() {
  const letterFilter = process.argv[2]?.toUpperCase();

  console.log('Loading dictionary and frequencies...');
  const testData = await loadTestData();

  console.log('Parsing NRL rules...');
  const rules = parseNRLRules();

  const lettersToTest = letterFilter ? [letterFilter] : Object.keys(rules).sort();

  console.log('Compiling baseline rules...');
  const baselineCompiled = compileRules(rules);

  console.log('Tracing all words against baseline...');
  const { ruleWords, baselineCorrect, baselineCorrectCount, baselineFreqCorrect } = traceAllWords(
    baselineCompiled,
    testData
  );

  const freqTotal = Object.values(testData.freqs).reduce((s, f) => s + f, 0);
  console.log(
    `Baseline: ${baselineCorrectCount}/${testData.words.length} = ` +
      `${((baselineCorrectCount / testData.words.length) * 100).toFixed(2)}% words, ` +
      `${((baselineFreqCorrect / freqTotal) * 100).toFixed(2)}% freq\n`
  );

  interface RemovalResult {
    rule: string;
    letter: string;
    index: number;
    delta: number;
    gained: number;
    lost: number;
    freqDelta: number;
    affected: number;
  }

  const results: RemovalResult[] = [];

  for (const letter of lettersToTest) {
    const letterRules = rules[letter];
    if (!letterRules) continue;

    for (let i = 0; i < letterRules.length; i++) {
      const ruleStr = letterRules[i]!;
      const affected = ruleWords[ruleStr];
      if (!affected || affected.length === 0) continue;

      const newLetterRules = [...letterRules.slice(0, i), ...letterRules.slice(i + 1)];
      const modifiedCompiled = patchCompiledRules(baselineCompiled, letter, newLetterRules);

      let gained = 0;
      let lost = 0;
      let freqGained = 0;
      let freqLost = 0;

      for (const word of affected) {
        const wasCorrect = baselineCorrect.has(word);
        const newTrace = evaluateWordTraced(modifiedCompiled, word);
        const newG2P = newTrace.phonemes.map(stripStress).join(' ');
        const nowCorrect = newG2P === testData.cmuStressless[word];
        const freq = testData.freqs[word]!;

        if (!wasCorrect && nowCorrect) {
          gained++;
          freqGained += freq;
        }
        if (wasCorrect && !nowCorrect) {
          lost++;
          freqLost += freq;
        }
      }

      results.push({
        rule: ruleStr,
        letter,
        index: i,
        delta: gained - lost,
        gained,
        lost,
        freqDelta: freqGained - freqLost,
        affected: affected.length,
      });
    }
  }

  // Sort by freq delta descending (primary), then word delta (secondary)
  results.sort((a, b) => b.freqDelta - a.freqDelta || b.delta - a.delta);

  console.log('=== Rule Removal Results (sorted by freq delta) ===\n');
  console.log('freq delta | delta  | +gained  -lost  | affected | rule');
  console.log('-'.repeat(95));

  for (const r of results) {
    const freqStr = (r.freqDelta >= 0 ? '+' : '') + r.freqDelta.toString();
    const deltaStr = (r.delta >= 0 ? '+' : '') + r.delta.toString();
    console.log(
      `${freqStr.padStart(10)} | ` +
        `${deltaStr.padStart(6)} | ` +
        `+${r.gained.toString().padStart(5)} -${r.lost.toString().padStart(5)} | ` +
        `${r.affected.toString().padStart(8)} | ` +
        `${r.letter}[${r.index}] ${r.rule}`
    );
  }

  const freqPositive = results.filter((r) => r.freqDelta > 0);
  const freqNeutral = results.filter((r) => r.freqDelta === 0);
  const freqNegative = results.filter((r) => r.freqDelta < 0);
  console.log(
    `\nSummary: ${freqPositive.length} freq-positive, ${freqNeutral.length} neutral, ${freqNegative.length} freq-negative removals`
  );

  if (freqPositive.length > 0) {
    console.log(
      `\nBest removal: ${freqPositive[0]!.rule} (${freqPositive[0]!.letter}[${freqPositive[0]!.index}]) → freq +${freqPositive[0]!.freqDelta}, +${freqPositive[0]!.delta} words`
    );
  }
}

main().catch(console.error);
