/**
 * Automated hill-climbing optimizer for NRL G2P pattern rules.
 *
 * Iteratively applies the best single-rule changes (removals, adjacent swaps)
 * until no further improvements are found. Each round:
 *   1. Tests removing each rule → picks best positive-delta removal
 *   2. Tests swapping each adjacent pair → picks best positive-delta swap
 *   3. Applies the single best change from either category
 *   4. Repeats until no improvement found
 *
 * Outputs a summary of all applied changes and the final accuracy.
 *
 * Usage: npx tsx --conditions=source packages/core/scripts/g2p/hill-climb.ts [--apply]
 *   --apply: actually write changes to g2p-rules.ts (default: dry run)
 *
 * TODO: Also test moving rules to non-adjacent positions (e.g. rule at index 5 → index 0).
 * TODO: Test adding new rules from a candidate pool.
 * TODO: Test cross-letter reordering.
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
  type TestData,
} from './eval-g2p';

interface Change {
  type: 'removal' | 'swap';
  letter: string;
  description: string;
  delta: number;
  freqDelta: number;
  gained: number;
  lost: number;
}

function findBestRemoval(
  rules: Record<string, string[]>,
  testData: TestData,
  baselineCompiled: CompiledRuleSet,
  ruleWords: Record<string, string[]>,
  baselineCorrect: Set<string>
): Change | null {
  let best: Change | null = null;

  for (const [letter, letterRules] of Object.entries(rules)) {
    for (let i = 0; i < letterRules.length; i++) {
      const ruleStr = letterRules[i]!;
      const affected = ruleWords[ruleStr];
      if (!affected || affected.length === 0) continue;

      const modifiedRules = { ...rules };
      modifiedRules[letter] = [...letterRules.slice(0, i), ...letterRules.slice(i + 1)];
      const modifiedCompiled = compileRules(modifiedRules);

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

      const delta = gained - lost;
      if (
        delta > 0 &&
        (best === null ||
          delta > best.delta ||
          (delta === best.delta && freqGained - freqLost > best.freqDelta))
      ) {
        best = {
          type: 'removal',
          letter,
          description: `Remove ${letter}[${i}] ${ruleStr}`,
          delta,
          freqDelta: freqGained - freqLost,
          gained,
          lost,
        };
      }
    }
  }

  return best;
}

function findBestSwap(
  rules: Record<string, string[]>,
  testData: TestData,
  baselineCompiled: CompiledRuleSet,
  ruleWords: Record<string, string[]>,
  baselineCorrect: Set<string>
): Change | null {
  let best: Change | null = null;

  for (const [letter, letterRules] of Object.entries(rules)) {
    if (letterRules.length < 2) continue;

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
      if (
        delta > 0 &&
        (best === null ||
          delta > best.delta ||
          (delta === best.delta && freqGained - freqLost > best.freqDelta))
      ) {
        best = {
          type: 'swap',
          letter,
          description: `Swap ${letter}[${i}↔${i + 1}]: move "${ruleB}" before "${ruleA}"`,
          delta,
          freqDelta: freqGained - freqLost,
          gained,
          lost,
        };
      }
    }
  }

  return best;
}

function applyChange(rules: Record<string, string[]>, change: Change): Record<string, string[]> {
  const newRules = { ...rules };

  if (change.type === 'removal') {
    // Parse the index from the description
    const m = /\[(\d+)\]/.exec(change.description);
    if (!m) throw new Error('Cannot parse removal index from: ' + change.description);
    const idx = parseInt(m[1]!, 10);
    const letterRules = [...rules[change.letter]!];
    letterRules.splice(idx, 1);
    newRules[change.letter] = letterRules;
  } else if (change.type === 'swap') {
    const m = /\[(\d+)↔(\d+)\]/.exec(change.description);
    if (!m) throw new Error('Cannot parse swap indices from: ' + change.description);
    const i = parseInt(m[1]!, 10);
    const j = parseInt(m[2]!, 10);
    const letterRules = [...rules[change.letter]!];
    [letterRules[i], letterRules[j]] = [letterRules[j]!, letterRules[i]!];
    newRules[change.letter] = letterRules;
  }

  return newRules;
}

async function main() {
  const doApply = process.argv.includes('--apply');

  console.log('Loading dictionary and frequencies...');
  const testData = await loadTestData();

  console.log('Parsing NRL rules...');
  let rules = parseNRLRules();

  const appliedChanges: Change[] = [];
  let round = 0;

  while (true) {
    round++;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Round ${round}`);
    console.log('='.repeat(60));

    const baselineCompiled = compileRules(rules);
    const { ruleWords, baselineCorrect, baselineCorrectCount, baselineFreqCorrect } = traceAllWords(
      baselineCompiled,
      testData
    );

    const totalRules = Object.values(rules).reduce((s, r) => s + r.length, 0);
    console.log(
      `Rules: ${totalRules}, Accuracy: ${baselineCorrectCount}/${testData.words.length} = ${((baselineCorrectCount / testData.words.length) * 100).toFixed(2)}%`
    );

    console.log('Testing removals...');
    const bestRemoval = findBestRemoval(
      rules,
      testData,
      baselineCompiled,
      ruleWords,
      baselineCorrect
    );
    if (bestRemoval) {
      console.log(
        `  Best removal: ${bestRemoval.description} → +${bestRemoval.delta} words (freq ${bestRemoval.freqDelta >= 0 ? '+' : ''}${bestRemoval.freqDelta})`
      );
    } else {
      console.log('  No beneficial removals found');
    }

    console.log('Testing swaps...');
    const bestSwap = findBestSwap(rules, testData, baselineCompiled, ruleWords, baselineCorrect);
    if (bestSwap) {
      console.log(
        `  Best swap: ${bestSwap.description} → +${bestSwap.delta} words (freq ${bestSwap.freqDelta >= 0 ? '+' : ''}${bestSwap.freqDelta})`
      );
    } else {
      console.log('  No beneficial swaps found');
    }

    // Pick the best change
    let best: Change | null = null;
    if (bestRemoval && bestSwap) {
      best =
        bestRemoval.delta > bestSwap.delta
          ? bestRemoval
          : bestSwap.delta > bestRemoval.delta
            ? bestSwap
            : bestRemoval.freqDelta >= bestSwap.freqDelta
              ? bestRemoval
              : bestSwap;
    } else {
      best = bestRemoval ?? bestSwap;
    }

    if (!best) {
      console.log('\nNo improvements found. Hill-climbing complete.');
      break;
    }

    console.log(`\n→ Applying: ${best.description} (+${best.delta} words)`);
    rules = applyChange(rules, best);
    appliedChanges.push(best);
  }

  // Final summary
  const finalCompiled = compileRules(rules);
  const { baselineCorrectCount: finalCorrect } = traceAllWords(finalCompiled, testData);
  const totalRules = Object.values(rules).reduce((s, r) => s + r.length, 0);

  console.log(`\n${'='.repeat(60)}`);
  console.log('HILL-CLIMBING SUMMARY');
  console.log('='.repeat(60));
  console.log(`Rounds: ${appliedChanges.length}`);
  console.log(`Final rules: ${totalRules}`);
  console.log(
    `Final accuracy: ${finalCorrect}/${testData.words.length} = ${((finalCorrect / testData.words.length) * 100).toFixed(2)}%`
  );
  console.log(`\nApplied changes:`);
  for (const c of appliedChanges) {
    console.log(`  +${c.delta} words: ${c.description}`);
  }

  if (doApply) {
    console.log('\n--apply flag set: writing changes to g2p-rules.ts is not yet implemented.');
    console.log('Use the output above to manually apply the changes.');
  }
}

main().catch(console.error);
