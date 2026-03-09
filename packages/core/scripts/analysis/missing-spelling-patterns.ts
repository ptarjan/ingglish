#!/usr/bin/env npx tsx --conditions=source
/**
 * Finds spelling patterns missing from the spelling guide.
 *
 * For each word in the CMU dictionary, runs G2P trace to get letter→phoneme
 * alignment. Only trusts words where G2P output matches CMU pronunciation.
 * Reports letter patterns (5+ word occurrences) not already in the guide.
 *
 * Usage: npx tsx --conditions=source packages/core/scripts/analysis/missing-spelling-patterns.ts
 */

import {
  getDictionary,
  getWordFrequency,
  loadDictionary,
  loadFrequencies,
} from '@ingglish/dictionary';
import { wordToArpabetTraced } from '@ingglish/g2p';
import { getStress, isVowel, stripStress } from '@ingglish/phonemes';
import { loadLangDict, translateSync } from 'ingglish';
import { consonantGroups, vowelGroups } from '../../../website/src/data/spelling-guide-data.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PatternRecord {
  /** Example words sorted by frequency (highest first) */
  examples: string[];
  /** Total frequency across all words with this pattern */
  totalFreq: number;
}

// ---------------------------------------------------------------------------
// Step 1: Parse existing bold patterns from the spelling guide
// ---------------------------------------------------------------------------

function parseExistingPatterns(): Map<string, Set<string>> {
  const result = new Map<string, Set<string>>();

  for (const group of [...vowelGroups, ...consonantGroups]) {
    for (const sound of group.sounds) {
      const phoneme = sound.phoneme;
      const patterns = new Set<string>();

      // Extract **bold** patterns from the examples string
      const boldRegex = /\*\*([^*]+)\*\*/g;
      let m: RegExpExecArray | null;
      while ((m = boldRegex.exec(sound.examples)) !== null) {
        patterns.add(m[1]!.toLowerCase());
      }

      result.set(phoneme, patterns);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Step 2: Collect letter→phoneme patterns from G2P trace
// ---------------------------------------------------------------------------

export async function main() {
  await Promise.all([loadDictionary(), loadFrequencies(), loadLangDict('en')]);
  const cmudict = getDictionary();

  const existingPatterns = parseExistingPatterns();

  // Map: phonemeKey -> letterPattern -> PatternRecord
  const patternMap = new Map<string, Map<string, PatternRecord>>();

  function record(phonemeKey: string, letterPattern: string, word: string, freq: number) {
    let byPattern = patternMap.get(phonemeKey);
    if (!byPattern) {
      byPattern = new Map();
      patternMap.set(phonemeKey, byPattern);
    }
    let rec = byPattern.get(letterPattern);
    if (!rec) {
      rec = { examples: [], totalFreq: 0 };
      byPattern.set(letterPattern, rec);
    }
    rec.totalFreq += freq;
    // Keep top 10 examples by frequency (insert sorted)
    if (rec.examples.length < 10) {
      rec.examples.push(word);
    }
  }

  const allWords = Object.keys(cmudict).filter((w) => !w.includes('(') && /^[a-z]+$/.test(w));

  let matchCount = 0;
  let totalCount = 0;

  for (const word of allWords) {
    const cmuPhonemes = cmudict[word];
    if (!cmuPhonemes || cmuPhonemes.length === 0) continue;
    totalCount++;

    const freq = getWordFrequency(word) ?? 0;
    if (freq < 1) continue; // skip extremely rare words

    const trace = wordToArpabetTraced(word);

    // Only trust words where G2P matches CMU (stress-stripped)
    const g2pBare = trace.phonemes.map(stripStress);
    const cmuBare = cmuPhonemes.map(stripStress);
    if (g2pBare.length !== cmuBare.length || g2pBare.some((p, i) => p !== cmuBare[i])) {
      continue;
    }
    matchCount++;

    // Walk through trace steps, tracking phoneme index
    let phonemeIdx = 0;
    for (let stepIdx = 0; stepIdx < trace.steps.length; stepIdx++) {
      const step = trace.steps[stepIdx]!;
      const stepPhonemes = step.phonemes;
      const letters = step.letters.toLowerCase();

      if (stepPhonemes.length === 0) {
        // Silent letters - check if this is a trailing silent E that should
        // merge with the previous vowel step
        if (letters === 'e' && stepIdx === trace.steps.length - 1 && stepIdx > 0) {
          // Trailing silent E: we already recorded the previous step's pattern,
          // but we want to also record the combined pattern (e.g., "a_e" -> "are", "ake")
          // Actually, the plan says merge into previous vowel pattern.
          // Find the previous step with a vowel phoneme
          const prevStep = trace.steps[stepIdx - 1]!;
          const prevPhonemes = prevStep.phonemes;
          if (prevPhonemes.length >= 1) {
            const prevBare = stripStress(prevPhonemes[0]!);
            if (isVowel(prevPhonemes[0]!)) {
              // Record the combined pattern: prev letters + "e"
              const combinedLetters = prevStep.letters.toLowerCase() + 'e';
              const phonemeKey =
                prevBare === 'AH' && getStress(prevPhonemes[0]!) === 0 ? 'AH0' : prevBare;

              // For r-colored: vowel + R
              if (prevPhonemes.length === 2 && stripStress(prevPhonemes[1]!) === 'R') {
                const rColoredKey = phonemeKey === 'ER' ? 'ER' : `${phonemeKey}+R`;
                record(rColoredKey, combinedLetters, word, freq);
              } else if (prevPhonemes.length === 1) {
                record(phonemeKey, combinedLetters, word, freq);
              }
            }
          }
        }
        // Skip silent letters (don't advance phonemeIdx)
        continue;
      }

      if (stepPhonemes.length === 1) {
        // Simple 1-to-1 mapping
        const phoneme = stepPhonemes[0]!;
        const bare = stripStress(phoneme);
        const phonemeKey = bare === 'AH' && getStress(phoneme) === 0 ? 'AH0' : bare;
        record(phonemeKey, letters, word, freq);
        phonemeIdx += 1;
      } else if (
        stepPhonemes.length === 2 &&
        isVowel(stepPhonemes[0]!) &&
        stripStress(stepPhonemes[1]!) === 'R'
      ) {
        // R-colored vowel: letters → VOWEL+R
        const vowelBare = stripStress(stepPhonemes[0]!);
        const phonemeKey =
          vowelBare === 'AH' && getStress(stepPhonemes[0]!) === 0
            ? 'AH0+R'
            : vowelBare === 'ER'
              ? 'ER'
              : `${vowelBare}+R`;
        record(phonemeKey, letters, word, freq);
        phonemeIdx += 2;
      } else if (stepPhonemes.length >= 2 && isVowel(stepPhonemes[0]!)) {
        // Multi-phoneme starting with a vowel (e.g., OUS → AH0+S, AIN → AH0+N).
        // Record the full letter pattern under the vowel phoneme since
        // the vowel is the interesting part for spelling patterns.
        const phoneme = stepPhonemes[0]!;
        const bare = stripStress(phoneme);
        const phonemeKey = bare === 'AH' && getStress(phoneme) === 0 ? 'AH0' : bare;
        record(phonemeKey, letters, word, freq);
        phonemeIdx += stepPhonemes.length;
      } else {
        // Multi-phoneme: skip (ambiguous alignment)
        phonemeIdx += stepPhonemes.length;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Step 3: Report missing patterns
  // ---------------------------------------------------------------------------

  const MIN_OCCURRENCES = 5;

  console.log('='.repeat(90));
  console.log('MISSING SPELLING PATTERNS REPORT');
  console.log('='.repeat(90));
  console.log(`G2P matched CMU: ${matchCount} / ${totalCount} words\n`);

  // Collect all phonemes from the guide
  const allPhonemes: string[] = [];
  for (const group of [...vowelGroups, ...consonantGroups]) {
    for (const sound of group.sounds) {
      allPhonemes.push(sound.phoneme);
    }
  }

  let totalMissing = 0;

  for (const phoneme of allPhonemes) {
    const existing = existingPatterns.get(phoneme) ?? new Set();
    const discovered = patternMap.get(phoneme);
    if (!discovered) continue;

    // Find patterns not in existing
    const missing: { pattern: string; totalFreq: number; examples: string[] }[] = [];

    for (const [pattern, rec] of discovered) {
      if (existing.has(pattern)) continue;
      if (rec.examples.length < MIN_OCCURRENCES) continue;

      // Sort examples by frequency (highest first)
      const sorted = rec.examples.toSorted(
        (a, b) => (getWordFrequency(b) ?? 0) - (getWordFrequency(a) ?? 0)
      );

      missing.push({
        pattern,
        totalFreq: rec.totalFreq,
        examples: sorted.slice(0, 5),
      });
    }

    if (missing.length === 0) continue;

    // Sort by total frequency (most common patterns first)
    missing.sort((a, b) => b.totalFreq - a.totalFreq);

    console.log(`\n${'─'.repeat(70)}`);
    console.log(`${phoneme}  (existing: ${[...existing].join(', ')})`);
    console.log('─'.repeat(70));

    for (const m of missing) {
      totalMissing++;
      const bestWord = m.examples[0]!;
      const translation = translateSync(bestWord);
      const freq = getWordFrequency(bestWord) ?? 0;
      console.log(`  NEW: "${m.pattern}" (${m.examples.length}+ words, totalFreq=${m.totalFreq})`);
      console.log(`    Best example: ${bestWord} (${translation}) freq=${freq}`);
      console.log(`    Others: ${m.examples.slice(1).join(', ')}`);

      // Show formatted example for copy-paste into spelling-guide-data.ts
      const boldWord = bestWord.replace(
        new RegExp(escapeRegex(m.pattern), 'i'),
        `**${m.pattern}**`
      );
      console.log(`    Formatted: ${boldWord} (${translation})`);
    }
  }

  console.log(`\n${'='.repeat(90)}`);
  console.log(`TOTAL: ${totalMissing} missing patterns`);
  console.log('='.repeat(90));
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

if (process.argv[1]?.includes('missing-spelling-patterns')) main().catch(console.error);
