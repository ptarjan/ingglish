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
 * Output is sorted by biggest positive delta first (best removals on top).
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
  const { ruleWords, baselineCorrect, baselineCorrectCount, baselineFreqCorrect } = traceAllWords(
    baselineCompiled,
    testData
  );

  console.log(
    `Baseline: ${baselineCorrectCount}/${testData.words.length} = ` +
      `${((baselineCorrectCount / testData.words.length) * 100).toFixed(2)}%\n`
  );

  // Test each rule removal
  interface RemovalResult {
    rule: string;
    letter: string;
    index: number;
    delta: number; // net change in correct words
    gained: number; // words that became correct
    lost: number; // words that became wrong
    freqDelta: number; // net change in freq-weighted correct
    affected: number; // total words affected by this rule
  }

  const results: RemovalResult[] = [];

  for (const letter of lettersToTest) {
    const letterRules = rules[letter];
    if (!letterRules) continue;

    for (let i = 0; i < letterRules.length; i++) {
      const ruleStr = letterRules[i]!;
      const affected = ruleWords[ruleStr];
      if (!affected || affected.length === 0) continue;

      // Build modified rule set: same as baseline but with this rule removed
      const modifiedRules = { ...rules };
      modifiedRules[letter] = [...letterRules.slice(0, i), ...letterRules.slice(i + 1)];
      const modifiedCompiled = compileRules(modifiedRules);

      // Re-evaluate only affected words
      let gained = 0;
      let lost = 0;
      let freqGained = 0;
      let freqLost = 0;

      for (const word of affected) {
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

  // Sort by delta descending (best removals first)
  results.sort((a, b) => b.delta - a.delta || b.freqDelta - a.freqDelta);

  console.log('=== Rule Removal Results (sorted by word delta) ===\n');
  console.log('delta  | +gained  -lost  | freq delta | affected | rule');
  console.log('-'.repeat(90));

  for (const r of results) {
    const deltaStr = (r.delta >= 0 ? '+' : '') + r.delta.toString();
    const freqStr = (r.freqDelta >= 0 ? '+' : '') + r.freqDelta.toString();
    console.log(
      `${deltaStr.padStart(6)} | ` +
        `+${r.gained.toString().padStart(5)} -${r.lost.toString().padStart(5)} | ` +
        `${freqStr.padStart(10)} | ` +
        `${r.affected.toString().padStart(8)} | ` +
        `${r.letter}[${r.index}] ${r.rule}`
    );
  }

  // Summary
  const positive = results.filter((r) => r.delta > 0);
  const negative = results.filter((r) => r.delta < 0);
  const neutral = results.filter((r) => r.delta === 0);
  console.log(
    `\nSummary: ${positive.length} beneficial, ${neutral.length} neutral, ${negative.length} harmful removals`
  );

  if (positive.length > 0) {
    console.log(
      `\nBest removal: ${positive[0]!.rule} (${positive[0]!.letter}[${positive[0]!.index}]) → +${positive[0]!.delta} words`
    );
  }
}

main().catch(console.error);
