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
 * Output is sorted by biggest positive delta first (best reorders on top).
 *
 * TODO: Also test moving rules to other positions (not just adjacent swaps).
 * TODO: Test promoting rules from later letter sections (cross-letter reorder).
 */
import {
  parseNRLRules,
  compileRules,
  evaluateWordTraced,
  traceAllWords,
  loadTestData,
  getWordFrequency,
  stripStress,
  type CompiledRuleSet,
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
  const { ruleWords, baselineCorrect, baselineCorrectCount } = traceAllWords(
    baselineCompiled,
    testData
  );

  console.log(
    `Baseline: ${baselineCorrectCount}/${testData.words.length} = ` +
      `${((baselineCorrectCount / testData.words.length) * 100).toFixed(2)}%\n`
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

    // For each adjacent pair (i, i+1), try swapping
    for (let i = 0; i < letterRules.length - 1; i++) {
      const ruleA = letterRules[i]!;
      const ruleB = letterRules[i + 1]!;

      // Get affected words: union of words using either rule
      const wordsA = new Set(ruleWords[ruleA] ?? []);
      const wordsB = new Set(ruleWords[ruleB] ?? []);
      const affectedSet = new Set([...wordsA, ...wordsB]);

      if (affectedSet.size === 0) continue;

      // Build modified rule set with adjacent swap
      const swapped = [...letterRules];
      swapped[i] = ruleB;
      swapped[i + 1] = ruleA;
      const modifiedRules = { ...rules, [letter]: swapped };
      const modifiedCompiled = compileRules(modifiedRules);

      let gained = 0;
      let lost = 0;
      let freqGained = 0;
      let freqLost = 0;

      for (const word of affectedSet) {
        const wasCorrect = baselineCorrect.has(word);
        const newTrace = evaluateWordTraced(modifiedCompiled, word);
        const newG2P = newTrace.phonemes.map(stripStress).join(' ');
        const cmu = testData.dict[word]!.map(stripStress).join(' ');
        const nowCorrect = newG2P === cmu;
        const freq = getWordFrequency(word) ?? 0;

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
      if (delta !== 0 || freqGained - freqLost !== 0) {
        results.push({
          letter,
          fromIdx: i + 1,
          toIdx: i,
          ruleFrom: ruleB,
          ruleTo: ruleA,
          delta,
          gained,
          lost,
          freqDelta: freqGained - freqLost,
          affected: affectedSet.size,
        });
      }
    }
  }

  // Sort by delta descending
  results.sort((a, b) => b.delta - a.delta || b.freqDelta - a.freqDelta);

  console.log('\n=== Adjacent Swap Results (sorted by word delta) ===\n');
  console.log('delta  | +gained  -lost  | freq delta | affected | swap');
  console.log('-'.repeat(100));

  for (const r of results) {
    const deltaStr = (r.delta >= 0 ? '+' : '') + r.delta.toString();
    const freqStr = (r.freqDelta >= 0 ? '+' : '') + r.freqDelta.toString();
    console.log(
      `${deltaStr.padStart(6)} | ` +
        `+${r.gained.toString().padStart(5)} -${r.lost.toString().padStart(5)} | ` +
        `${freqStr.padStart(10)} | ` +
        `${r.affected.toString().padStart(8)} | ` +
        `${r.letter}[${r.fromIdx}→${r.toIdx}] move "${r.ruleFrom}" before "${r.ruleTo}"`
    );
  }

  const positive = results.filter((r) => r.delta > 0);
  const negative = results.filter((r) => r.delta < 0);
  console.log(`\nSummary: ${positive.length} beneficial, ${negative.length} harmful swaps`);
  console.log(`(${results.length} swaps had non-zero effect)`);

  if (positive.length > 0) {
    console.log(
      `\nBest swap: ${positive[0]!.letter}[${positive[0]!.fromIdx}→${positive[0]!.toIdx}] → +${positive[0]!.delta} words`
    );
  }
}

main().catch(console.error);
