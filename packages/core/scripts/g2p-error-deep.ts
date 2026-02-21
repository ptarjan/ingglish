/**
 * Deep analysis of G2P single-phoneme substitution errors using Levenshtein alignment.
 *
 * For each word where G2P disagrees with CMU, aligns the two phoneme sequences,
 * finds single-substitution errors, maps them back to approximate letter positions,
 * and reports the top (letter_context, wrong_phoneme, correct_phoneme) triples.
 *
 * Usage:
 *   cd /Users/pt/github/ingglish2
 *   npx tsx --conditions=source packages/core/scripts/g2p-error-deep.ts
 */

import { loadDictionary } from '@ingglish/dictionary';
import { wordToArpabet } from '@ingglish/g2p';
import { stripStress } from '@ingglish/phonemes';

// --- Levenshtein alignment ---

type AlignOp = 'match' | 'sub' | 'ins' | 'del';

interface Alignment {
  ops: AlignOp[];
  aIndices: (number | null)[]; // index in seq a (null for insertions)
  bIndices: (number | null)[]; // index in seq b (null for deletions)
  distance: number;
}

function levenshteinAlign(a: string[], b: string[]): Alignment {
  const m = a.length;
  const n = b.length;

  // dp[i][j] = edit distance between a[0..i-1] and b[0..j-1]
  const dp: number[][] = [];
  for (let i = 0; i <= m; i++) {
    dp[i] = new Array(n + 1);
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrace to get alignment
  const ops: AlignOp[] = [];
  const aIndices: (number | null)[] = [];
  const bIndices: (number | null)[] = [];

  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1] && dp[i][j] === dp[i - 1][j - 1]) {
      ops.push('match');
      aIndices.push(i - 1);
      bIndices.push(j - 1);
      i--;
      j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      ops.push('sub');
      aIndices.push(i - 1);
      bIndices.push(j - 1);
      i--;
      j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      ops.push('del');
      aIndices.push(i - 1);
      bIndices.push(null);
      i--;
    } else {
      ops.push('ins');
      aIndices.push(null);
      bIndices.push(j - 1);
      j--;
    }
  }

  ops.reverse();
  aIndices.reverse();
  bIndices.reverse();

  return { ops, aIndices, bIndices, distance: dp[m][n] };
}

// --- Main analysis ---

interface SubstitutionRecord {
  context: string; // e.g. "c_a_t" (prev + letter + next)
  wrongPhoneme: string; // what G2P produced
  correctPhoneme: string; // what CMU says
  count: number;
  samples: string[]; // example words (up to 5)
}

async function main() {
  const dict = await loadDictionary();
  const words = Object.keys(dict);

  // Map: "context|wrong|correct" -> SubstitutionRecord
  const substitutions = new Map<string, SubstitutionRecord>();

  let totalWords = 0;
  let errorWords = 0;
  let dist1Words = 0;
  let totalSubstitutions = 0;

  for (const word of words) {
    // Only a-z, length >= 3
    if (/[^a-z]/.test(word) || word.length < 3) continue;
    totalWords++;

    const cmuPhonemes = dict[word];
    const g2pPhonemes = wordToArpabet(word);

    const cmuNoStress = cmuPhonemes.map(stripStress);
    const g2pNoStress = g2pPhonemes.map(stripStress);

    if (cmuNoStress.join(' ') === g2pNoStress.join(' ')) continue;
    errorWords++;

    // Align G2P (a) against CMU (b)
    const alignment = levenshteinAlign(g2pNoStress, cmuNoStress);

    // Only consider distance-1 substitutions
    if (alignment.distance !== 1) continue;

    // Find the single substitution
    let subIdx = -1;
    for (let k = 0; k < alignment.ops.length; k++) {
      if (alignment.ops[k] === 'sub') {
        subIdx = k;
        break;
      }
    }
    if (subIdx === -1) continue; // It was an insert or delete, not a substitution

    dist1Words++;

    const g2pIdx = alignment.aIndices[subIdx]!;
    const cmuIdx = alignment.bIndices[subIdx]!;
    const wrongPhoneme = g2pNoStress[g2pIdx];
    const correctPhoneme = cmuNoStress[cmuIdx];

    // Map phoneme position back to approximate letter position
    // Simple heuristic: position ratio
    const letterPos = Math.round((g2pIdx / g2pNoStress.length) * word.length);
    const clampedPos = Math.min(Math.max(letterPos, 0), word.length - 1);

    const letter = word[clampedPos];
    const prevLetter = clampedPos > 0 ? word[clampedPos - 1] : '^';
    const nextLetter = clampedPos < word.length - 1 ? word[clampedPos + 1] : '$';
    const context = `${prevLetter}${letter}${nextLetter}`;

    const key = `${context}|${wrongPhoneme}|${correctPhoneme}`;
    totalSubstitutions++;

    const existing = substitutions.get(key);
    if (existing) {
      existing.count++;
      if (existing.samples.length < 5) {
        existing.samples.push(word);
      }
    } else {
      substitutions.set(key, {
        context,
        wrongPhoneme,
        correctPhoneme,
        count: 1,
        samples: [word],
      });
    }
  }

  // Sort by count descending
  const sorted = [...substitutions.values()].sort((a, b) => b.count - a.count);

  // Print summary
  console.log('=== G2P DEEP ERROR ANALYSIS (Levenshtein Alignment) ===\n');
  console.log(`Total words analyzed:       ${totalWords}`);
  console.log(
    `Words with G2P errors:      ${errorWords} (${((errorWords / totalWords) * 100).toFixed(1)}%)`
  );
  console.log(
    `Words with dist-1 sub:      ${dist1Words} (${((dist1Words / totalWords) * 100).toFixed(1)}%)`
  );
  console.log(`Unique context triples:     ${substitutions.size}`);
  console.log(`Total substitution errors:  ${totalSubstitutions}\n`);

  // Also aggregate by just wrong→correct (ignoring context) for overview
  const bySub = new Map<string, number>();
  for (const rec of sorted) {
    const subKey = `${rec.wrongPhoneme} -> ${rec.correctPhoneme}`;
    bySub.set(subKey, (bySub.get(subKey) || 0) + rec.count);
  }
  const sortedSubs = [...bySub.entries()].sort((a, b) => b[1] - a[1]);

  console.log('--- Top 20 substitution types (ignoring letter context) ---\n');
  console.log('  Rank  Count   Substitution');
  console.log('  ----  -----   ------------');
  for (let i = 0; i < Math.min(20, sortedSubs.length); i++) {
    const [sub, count] = sortedSubs[i];
    console.log(`  ${String(i + 1).padStart(3)}.  ${String(count).padStart(5)}   ${sub}`);
  }

  // Print top 50 context triples
  console.log('\n--- Top 50 (letter_context, wrong_phoneme, correct_phoneme) triples ---\n');
  console.log('  Rank  Count   Context  Wrong     Correct   Samples');
  console.log('  ----  -----   -------  -----     -------   -------');
  for (let i = 0; i < Math.min(50, sorted.length); i++) {
    const rec = sorted[i];
    const contextDisplay = rec.context.replace('^', '^').split('').join('');
    console.log(
      `  ${String(i + 1).padStart(3)}.  ${String(rec.count).padStart(5)}   ${contextDisplay.padEnd(7)}  ${rec.wrongPhoneme.padEnd(9)} ${rec.correctPhoneme.padEnd(9)} ${rec.samples.join(', ')}`
    );
  }
}

main().catch(console.error);
