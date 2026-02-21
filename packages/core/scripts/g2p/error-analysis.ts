#!/usr/bin/env npx vite-node
/**
 * Detailed G2P error analysis — identifies the highest-impact fixable patterns.
 *
 * Uses Levenshtein alignment to find ALL phoneme-level errors (not just the first),
 * then traces each error back to the specific NRL rule that produced it.
 * Categorizes errors and frequency-weights them using SUBTLEX data.
 *
 * Usage:
 *   cd /Users/pt/github/ingglish2
 *   npx tsx --conditions=source packages/core/scripts/g2p-error-analysis.ts
 */

import { loadDictionary, loadFrequencies, getWordFrequency } from '@ingglish/dictionary';
import { wordToArpabetTraced } from '@ingglish/g2p';
import type { G2PTrace, G2PTraceStep } from '@ingglish/g2p';
import { stripStress } from '@ingglish/phonemes';

// ---------------------------------------------------------------------------
// Levenshtein alignment
// ---------------------------------------------------------------------------

type AlignOp = 'match' | 'sub' | 'ins' | 'del';

interface AlignmentEntry {
  op: AlignOp;
  aIdx: number | null; // index in G2P phonemes (null for insertions)
  bIdx: number | null; // index in CMU phonemes (null for deletions)
}

function levenshteinAlign(
  a: string[],
  b: string[]
): { entries: AlignmentEntry[]; distance: number } {
  const m = a.length;
  const n = b.length;

  const dp: number[][] = [];
  for (let i = 0; i <= m; i++) {
    dp[i] = new Array(n + 1);
    dp[i]![0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0]![j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i]![j] = dp[i - 1]![j - 1]!;
      } else {
        dp[i]![j] = 1 + Math.min(dp[i - 1]![j - 1]!, dp[i - 1]![j]!, dp[i]![j - 1]!);
      }
    }
  }

  // Backtrace
  const entries: AlignmentEntry[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1] && dp[i]![j]! === dp[i - 1]![j - 1]!) {
      entries.push({ op: 'match', aIdx: i - 1, bIdx: j - 1 });
      i--;
      j--;
    } else if (i > 0 && j > 0 && dp[i]![j]! === dp[i - 1]![j - 1]! + 1) {
      entries.push({ op: 'sub', aIdx: i - 1, bIdx: j - 1 });
      i--;
      j--;
    } else if (i > 0 && dp[i]![j]! === dp[i - 1]![j]! + 1) {
      entries.push({ op: 'del', aIdx: i - 1, bIdx: null });
      i--;
    } else {
      entries.push({ op: 'ins', aIdx: null, bIdx: j - 1 });
      j--;
    }
  }

  entries.reverse();
  return { entries, distance: dp[m]![n]! };
}

// ---------------------------------------------------------------------------
// Phoneme classification
// ---------------------------------------------------------------------------

const VOWEL_PHONEMES = new Set([
  'AA',
  'AE',
  'AH',
  'AO',
  'AW',
  'AY',
  'EH',
  'ER',
  'EY',
  'IH',
  'IY',
  'OW',
  'OY',
  'UH',
  'UW',
]);

function classifyError(got: string, want: string): string {
  if (got === '(none)') return 'missing_phoneme';
  if (want === '(none)') return 'extra_phoneme';
  const gotIsVowel = VOWEL_PHONEMES.has(got);
  const wantIsVowel = VOWEL_PHONEMES.has(want);
  if (gotIsVowel && wantIsVowel) return 'wrong_vowel';
  if (!gotIsVowel && !wantIsVowel) return 'wrong_consonant';
  return 'vowel_consonant_swap';
}

// ---------------------------------------------------------------------------
// Map G2P phoneme index -> the rule step that produced it
// ---------------------------------------------------------------------------

function phonemeIndexToStep(
  trace: G2PTrace,
  phonemeIdx: number
): { step: G2PTraceStep; offsetInStep: number } | null {
  let offset = 0;
  for (const step of trace.steps) {
    if (phonemeIdx < offset + step.phonemes.length) {
      return { step, offsetInStep: phonemeIdx - offset };
    }
    offset += step.phonemes.length;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Error pattern structures
// ---------------------------------------------------------------------------

interface ErrorPattern {
  rule: string;
  letters: string;
  got: string; // stressless phoneme G2P produced (or "(none)" for missing)
  want: string; // stressless phoneme CMU expected (or "(none)" for extra)
  errorType: string;
  count: number;
  freqSum: number;
  samples: { word: string; freq: number }[];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const dict = await loadDictionary();
  await loadFrequencies();
  const words = Object.keys(dict);

  const patterns = new Map<string, ErrorPattern>();
  const ruleTotalErrors = new Map<string, { count: number; freq: number }>();
  const letterSubs = new Map<string, { count: number; freq: number; samples: string[] }>();

  let totalWords = 0;
  let correctWords = 0;
  let errorWords = 0;
  let totalErrorOps = 0;

  for (const word of words) {
    if (/[^a-z]/i.test(word) || word.length < 3) continue;
    totalWords++;

    const cmuPhonemes = dict[word]!;
    const trace = wordToArpabetTraced(word);

    const cmuNoStress = cmuPhonemes.map(stripStress);
    const g2pNoStress = trace.phonemes.map(stripStress);

    if (cmuNoStress.join(' ') === g2pNoStress.join(' ')) {
      correctWords++;
      continue;
    }
    errorWords++;

    const freq = getWordFrequency(word) ?? 0;

    // Align G2P output against CMU
    const { entries, distance } = levenshteinAlign(g2pNoStress, cmuNoStress);

    // Skip extremely distant words (foreign names etc.)
    if (distance > 6) continue;

    for (const entry of entries) {
      if (entry.op === 'match') continue;
      totalErrorOps++;

      let got: string;
      let want: string;
      let rule = '(unknown)';
      let letters = '?';

      if (entry.op === 'sub') {
        got = g2pNoStress[entry.aIdx!]!;
        want = cmuNoStress[entry.bIdx!]!;
        const stepInfo = phonemeIndexToStep(trace, entry.aIdx!);
        if (stepInfo) {
          rule = stepInfo.step.rule;
          letters = stepInfo.step.letters;
        }
      } else if (entry.op === 'del') {
        // G2P produced extra phoneme
        got = g2pNoStress[entry.aIdx!]!;
        want = '(none)';
        const stepInfo = phonemeIndexToStep(trace, entry.aIdx!);
        if (stepInfo) {
          rule = stepInfo.step.rule;
          letters = stepInfo.step.letters;
        }
      } else {
        // ins: G2P is missing a phoneme CMU has
        got = '(none)';
        want = cmuNoStress[entry.bIdx!]!;
        // Approximate: find the nearest G2P step
        const nearestIdx = Math.min(entry.bIdx !== null ? entry.bIdx : 0, g2pNoStress.length - 1);
        const stepInfo = phonemeIndexToStep(trace, Math.max(0, nearestIdx));
        if (stepInfo) {
          rule = stepInfo.step.rule;
          letters = stepInfo.step.letters;
        }
      }

      const errorType = classifyError(got, want);
      const key = `${rule}|${letters}|${got}|${want}`;

      const existing = patterns.get(key);
      if (existing) {
        existing.count++;
        existing.freqSum += freq;
        if (existing.samples.length < 10) {
          existing.samples.push({ word, freq });
        }
      } else {
        patterns.set(key, {
          rule,
          letters,
          got,
          want,
          errorType,
          count: 1,
          freqSum: freq,
          samples: [{ word, freq }],
        });
      }

      // Rule-level aggregation
      const rt = ruleTotalErrors.get(rule);
      if (rt) {
        rt.count++;
        rt.freq += freq;
      } else {
        ruleTotalErrors.set(rule, { count: 1, freq });
      }

      // Letter-level substitution aggregation
      if (entry.op === 'sub') {
        const lk = `${letters.toUpperCase()}: ${got} -> ${want}`;
        const ls = letterSubs.get(lk);
        if (ls) {
          ls.count++;
          ls.freq += freq;
          if (ls.samples.length < 5) ls.samples.push(word);
        } else {
          letterSubs.set(lk, { count: 1, freq, samples: [word] });
        }
      }
    }
  }

  // =========================================================================
  // OUTPUT
  // =========================================================================

  console.log('==========================================================');
  console.log('  G2P ERROR ANALYSIS — Rule-Level Error Attribution');
  console.log('==========================================================\n');
  console.log(`Total words:     ${totalWords}`);
  console.log(
    `Correct (SL):    ${correctWords} (${((correctWords / totalWords) * 100).toFixed(1)}%)`
  );
  console.log(`Wrong:           ${errorWords} (${((errorWords / totalWords) * 100).toFixed(1)}%)`);
  console.log(`Total error ops: ${totalErrorOps}`);
  console.log(`Unique patterns: ${patterns.size}\n`);

  // --- Section 1: Top 50 by word count ---
  const byCount = [...patterns.values()].sort((a, b) => b.count - a.count);

  console.log('==========================================================');
  console.log('  TOP 50 ERROR PATTERNS BY WORD COUNT');
  console.log('==========================================================\n');
  printPatternTable(byCount.slice(0, 50), 'count');

  // --- Section 2: Top 50 by frequency weight ---
  const byFreq = [...patterns.values()].sort((a, b) => b.freqSum - a.freqSum);

  console.log('\n==========================================================');
  console.log('  TOP 50 ERROR PATTERNS BY FREQUENCY WEIGHT');
  console.log('==========================================================\n');
  printPatternTable(byFreq.slice(0, 50), 'freq');

  // --- Section 3: Top 30 rules by total error count ---
  const sortedRules = [...ruleTotalErrors.entries()].sort((a, b) => b[1].count - a[1].count);

  console.log('\n==========================================================');
  console.log('  TOP 30 RULES BY TOTAL ERRORS CAUSED');
  console.log('==========================================================\n');
  console.log('  Rank  Errors  FreqWt  Rule');
  console.log('  ----  ------  ------  ----');
  for (let i = 0; i < Math.min(30, sortedRules.length); i++) {
    const [rule, data] = sortedRules[i]!;
    console.log(
      `  ${String(i + 1).padStart(3)}.  ${String(data.count).padStart(6)}  ${String(data.freq).padStart(6)}  ${rule}`
    );
  }

  // --- Section 4: Top 30 letter-level substitutions ---
  const sortedLS = [...letterSubs.entries()].sort((a, b) => b[1].count - a[1].count);

  console.log('\n==========================================================');
  console.log('  TOP 30 LETTER-LEVEL SUBSTITUTIONS');
  console.log('==========================================================\n');
  console.log('  Rank  Count  FreqWt  Substitution                        Samples');
  console.log('  ----  -----  ------  ------------                        -------');
  for (let i = 0; i < Math.min(30, sortedLS.length); i++) {
    const [sub, data] = sortedLS[i]!;
    console.log(
      `  ${String(i + 1).padStart(3)}.  ${String(data.count).padStart(5)}  ${String(data.freq).padStart(6)}  ${sub.padEnd(36)} ${data.samples.join(', ')}`
    );
  }

  // --- Section 5: Error type summary ---
  const byType = new Map<string, { count: number; freq: number }>();
  for (const p of patterns.values()) {
    const et = byType.get(p.errorType);
    if (et) {
      et.count += p.count;
      et.freq += p.freqSum;
    } else {
      byType.set(p.errorType, { count: p.count, freq: p.freqSum });
    }
  }

  console.log('\n==========================================================');
  console.log('  ERROR TYPE SUMMARY');
  console.log('==========================================================\n');
  for (const [type, data] of [...byType.entries()].sort((a, b) => b[1].count - a[1].count)) {
    console.log(
      `  ${type.padEnd(22)} ${String(data.count).padStart(7)} errors  (freq: ${data.freq})`
    );
  }

  // --- Section 6: Actionable suggestions ---
  console.log('\n==========================================================');
  console.log('  ACTIONABLE SUGGESTIONS (50+ words affected)');
  console.log('==========================================================\n');

  const actionable = byCount.filter((p) => p.count >= 50);
  for (let i = 0; i < Math.min(40, actionable.length); i++) {
    const p = actionable[i]!;
    const highFreqSamples = p.samples
      .sort((a, b) => b.freq - a.freq)
      .slice(0, 6)
      .map((s) => `${s.word}(${s.freq})`)
      .join(', ');

    console.log(`${i + 1}. [${p.count} words, freq=${p.freqSum}] ${p.errorType}`);
    console.log(`   Rule: ${p.rule}`);
    console.log(`   Letters "${p.letters}" -> ${p.got}, should be ${p.want}`);
    console.log(`   High-freq samples: ${highFreqSamples}`);

    if (p.errorType === 'extra_phoneme') {
      console.log(
        `   SUGGESTION: Rule produces extra "${p.got}" — consume more letters or silence this phoneme`
      );
    } else if (p.errorType === 'missing_phoneme') {
      console.log(
        `   SUGGESTION: Rule is missing "${p.want}" — add it to the rule's output phonemes`
      );
    } else {
      console.log(
        `   SUGGESTION: Add context rule for "${p.letters}" -> /${p.want}/ before "${p.rule}"`
      );
    }
    console.log('');
  }
}

function printPatternTable(pats: ErrorPattern[], sortBy: 'count' | 'freq') {
  for (let i = 0; i < pats.length; i++) {
    const p = pats[i]!;
    const primary =
      sortBy === 'count'
        ? `${String(p.count).padStart(5)} words`
        : `${String(p.freqSum).padStart(7)} freq`;
    const secondary =
      sortBy === 'count'
        ? `freq=${String(p.freqSum).padStart(7)}`
        : `${String(p.count).padStart(5)} words`;

    console.log(
      `  ${String(i + 1).padStart(3)}. ${primary} (${secondary})  ${p.errorType.padEnd(20)} ` +
        `"${p.letters}" -> ${p.got.padEnd(8)} want: ${p.want.padEnd(8)} Rule: ${p.rule}`
    );

    // Show samples for top items
    if (i < 25) {
      const sampleStr = p.samples
        .sort((a, b) => b.freq - a.freq)
        .slice(0, 6)
        .map((s) => `${s.word}(${s.freq})`)
        .join(', ');
      console.log(`        ${sampleStr}`);
    }
  }
}

main().catch(console.error);
