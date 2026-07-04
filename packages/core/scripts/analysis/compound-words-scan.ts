#!/usr/bin/env -S npx vite-node --script
/**
 * Find CMU dictionary errors by checking compound words.
 *
 * Strategy: For each word in the dictionary, try to split it into two parts
 * where BOTH parts are standalone dictionary words. Then verify the compound's
 * pronunciation matches the concatenation of its components.
 *
 * To separate real compounds from coincidental splits (e.g. "better" = "bet"+"ter"),
 * we require a very high phoneme match rate (>= 90%) and filter out common false
 * patterns like doubled consonants at morpheme boundaries.
 *
 * Usage: cd packages/core && npx vite-node --script scripts/compound-words-scan.ts
 */

import { loadDictionary, getDictionary } from '@ingglish/dictionary';
import { CUSTOM_PRONUNCIATIONS } from '@ingglish/dictionary';
import { loadFrequencies, getWordFrequency } from '@ingglish/dictionary';

export async function main() {
  await loadDictionary();
  await loadFrequencies();
  const cmudict = getDictionary();

  // All words without variant markers like (2)
  const allWords = Object.keys(cmudict).filter((w) => cmudict[w]?.length > 0 && !w.includes('('));
  const wordSet = new Set(allWords);

  // Skip words we've already fixed
  const alreadyFixed = new Set(Object.keys(CUSTOM_PRONUNCIATIONS));

  function stripStress(p: string): string {
    return p.replace(/[0-2]$/, '');
  }

  function stripStressAll(phonemes: string[]): string[] {
    return phonemes.map(stripStress);
  }

  // Vowel phonemes (stress-stripped)
  const VOWELS = new Set([
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

  function isVowel(p: string): boolean {
    return VOWELS.has(stripStress(p));
  }

  // Known legitimate compound pronunciation changes
  const KNOWN_EXCEPTIONS = new Set([
    'breakfast',
    'cupboard',
    'forehead',
    'shepherd',
    'christmas',
    'handsome',
    'understand',
    'withstand',
  ]);

  // Suffix/prefix fragments that create false compound splits.
  // Only include morphological artifacts — NOT real standalone words that
  // could be legitimate compound parts (bed, ring, king, wing, etc.).
  const FALSE_PARTS = new Set([
    // -ing suffix fragments (NOT real words like ring, king, wing, sing)
    'ting',
    'ping',
    'ding',
    'ming',
    'ning',
    'bing',
    'zing',
    // -er/-or suffix fragments (these are almost always morphological)
    'ter',
    'per',
    'ver',
    'ger',
    'ner',
    'ler',
    'der',
    'ber',
    'ser',
    'cer',
    // -ed suffix fragments (NOT real words like bed, red, fed, shed, wed)
    'ted',
    'ned',
    'ped',
    // -ling suffix (morphological diminutive, NOT a standalone compound part)
    'ling',
    // Morphological suffixes
    'ion',
    'ions',
    'ing',
    'ers',
    'tion',
    'ness',
    'ment',
    'able',
    'ible',
    'less',
    'ally',
    'ful',
    // Common prefixes that happen to be dictionary words
    'pre',
    'mis',
    'dis',
    'sup',
    'sub',
    // Short words used as suffix-like components
    'ell',
    'err',
    'ens',
    'ent',
    'est',
    'ism',
    'ist',
  ]);

  // CLI flags
  const showVowels = process.argv.includes('--vowels');

  interface CompoundMismatch {
    compound: string;
    part1: string;
    part2: string;
    compoundPhonemes: string[];
    part1Phonemes: string[];
    part2Phonemes: string[];
    mismatchType: 'consonant-diff' | 'vowel-diff' | 'length-diff';
    details: string;
    matchPct: number;
    compoundFreq: number;
    part1Freq: number;
    part2Freq: number;
    maxFreq: number;
    suffixStripped?: string; // if part2 was suffix-stripped, the original part2 spelling
  }

  /**
   * Check if a split looks like a doubled-consonant morpheme boundary
   * rather than a real compound. E.g. "getting" splits into "get"+"ting"
   * where the first part ends with 't' and the second starts with 't'.
   *
   * Only applies when at least one part is short (< 4 chars), since real
   * compounds like "bookkeeper" (book+keeper) and "roommate" (room+mate)
   * have doubled consonants at genuine compound boundaries.
   */
  function isDoubledConsonantSplit(part1: string, part2: string): boolean {
    if (part1.length === 0 || part2.length === 0) return false;
    // Only filter short-part splits (morphological artifacts)
    if (part1.length >= 4 && part2.length >= 4) return false;
    const lastChar = part1[part1.length - 1];
    const firstChar = part2[0];
    return lastChar === firstChar && /[bcdfgklmnprstvz]/.test(lastChar);
  }

  /**
   * Compare compound phonemes to part1+part2. Returns match info.
   */
  function analyzeCompound(
    compoundBare: string[],
    part1Bare: string[],
    part2Bare: string[]
  ): {
    matchPct: number;
    consonantDiffs: string[];
    vowelDiffs: string[];
    lengthDiff: number;
  } {
    const expectedBare = [...part1Bare, ...part2Bare];
    const lengthDiff = compoundBare.length - expectedBare.length;

    if (lengthDiff === 0) {
      let matches = 0;
      const consonantDiffs: string[] = [];
      const vowelDiffs: string[] = [];

      for (let i = 0; i < compoundBare.length; i++) {
        if (compoundBare[i] === expectedBare[i]) {
          matches++;
        } else {
          // N/NG alternation counts as a match
          if (
            (compoundBare[i] === 'NG' && expectedBare[i] === 'N') ||
            (compoundBare[i] === 'N' && expectedBare[i] === 'NG')
          ) {
            matches++;
            continue;
          }

          // ER vs R counts as a match (r-coloring variation)
          if (
            (compoundBare[i] === 'ER' && expectedBare[i] === 'R') ||
            (compoundBare[i] === 'R' && expectedBare[i] === 'ER')
          ) {
            matches++;
            continue;
          }

          const bothVowels = isVowel(compoundBare[i]) && isVowel(expectedBare[i]);
          if (bothVowels) {
            vowelDiffs.push(`pos ${i}: compound=${compoundBare[i]} expected=${expectedBare[i]}`);
          } else {
            consonantDiffs.push(
              `pos ${i}: compound=${compoundBare[i]} expected=${expectedBare[i]}`
            );
          }
        }
      }

      return {
        matchPct: matches / compoundBare.length,
        consonantDiffs,
        vowelDiffs,
        lengthDiff,
      };
    }

    // For length mismatches, align from start and end
    let prefixMatches = 0;
    for (let i = 0; i < Math.min(compoundBare.length, expectedBare.length); i++) {
      if (compoundBare[i] === expectedBare[i]) prefixMatches++;
      else break;
    }

    let suffixMatches = 0;
    for (let i = 0; i < Math.min(compoundBare.length, expectedBare.length); i++) {
      const ci = compoundBare.length - 1 - i;
      const ei = expectedBare.length - 1 - i;
      if (ci < prefixMatches || ei < prefixMatches) break;
      if (compoundBare[ci] === expectedBare[ei]) suffixMatches++;
      else break;
    }

    const totalMatches = prefixMatches + suffixMatches;
    const maxLen = Math.max(compoundBare.length, expectedBare.length);

    return {
      matchPct: totalMatches / maxLen,
      consonantDiffs: [],
      vowelDiffs: [],
      lengthDiff,
    };
  }

  const results: CompoundMismatch[] = [];
  const seenCompounds = new Map<string, CompoundMismatch>();

  for (const compound of allWords) {
    if (compound.length < 6) continue;
    if (alreadyFixed.has(compound)) continue;
    if (KNOWN_EXCEPTIONS.has(compound)) continue;

    const compoundPhonemes = cmudict[compound];
    if (!Array.isArray(compoundPhonemes) || compoundPhonemes.length === 0) continue;

    const compoundFreq = getWordFrequency(compound) ?? 0;

    // The compound itself must have frequency >= 1
    if (compoundFreq < 1) continue;

    const compoundBare = stripStressAll(compoundPhonemes);

    for (let splitPos = 3; splitPos <= compound.length - 3; splitPos++) {
      const part1 = compound.slice(0, splitPos);
      const part2 = compound.slice(splitPos);

      // Filter: skip known false parts (suffix/prefix fragments)
      if (FALSE_PARTS.has(part1) || FALSE_PARTS.has(part2)) continue;

      // Filter: skip doubled-consonant splits (morphological, not compound)
      if (isDoubledConsonantSplit(part1, part2)) continue;

      // Part1 must exist in dictionary
      if (!wordSet.has(part1)) continue;

      const part1Phonemes = cmudict[part1];
      if (!Array.isArray(part1Phonemes) || part1Phonemes.length === 0) continue;

      const part1Freq = getWordFrequency(part1) ?? 0;
      if (part1Freq < 10) continue;

      // Part2: try direct lookup first, then suffix-stripped forms
      let part2Phonemes: string[] | undefined;
      let part2Freq = 0;
      let part2Effective = part2; // the actual word we looked up
      let suffixStripped: string | undefined;

      if (wordSet.has(part2)) {
        const p = cmudict[part2];
        if (Array.isArray(p) && p.length > 0) {
          part2Phonemes = p;
          part2Freq = getWordFrequency(part2) ?? 0;
        }
      }

      // If part2 isn't in dict (or has no phonemes), try suffix-stripped forms
      if (!part2Phonemes) {
        const suffixStrips: { suffix: string; phonemes: string[] }[] = [
          { suffix: 's', phonemes: ['Z'] },
          { suffix: 's', phonemes: ['S'] },
          { suffix: 'es', phonemes: ['IH0', 'Z'] },
          { suffix: 'es', phonemes: ['AH0', 'Z'] },
          { suffix: 'ed', phonemes: ['D'] },
          { suffix: 'ed', phonemes: ['T'] },
          { suffix: 'ed', phonemes: ['IH0', 'D'] },
          { suffix: 'ing', phonemes: ['IH0', 'NG'] },
          { suffix: 'er', phonemes: ['ER0'] },
          { suffix: 'ly', phonemes: ['L', 'IY0'] },
        ];

        for (const { suffix, phonemes: suffPh } of suffixStrips) {
          if (!part2.endsWith(suffix) || part2.length <= suffix.length + 2) continue;
          const stem = part2.slice(0, -suffix.length);
          if (!wordSet.has(stem)) continue;
          const stemPh = cmudict[stem];
          if (!Array.isArray(stemPh) || stemPh.length === 0) continue;
          // Build part2 phonemes from stem + suffix
          part2Phonemes = [...stemPh, ...suffPh];
          part2Effective = stem;
          part2Freq = getWordFrequency(stem) ?? 0;
          suffixStripped = part2;
          break;
        }
      }

      if (!part2Phonemes) continue;

      // Both component words must have frequency >= 10
      if (part2Freq < 10) continue;

      const part1Bare = stripStressAll(part1Phonemes);
      const part2Bare = stripStressAll(part2Phonemes);

      const analysis = analyzeCompound(compoundBare, part1Bare, part2Bare);

      // Very high confidence: >= 90% match for same-length, >= 85% for length diffs
      const minMatch = analysis.lengthDiff === 0 ? 0.9 : 0.85;
      if (analysis.matchPct < minMatch) continue;

      // Must have a real difference
      const hasConsonantDiff = analysis.consonantDiffs.length > 0;
      const hasVowelDiff = analysis.vowelDiffs.length > 0;
      const hasLengthDiff = Math.abs(analysis.lengthDiff) > 0;
      const hasDiff = hasConsonantDiff || hasLengthDiff || (showVowels && hasVowelDiff);
      if (!hasDiff) continue;

      // For same-length: need at least one consonant or vowel (if --vowels) difference
      if (analysis.lengthDiff === 0 && !hasConsonantDiff && !(showVowels && hasVowelDiff)) continue;

      const maxFreq = Math.max(compoundFreq, part1Freq, part2Freq);

      let mismatchType: CompoundMismatch['mismatchType'];
      let details: string;
      if (hasLengthDiff) {
        mismatchType = 'length-diff';
        details = `${analysis.lengthDiff > 0 ? analysis.lengthDiff + ' extra' : Math.abs(analysis.lengthDiff) + ' missing'} phoneme(s): compound has ${compoundBare.length}, expected ${part1Bare.length + part2Bare.length} (${part1Bare.length}+${part2Bare.length})`;
      } else if (hasConsonantDiff) {
        mismatchType = 'consonant-diff';
        details = analysis.consonantDiffs.join('; ');
      } else {
        mismatchType = 'vowel-diff';
        details = analysis.vowelDiffs.join('; ');
      }

      const mismatch: CompoundMismatch = {
        compound,
        part1,
        part2: part2Effective,
        compoundPhonemes,
        part1Phonemes,
        part2Phonemes,
        mismatchType,
        details,
        matchPct: analysis.matchPct,
        compoundFreq,
        part1Freq,
        part2Freq,
        maxFreq,
        suffixStripped,
      };

      // Keep best split per compound (highest match %)
      const existing = seenCompounds.get(compound);
      if (!existing || mismatch.matchPct > existing.matchPct) {
        seenCompounds.set(compound, mismatch);
      }
    }
  }

  for (const mismatch of seenCompounds.values()) {
    results.push(mismatch);
  }

  // Sort by compound frequency descending, then maxFreq
  results.sort((a, b) => {
    const compoundDiff = b.compoundFreq - a.compoundFreq;
    if (compoundDiff !== 0) return compoundDiff;
    return b.maxFreq - a.maxFreq;
  });

  // Report
  console.log('='.repeat(90));
  console.log('COMPOUND WORD PRONUNCIATION SCAN');
  console.log('='.repeat(90));
  console.log(`Total compound mismatches found: ${results.length}`);
  console.log(
    `  Consonant differences: ${results.filter((r) => r.mismatchType === 'consonant-diff').length}`
  );
  console.log(
    `  Vowel differences:     ${results.filter((r) => r.mismatchType === 'vowel-diff').length}`
  );
  console.log(
    `  Length differences:     ${results.filter((r) => r.mismatchType === 'length-diff').length}`
  );
  console.log();
  console.log('Filters applied:');
  console.log('  - Compound word length >= 6, both parts >= 3 chars');
  console.log('  - Both component words have frequency >= 10');
  console.log('  - Compound itself has frequency >= 1');
  console.log('  - Skip doubled-consonant splits only when one part < 4 chars');
  console.log('  - Skip known suffix/prefix fragments (ting, ter, pre, dis, etc.)');
  console.log('  - Suffix-stripping: try s/es/ed/ing/er/ly on part2 if not in dict');
  console.log('  - >= 90% phoneme match for same-length, >= 85% for length diffs');
  console.log('  - ER/R alternation treated as match (not an error)');
  console.log('  - N/NG alternation treated as match (already handled)');
  console.log(
    showVowels
      ? '  - Consonant AND vowel diffs reported (--vowels flag)'
      : '  - Only consonant diffs reported (use --vowels for vowel diffs too)'
  );
  console.log('  - Best split kept per compound');
  console.log('  - Skip known exceptions and CUSTOM_PRONUNCIATIONS');
  console.log();

  const top = results.slice(0, 50);
  console.log(`Top ${top.length} results (sorted by compound frequency):\n`);

  for (let i = 0; i < top.length; i++) {
    const r = top[i];
    const splitLabel = r.suffixStripped
      ? `"${r.part1}" + "${r.part2}" (from "${r.suffixStripped}")`
      : `"${r.part1}" + "${r.part2}"`;

    console.log(`${String(i + 1).padStart(3)}. ${r.compound.padEnd(22)} = ${splitLabel}`);
    console.log(
      `     freq: compound=${r.compoundFreq}, ${r.part1}=${r.part1Freq}, ${r.part2}=${r.part2Freq}  |  match: ${(r.matchPct * 100).toFixed(0)}%`
    );
    console.log(`     ${r.mismatchType}: ${r.details}`);
    console.log(`     compound:  [${r.compoundPhonemes.join(' ')}]`);
    console.log(`     expected:  [${r.part1Phonemes.join(' ')} | ${r.part2Phonemes.join(' ')}]`);
    console.log();
  }

  // Summary
  console.log('='.repeat(90));
  console.log('SUMMARY OF DIFFERENCE PATTERNS');
  console.log('='.repeat(90));

  const patternCounts = new Map<string, number>();
  for (const r of results) {
    if (r.mismatchType === 'consonant-diff' || r.mismatchType === 'vowel-diff') {
      const pairs = r.details.split('; ');
      for (const pair of pairs) {
        const match = pair.match(/compound=(\S+) expected=(\S+)/);
        if (match) {
          const key = `${match[1]} vs ${match[2]}`;
          patternCounts.set(key, (patternCounts.get(key) ?? 0) + 1);
        }
      }
    } else {
      const label = r.details.split(':')[0];
      patternCounts.set(label, (patternCounts.get(label) ?? 0) + 1);
    }
  }

  const sortedPatterns = [...patternCounts.entries()].sort((a, b) => b[1] - a[1]);
  console.log('\nMost common phoneme difference patterns:\n');
  for (const [pattern, count] of sortedPatterns.slice(0, 30)) {
    console.log(`  ${String(count).padStart(4)}x  ${pattern}`);
  }
}

if (process.argv[1]?.includes('compound-words-scan')) main().catch(console.error);
