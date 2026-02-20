/**
 * Systematically test reordering NRL rules and measure accuracy delta.
 *
 * For each pair of rules in a letter section, tries moving the later rule
 * before the earlier one. Only tests pairs where both rules have overlapping
 * word sets (meaning reorder could actually change outcomes).
 *
 * Usage: npx tsx --conditions=source packages/core/scripts/g2p/try-reorder.ts [LETTER]
 *   LETTER = optional single letter to test (default: all letters)
 *
 * Output is sorted by biggest positive freq delta first (best reorders on top).
 *
 * TODO: Also test moving rules to other positions (not just adjacent swaps).
 * TODO: Test promoting rules from later letter sections (cross-letter reorder).
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

  interface ReorderResult {
    letter: string;
    fromIdx: number;
    toIdx: number;
    ruleFrom: string;
    ruleTo: string;
    delta: number;
    gained: number;
    lost: number;
    freqDelta: number;
    affected: number;
  }

  const results: ReorderResult[] = [];

  for (const letter of lettersToTest) {
    const letterRules = rules[letter];
    if (!letterRules || letterRules.length < 2) continue;

    console.log(`Testing ${letter} (${letterRules.length} rules)...`);

    for (let i = 0; i < letterRules.length - 1; i++) {
      const ruleA = letterRules[i]!;
      const ruleB = letterRules[i + 1]!;

      const wordsA = new Set(ruleWords[ruleA] ?? []);
      const wordsB = new Set(ruleWords[ruleB] ?? []);
      const affectedSet = new Set([...wordsA, ...wordsB]);

      if (affectedSet.size === 0) continue;

      const swapped = [...letterRules];
      swapped[i] = ruleB;
      swapped[i + 1] = ruleA;
      const modifiedCompiled = patchCompiledRules(baselineCompiled, letter, swapped);

      let gained = 0;
      let lost = 0;
      let freqGained = 0;
      let freqLost = 0;

      for (const word of affectedSet) {
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

      const delta = gained - lost;
      const freqDelta = freqGained - freqLost;
      if (delta !== 0 || freqDelta !== 0) {
        results.push({
          letter,
          fromIdx: i + 1,
          toIdx: i,
          ruleFrom: ruleB,
          ruleTo: ruleA,
          delta,
          gained,
          lost,
          freqDelta,
          affected: affectedSet.size,
        });
      }
    }
  }

  // Sort by freq delta descending (primary), then word delta (secondary)
  results.sort((a, b) => b.freqDelta - a.freqDelta || b.delta - a.delta);

  console.log('\n=== Adjacent Swap Results (sorted by freq delta) ===\n');
  console.log('freq delta | delta  | +gained  -lost  | affected | swap');
  console.log('-'.repeat(110));

  for (const r of results) {
    const freqStr = (r.freqDelta >= 0 ? '+' : '') + r.freqDelta.toString();
    const deltaStr = (r.delta >= 0 ? '+' : '') + r.delta.toString();
    console.log(
      `${freqStr.padStart(10)} | ` +
        `${deltaStr.padStart(6)} | ` +
        `+${r.gained.toString().padStart(5)} -${r.lost.toString().padStart(5)} | ` +
        `${r.affected.toString().padStart(8)} | ` +
        `${r.letter}[${r.fromIdx}→${r.toIdx}] move "${r.ruleFrom}" before "${r.ruleTo}"`
    );
  }

  const freqPositive = results.filter((r) => r.freqDelta > 0);
  const freqNegative = results.filter((r) => r.freqDelta < 0);
  console.log(
    `\nSummary: ${freqPositive.length} freq-positive, ${freqNegative.length} freq-negative swaps`
  );
  console.log(`(${results.length} swaps had non-zero effect)`);

  if (freqPositive.length > 0) {
    console.log(
      `\nBest swap: ${freqPositive[0]!.letter}[${freqPositive[0]!.fromIdx}→${freqPositive[0]!.toIdx}] → freq +${freqPositive[0]!.freqDelta}, +${freqPositive[0]!.delta} words`
    );
  }
}

main().catch(console.error);
