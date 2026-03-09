#!/usr/bin/env npx vite-node
/**
 * Find candidate new rules by analyzing letter context patterns in G2P errors.
 *
 * For each wrong word, examines the letter context around the mismatch point
 * and groups errors by context pattern. Patterns that appear frequently with
 * the same "wanted" phoneme are good candidates for new rules.
 *
 * Usage: npx tsx --conditions=source packages/core/scripts/g2p/find-rules.ts [LETTER] [N]
 *   LETTER = optional single letter to analyze (default: all)
 *   N = context window size 1-4 (default: 2)
 *
 * Output: candidate rules sorted by frequency-weighted impact.
 */
import {
  parseNRLRules,
  compileRules,
  evaluateWordTraced,
  loadTestData,
  getWordFrequency,
  stripStress,
} from './eval-g2p';

export async function main() {
  const letterFilter = process.argv[2]?.toUpperCase();
  const contextSize = parseInt(process.argv[3] || '2', 10);

  console.log('Loading dictionary and frequencies...');
  const testData = await loadTestData();

  console.log('Parsing NRL rules...');
  const rules = parseNRLRules();
  const compiled = compileRules(rules);

  interface Candidate {
    context: string; // e.g., "OU[GH]T"
    wantedPhoneme: string; // what it should produce
    currentPhoneme: string; // what it currently produces
    firedRule: string; // which rule currently fires
    count: number;
    freqSum: number;
    examples: string[];
  }

  const candidates: Record<string, Candidate> = {};

  for (const word of testData.words) {
    const trace = evaluateWordTraced(compiled, word);
    const g2p = trace.phonemes.map(stripStress);
    const cmu = testData.dict[word]!.map(stripStress);

    if (g2p.join(' ') === cmu.join(' ')) continue;

    const freq = getWordFrequency(word) ?? 0;
    const upper = word.toUpperCase();

    // Walk through trace steps to find first mismatch
    let g2pIdx = 0;
    let letterPos = 0;

    for (const step of trace.steps) {
      const stepPhonemes = step.phonemes.map(stripStress);
      let mismatchFound = false;

      for (let j = 0; j < stepPhonemes.length; j++) {
        const got = g2pIdx + j < g2p.length ? g2p[g2pIdx + j] : '(end)';
        const want = g2pIdx + j < cmu.length ? cmu[g2pIdx + j] : '(end)';

        if (got !== want) {
          // Found a mismatch at this step
          const targetLetter = step.letters;

          // Only analyze the letter we're filtering for
          if (letterFilter && targetLetter[0] !== letterFilter) {
            mismatchFound = true;
            break;
          }

          // Build context string
          const pos = upper.indexOf(targetLetter, letterPos);
          if (pos >= 0) {
            const before = upper.substring(Math.max(0, pos - contextSize), pos);
            const after = upper.substring(
              pos + targetLetter.length,
              Math.min(upper.length, pos + targetLetter.length + contextSize)
            );
            const ctx = `${before}[${targetLetter}]${after}`;
            const key = `${ctx} → ${want} (was ${got})`;

            if (!candidates[key]) {
              candidates[key] = {
                context: ctx,
                wantedPhoneme: want!,
                currentPhoneme: got!,
                firedRule: step.rule,
                count: 0,
                freqSum: 0,
                examples: [],
              };
            }
            candidates[key]!.count++;
            candidates[key]!.freqSum += freq;
            if (candidates[key]!.examples.length < 5) {
              candidates[key]!.examples.push(word);
            }
          }
          mismatchFound = true;
          break;
        }
      }

      // Track letter position in the word
      const targetPos = upper.indexOf(step.letters, letterPos);
      if (targetPos >= 0) letterPos = targetPos + step.letters.length;

      g2pIdx += stepPhonemes.length;
      if (mismatchFound) break;
    }
  }

  // Sort by frequency weight
  const sorted = Object.values(candidates).sort((a, b) => b.freqSum - a.freqSum);

  console.log(`\n=== Top 60 Rule Candidates (by freq weight) ===\n`);
  console.log('freq sum | count | context → wanted (was current) | fired rule | examples');
  console.log('-'.repeat(120));

  for (const c of sorted.slice(0, 60)) {
    console.log(
      `${c.freqSum.toString().padStart(8)} | ` +
        `${c.count.toString().padStart(5)} | ` +
        `${(c.context + ' → ' + c.wantedPhoneme + ' (was ' + c.currentPhoneme + ')').padEnd(45)} | ` +
        `${c.firedRule.padEnd(25)} | ` +
        `${c.examples.join(', ')}`
    );
  }

  console.log(`\n=== Top 60 Rule Candidates (by word count) ===\n`);
  const byCount = Object.values(candidates).sort((a, b) => b.count - a.count);

  for (const c of byCount.slice(0, 60)) {
    console.log(
      `${c.count.toString().padStart(5)} words | ` +
        `freq ${c.freqSum.toString().padStart(8)} | ` +
        `${(c.context + ' → ' + c.wantedPhoneme + ' (was ' + c.currentPhoneme + ')').padEnd(45)} | ` +
        `${c.firedRule.padEnd(25)} | ` +
        `${c.examples.join(', ')}`
    );
  }
}

if (process.argv[1]?.includes('find-rules')) main().catch(console.error);
