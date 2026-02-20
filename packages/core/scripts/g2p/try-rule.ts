/**
 * Test the impact of adding or modifying a specific NRL rule.
 *
 * Inserts a new rule at a specified position and measures the accuracy delta.
 * Also shows which words are gained/lost.
 *
 * Usage: npx tsx --conditions=source packages/core/scripts/g2p/try-rule.ts <LETTER> <INDEX> "<RULE>"
 *   LETTER = letter section to insert into (e.g., A)
 *   INDEX  = position to insert at (0 = first in section, "end" = last)
 *   RULE   = the NRL rule string (e.g., "[OUGH]T=/AO T/")
 *
 * Examples:
 *   npx tsx --conditions=source packages/core/scripts/g2p/try-rule.ts A 0 "[ASTE] =/EY S T/"
 *   npx tsx --conditions=source packages/core/scripts/g2p/try-rule.ts O end "[OUGH]T=/AO T/"
 */
import {
  parseNRLRules,
  compileRules,
  evaluateWordTraced,
  measureAccuracy,
  loadTestData,
  getWordFrequency,
  stripStress,
} from './eval-g2p';

async function main() {
  const letter = process.argv[2]?.toUpperCase();
  const indexArg = process.argv[3];
  const ruleStr = process.argv[4];

  if (!letter || !indexArg || !ruleStr) {
    console.error('Usage: try-rule.ts <LETTER> <INDEX> "<RULE>"');
    console.error('  LETTER = letter section (e.g., A)');
    console.error('  INDEX  = position (0=first, "end"=last)');
    console.error('  RULE   = NRL rule string (e.g., "[OUGH]T=/AO T/")');
    process.exit(1);
  }

  console.log('Loading dictionary and frequencies...');
  const testData = await loadTestData();

  console.log('Parsing NRL rules...');
  const rules = parseNRLRules();

  if (!rules[letter]) {
    console.error(`No rules found for letter: ${letter}`);
    process.exit(1);
  }

  const letterRules = rules[letter]!;
  const index = indexArg === 'end' ? letterRules.length : parseInt(indexArg, 10);

  console.log(`\nInserting rule at ${letter}[${index}]: ${ruleStr}`);
  console.log(`(Section has ${letterRules.length} existing rules)\n`);

  // Baseline
  console.log('Measuring baseline...');
  const baselineCompiled = compileRules(rules);
  const baseline = measureAccuracy(baselineCompiled, testData);

  // Modified
  const modifiedRules = { ...rules };
  modifiedRules[letter] = [...letterRules.slice(0, index), ruleStr, ...letterRules.slice(index)];
  console.log('Measuring with new rule...');
  const modifiedCompiled = compileRules(modifiedRules);
  const modified = measureAccuracy(modifiedCompiled, testData);

  const delta = modified.correct - baseline.correct;
  const freqDelta = modified.freqCorrect - baseline.freqCorrect;

  console.log(
    `Baseline:  ${baseline.correct}/${baseline.total} = ${baseline.unweightedPct.toFixed(2)}%`
  );
  console.log(
    `Modified:  ${modified.correct}/${modified.total} = ${modified.unweightedPct.toFixed(2)}%`
  );
  console.log(
    `Delta:     ${delta >= 0 ? '+' : ''}${delta} words, freq ${freqDelta >= 0 ? '+' : ''}${freqDelta}`
  );

  // Show specific words gained/lost
  console.log('\nWord-level changes:');
  let gained = 0;
  let lost = 0;

  for (const word of testData.words) {
    const baseG2P = evaluateWordTraced(baselineCompiled, word).phonemes.map(stripStress).join(' ');
    const modG2P = evaluateWordTraced(modifiedCompiled, word).phonemes.map(stripStress).join(' ');
    const cmu = testData.dict[word]!.map(stripStress).join(' ');

    if (baseG2P === modG2P) continue; // no change for this word

    const wasCorrect = baseG2P === cmu;
    const nowCorrect = modG2P === cmu;
    const freq = getWordFrequency(word) ?? 0;

    if (!wasCorrect && nowCorrect) {
      gained++;
      if (gained <= 20) console.log(`  + FIXED: ${word.padEnd(20)} freq=${freq}`);
    } else if (wasCorrect && !nowCorrect) {
      lost++;
      if (lost <= 20)
        console.log(`  - BROKE: ${word.padEnd(20)} freq=${freq}  was: ${baseG2P}  now: ${modG2P}`);
    } else {
      // Changed but still wrong (or was wrong and still wrong differently)
    }
  }

  if (gained > 20) console.log(`  ... and ${gained - 20} more gained`);
  if (lost > 20) console.log(`  ... and ${lost - 20} more lost`);
  console.log(`\nTotal: +${gained} gained, -${lost} lost = net ${delta >= 0 ? '+' : ''}${delta}`);
}

main().catch(console.error);
