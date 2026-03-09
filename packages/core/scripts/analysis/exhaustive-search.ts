#!/usr/bin/env npx vite-node
/**
 * Exhaustively search for ALL safe mapping improvements.
 * Optimized: only recompute words affected by a phoneme change.
 * Supports stress-conditioned overrides (e.g. AH0→'a' vs AH1/2→'u').
 */

import {
  loadDictionary,
  getDictionary,
  loadFrequencies,
  getWordFrequency,
  getCorpusTotal,
} from '@ingglish/dictionary';
import { ARPABET_TO_INGGLISH_MAP, R_COLORED_FORWARD } from '@ingglish/phonemes';

export async function main() {
  await Promise.all([loadDictionary(), loadFrequencies()]);
  const cmudict = getDictionary();
  const allWords = Object.keys(cmudict).filter((w) => cmudict[w]?.length > 0);
  const corpusTotal = getCorpusTotal();
  const perMillion = (raw: number) => (raw / corpusTotal) * 1_000_000;

  function stripStress(phoneme: string): string {
    return phoneme.replace(/[0-2]$/, '');
  }

  // Pre-compute raw phonemes (with stress) and base phonemes (stress stripped)
  const wordRawPhonemes = new Map<string, string[]>();
  const wordBasePhonemes = new Map<string, string[]>();
  for (const word of allWords) {
    const phonemes = cmudict[word];
    if (phonemes) {
      wordRawPhonemes.set(word, phonemes);
      wordBasePhonemes.set(
        word,
        phonemes.map((p) => stripStress(p))
      );
    }
  }

  // Baseline stress overrides reflecting what arpabetToIngglish() actually does
  const baselineStressOverrides: Record<string, string> = { AH0: 'a' };

  function phonemesToSpelling(
    rawPhonemes: string[],
    map: Record<string, string>,
    stressOverrides?: Record<string, string>
  ): string {
    let result = '';
    const len = rawPhonemes.length;
    for (let i = 0; i < len; i++) {
      const p = rawPhonemes[i];
      // Stress overrides first (e.g. AH0 → 'a')
      if (stressOverrides && p in stressOverrides) {
        // But R-colored override takes precedence: AH0+R → 'ur' not 'ar'
        if (i + 1 < len && rawPhonemes[i + 1] === 'R') {
          const base = stripStress(p);
          const rPrefix = R_COLORED_FORWARD.get(base);
          if (rPrefix !== undefined) {
            result += rPrefix;
            continue;
          }
        }
        result += stressOverrides[p];
        continue;
      }
      const base = stripStress(p);
      // R-colored vowel check
      if (i + 1 < len && rawPhonemes[i + 1] === 'R') {
        const rPrefix = R_COLORED_FORWARD.get(base);
        if (rPrefix !== undefined) {
          result += rPrefix;
          continue;
        }
      }
      result += map[base] || base.toLowerCase();
    }
    return result;
  }

  function getCollisionCount(
    map: Record<string, string>,
    stressOverrides?: Record<string, string>
  ): number {
    const spellingToWords = new Map<string, Set<string>>();
    for (const word of allWords) {
      const rawPhonemes = wordRawPhonemes.get(word);
      if (!rawPhonemes) continue;
      const spelling = phonemesToSpelling(rawPhonemes, map, stressOverrides);
      const baseWord = word.replace(/\(\d+\)$/, '');
      if (!spellingToWords.has(spelling)) spellingToWords.set(spelling, new Set());
      spellingToWords.get(spelling)!.add(baseWord);
    }
    let collisions = 0;
    for (const words of spellingToWords.values()) {
      if (words.size > 1) collisions += words.size - 1;
    }
    return collisions;
  }

  // Pre-compute which words contain each base phoneme (for incremental updates)
  const wordsWithPhoneme = new Map<string, string[]>();
  for (const phoneme of Object.keys(ARPABET_TO_INGGLISH_MAP)) {
    wordsWithPhoneme.set(phoneme, []);
  }
  for (const word of allWords) {
    const basePhonemes = wordBasePhonemes.get(word);
    if (!basePhonemes) continue;
    const seen = new Set<string>();
    for (const base of basePhonemes) {
      if (!seen.has(base) && wordsWithPhoneme.has(base)) {
        wordsWithPhoneme.get(base)!.push(word);
        seen.add(base);
      }
    }
  }

  // Pre-compute which words contain each raw phoneme (for stress-aware search)
  const wordsWithRawPhoneme = new Map<string, string[]>();
  for (const word of allWords) {
    const raw = wordRawPhonemes.get(word);
    if (!raw) continue;
    const seen = new Set<string>();
    for (const p of raw) {
      if (!seen.has(p)) {
        if (!wordsWithRawPhoneme.has(p)) wordsWithRawPhoneme.set(p, []);
        wordsWithRawPhoneme.get(p)!.push(word);
        seen.add(p);
      }
    }
  }

  // Pre-compute baseline identical words and their spellings
  const baselineSpellings = new Map<string, string>();
  const baselineIdentical = new Set<string>();
  for (const word of allWords) {
    const rawPhonemes = wordRawPhonemes.get(word);
    if (!rawPhonemes) continue;
    const spelling = phonemesToSpelling(
      rawPhonemes,
      ARPABET_TO_INGGLISH_MAP,
      baselineStressOverrides
    );
    baselineSpellings.set(word, spelling);
    if (spelling.toLowerCase() === word.toLowerCase()) baselineIdentical.add(word);
  }

  type DeltaResult = {
    gained: string[];
    lost: string[];
    netGain: number;
    freqGained: number;
    freqLost: number;
    freqNet: number;
  };

  // Fast incremental check for base phoneme changes
  function getIdenticalDelta(phoneme: string, newValue: string): DeltaResult {
    const affected = wordsWithPhoneme.get(phoneme) || [];
    const testMap = { ...ARPABET_TO_INGGLISH_MAP, [phoneme]: newValue };
    const gained: string[] = [];
    const lost: string[] = [];
    let freqGained = 0;
    let freqLost = 0;

    for (const word of affected) {
      const rawPhonemes = wordRawPhonemes.get(word)!;
      const newSpelling = phonemesToSpelling(rawPhonemes, testMap, baselineStressOverrides);
      const wasIdentical = baselineIdentical.has(word);
      const isIdentical = newSpelling.toLowerCase() === word.toLowerCase();

      if (!wasIdentical && isIdentical) {
        gained.push(word);
        freqGained += getWordFrequency(word) ?? 0;
      }
      if (wasIdentical && !isIdentical) {
        lost.push(word);
        freqLost += getWordFrequency(word) ?? 0;
      }
    }

    return {
      gained,
      lost,
      netGain: gained.length - lost.length,
      freqGained,
      freqLost,
      freqNet: freqGained - freqLost,
    };
  }

  // Incremental check for stress-specific changes
  function getStressIdenticalDelta(rawPhoneme: string, newValue: string): DeltaResult {
    const affected = wordsWithRawPhoneme.get(rawPhoneme) || [];
    const testOverrides = { ...baselineStressOverrides, [rawPhoneme]: newValue };
    const gained: string[] = [];
    const lost: string[] = [];
    let freqGained = 0;
    let freqLost = 0;

    for (const word of affected) {
      const rawPhonemes = wordRawPhonemes.get(word)!;
      const newSpelling = phonemesToSpelling(rawPhonemes, ARPABET_TO_INGGLISH_MAP, testOverrides);
      const wasIdentical = baselineIdentical.has(word);
      const isIdentical = newSpelling.toLowerCase() === word.toLowerCase();

      if (!wasIdentical && isIdentical) {
        gained.push(word);
        freqGained += getWordFrequency(word) ?? 0;
      }
      if (wasIdentical && !isIdentical) {
        lost.push(word);
        freqLost += getWordFrequency(word) ?? 0;
      }
    }

    return {
      gained,
      lost,
      netGain: gained.length - lost.length,
      freqGained,
      freqLost,
      freqNet: freqGained - freqLost,
    };
  }

  // Full identical words check (only used for final reporting)
  function getIdenticalWords(
    map: Record<string, string>,
    stressOverrides?: Record<string, string>
  ): Set<string> {
    const identical = new Set<string>();
    for (const word of allWords) {
      const rawPhonemes = wordRawPhonemes.get(word);
      if (!rawPhonemes) continue;
      const spelling = phonemesToSpelling(rawPhonemes, map, stressOverrides);
      if (spelling.toLowerCase() === word.toLowerCase()) identical.add(word);
    }
    return identical;
  }

  const baselineCollisions = getCollisionCount(ARPABET_TO_INGGLISH_MAP, baselineStressOverrides);

  console.log(`Baseline: ${baselineIdentical.size} identical, ${baselineCollisions} collisions`);
  console.log(
    `Frequency unit: per million words of text (SUBTLEX-US, ${(corpusTotal / 1_000_000).toFixed(1)}M word corpus)\n`
  );

  // Generate ALL possible single-character and two-character options
  const allChars = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const allDigraphs = [
    'th',
    'sh',
    'ch',
    'ng',
    'zh',
    'dh',
    'ph',
    'wh',
    'ck',
    'gh',
    'aa',
    'ae',
    'ai',
    'ao',
    'au',
    'aw',
    'ay',
    'ea',
    'ee',
    'ei',
    'eo',
    'er',
    'eu',
    'ew',
    'ey',
    'ia',
    'ie',
    'io',
    'ir',
    'oa',
    'oe',
    'oi',
    'oo',
    'or',
    'ou',
    'ow',
    'oy',
    'ua',
    'ue',
    'ui',
    'uo',
    'ur',
    'uu',
    'uy',
  ];
  const allOptions = [...allChars, ...allDigraphs];

  // ============================================================
  // PHASE 1: Base phoneme search (stress-aware baseline)
  // ============================================================

  const limitArg = process.argv.find((a) => a.startsWith('--limit='));
  const phonemeLimit = limitArg ? parseInt(limitArg.split('=')[1]!) : Infinity;

  const phonemes = Object.keys(ARPABET_TO_INGGLISH_MAP).slice(0, phonemeLimit);
  const totalTests = phonemes.length * allOptions.length;
  console.log(
    `Testing ${phonemes.length} phonemes × ${allOptions.length} options = ${totalTests} combinations...\n`
  );

  // Test EVERY phoneme with EVERY option (with early exit optimization)
  const improvements: {
    phoneme: string;
    from: string;
    to: string;
    netGain: number;
    gained: string[];
    lost: string[];
    freqGained: number;
    freqLost: number;
    freqNet: number;
  }[] = [];
  let tested = 0;
  let skippedNotBetter = 0;
  let skippedCollisions = 0;

  for (let pi = 0; pi < phonemes.length; pi++) {
    const phoneme = phonemes[pi];
    const current = ARPABET_TO_INGGLISH_MAP[phoneme];
    const progressPct = (((pi + 1) / phonemes.length) * 100).toFixed(0);
    process.stdout.write(
      `\r[${progressPct}%] Testing ${phoneme.padEnd(3)} (${pi + 1}/${phonemes.length})...`
    );

    for (const option of allOptions) {
      if (option === current) continue;
      tested++;

      // Fast incremental check - only looks at words with this phoneme
      const delta = getIdenticalDelta(phoneme, option);

      // EARLY EXIT: Skip if not better
      if (delta.netGain <= 0) {
        skippedNotBetter++;
        continue;
      }

      // Only compute expensive collision check if identical improved
      const testMap = { ...ARPABET_TO_INGGLISH_MAP, [phoneme]: option };
      const collisions = getCollisionCount(testMap, baselineStressOverrides);
      if (collisions > baselineCollisions) {
        skippedCollisions++;
        continue;
      }

      improvements.push({
        phoneme,
        from: current,
        to: option,
        netGain: delta.netGain,
        gained: delta.gained,
        lost: delta.lost,
        freqGained: delta.freqGained,
        freqLost: delta.freqLost,
        freqNet: delta.freqNet,
      });
    }
  }
  console.log(); // newline after progress

  console.log(`\nTested ${tested} combinations:`);
  console.log(`  - ${skippedNotBetter} skipped (not better)`);
  console.log(`  - ${skippedCollisions} skipped (would add collisions)`);
  console.log(`  - ${improvements.length} valid improvements found`);

  // Sort by frequency-weighted net gain
  improvements.sort((a, b) => b.freqNet - a.freqNet);

  /** Format a raw frequency value as per-million (always positive; caller adds sign) */
  function fmtPM(raw: number): string {
    const pm = perMillion(Math.abs(raw));
    if (pm >= 1000) return `${(pm / 1000).toFixed(1)}K`;
    if (pm >= 1) return pm.toFixed(0);
    if (pm >= 0.1) return pm.toFixed(1);
    if (Math.abs(raw) > 0) return '<1';
    return '0';
  }

  function signedPM(raw: number): string {
    if (raw === 0) return '0';
    return `${raw >= 0 ? '+' : '-'}${fmtPM(raw)}`;
  }

  function topWordsByFreq(words: string[], n: number): string {
    return words
      .map((w) => ({ word: w, freq: getWordFrequency(w) ?? 0 }))
      .sort((a, b) => b.freq - a.freq)
      .slice(0, n)
      .map((w) => `${w.word}(${fmtPM(w.freq)})`)
      .join(', ');
  }

  console.log(`\n${'='.repeat(90)}`);
  console.log(`ALL SAFE BASE IMPROVEMENTS FOUND: ${improvements.length}`);
  console.log(`${'='.repeat(90)}\n`);

  if (improvements.length === 0) {
    console.log('No base improvements possible without creating new collisions.');
  } else {
    console.log(
      'Phoneme | Current | Better  | Net Gain | Gained | Lost  | Gained/M | Lost/M  | Net/M'
    );
    console.log('─'.repeat(90));
    for (const {
      phoneme,
      from,
      to,
      netGain,
      gained,
      lost,
      freqGained,
      freqLost,
      freqNet,
    } of improvements) {
      console.log(
        `  ${phoneme.padEnd(5)} | ${from.padEnd(7)} | ${to.padEnd(7)} | +${String(netGain).padEnd(6)} | +${String(gained.length).padEnd(5)} | -${String(lost.length).padEnd(4)} | +${fmtPM(freqGained).padEnd(9)} | -${fmtPM(freqLost).padEnd(8)} | ${signedPM(freqNet)}`
      );
    }

    // Show sample gained/lost words for top improvements, sorted by frequency
    console.log(`\n${'='.repeat(90)}`);
    console.log(`DETAILS FOR TOP BASE IMPROVEMENTS (by frequency)`);
    console.log(`${'='.repeat(90)}`);
    for (const { phoneme, from, to, netGain, gained, lost, freqNet } of improvements.slice(0, 5)) {
      console.log(
        `\n${phoneme}: "${from}" → "${to}" (net +${netGain} words, ${signedPM(freqNet)} /M)`
      );
      console.log(`  Top gained: ${topWordsByFreq(gained, 10)}`);
      console.log(`  Top lost:   ${topWordsByFreq(lost, 10)}`);
    }
  }

  // ============================================================
  // PHASE 2: Stress-conditioned search
  // ============================================================

  console.log(`\n${'='.repeat(60)}`);
  console.log(`STRESS-CONDITIONED IMPROVEMENTS`);
  console.log(`${'='.repeat(60)}\n`);

  // Find all stress-0 vowel phonemes present in the dictionary
  const stress0Phonemes = new Set<string>();
  for (const word of allWords) {
    const raw = wordRawPhonemes.get(word);
    if (!raw) continue;
    for (const p of raw) {
      if (p.endsWith('0')) stress0Phonemes.add(p);
    }
  }

  console.log(
    `Found ${stress0Phonemes.size} stress-0 phonemes: ${[...stress0Phonemes].sort().join(', ')}\n`
  );

  const stressImprovements: {
    rawPhoneme: string;
    basePhoneme: string;
    from: string;
    to: string;
    netGain: number;
    gained: string[];
    lost: string[];
    freqGained: number;
    freqLost: number;
    freqNet: number;
  }[] = [];

  let stressTested = 0;
  let stressSkippedNotBetter = 0;
  let stressSkippedCollisions = 0;

  const sortedStress0 = [...stress0Phonemes].sort().slice(0, phonemeLimit);
  for (let si = 0; si < sortedStress0.length; si++) {
    const rawPhoneme = sortedStress0[si];
    const basePhoneme = stripStress(rawPhoneme);
    const currentSpelling =
      baselineStressOverrides[rawPhoneme] ?? ARPABET_TO_INGGLISH_MAP[basePhoneme];
    const progressPct = (((si + 1) / sortedStress0.length) * 100).toFixed(0);
    process.stdout.write(
      `\r[${progressPct}%] Testing ${rawPhoneme.padEnd(4)} (${si + 1}/${sortedStress0.length})...`
    );

    for (const option of allOptions) {
      if (option === currentSpelling) continue;
      stressTested++;

      const delta = getStressIdenticalDelta(rawPhoneme, option);

      if (delta.netGain <= 0) {
        stressSkippedNotBetter++;
        continue;
      }

      const testOverrides = { ...baselineStressOverrides, [rawPhoneme]: option };
      const collisions = getCollisionCount(ARPABET_TO_INGGLISH_MAP, testOverrides);
      if (collisions > baselineCollisions) {
        stressSkippedCollisions++;
        continue;
      }

      stressImprovements.push({
        rawPhoneme,
        basePhoneme,
        from: currentSpelling,
        to: option,
        netGain: delta.netGain,
        gained: delta.gained,
        lost: delta.lost,
        freqGained: delta.freqGained,
        freqLost: delta.freqLost,
        freqNet: delta.freqNet,
      });
    }
  }
  console.log(); // newline after progress

  console.log(`\nTested ${stressTested} stress-conditioned combinations:`);
  console.log(`  - ${stressSkippedNotBetter} skipped (not better)`);
  console.log(`  - ${stressSkippedCollisions} skipped (would add collisions)`);
  console.log(`  - ${stressImprovements.length} valid improvements found`);

  stressImprovements.sort((a, b) => b.freqNet - a.freqNet);

  if (stressImprovements.length === 0) {
    console.log('\nNo stress-conditioned improvements found.');
  } else {
    console.log(
      '\nRaw Ph. | Base | Current | Better  | Net Gain | Gained | Lost  | Gained/M | Lost/M  | Net/M'
    );
    console.log('─'.repeat(95));
    for (const {
      rawPhoneme,
      basePhoneme,
      from,
      to,
      netGain,
      gained,
      lost,
      freqGained,
      freqLost,
      freqNet,
    } of stressImprovements) {
      console.log(
        `  ${rawPhoneme.padEnd(5)} | ${basePhoneme.padEnd(4)} | ${from.padEnd(7)} | ${to.padEnd(7)} | +${String(netGain).padEnd(6)} | +${String(gained.length).padEnd(5)} | -${String(lost.length).padEnd(4)} | +${fmtPM(freqGained).padEnd(9)} | -${fmtPM(freqLost).padEnd(8)} | ${signedPM(freqNet)}`
      );
    }

    console.log(`\n${'='.repeat(90)}`);
    console.log(`DETAILS FOR TOP STRESS-CONDITIONED IMPROVEMENTS (by frequency)`);
    console.log(`${'='.repeat(90)}`);
    for (const { rawPhoneme, from, to, netGain, gained, lost, freqNet } of stressImprovements.slice(
      0,
      5
    )) {
      console.log(
        `\n${rawPhoneme}: "${from}" → "${to}" (net +${netGain} words, ${signedPM(freqNet)} /M)`
      );
      console.log(`  Top gained: ${topWordsByFreq(gained, 10)}`);
      console.log(`  Top lost:   ${topWordsByFreq(lost, 10)}`);
    }
  }

  // ============================================================
  // PHASE 3: Test combinations (base + stress-conditioned)
  // ============================================================

  console.log(`\n${'='.repeat(60)}`);
  console.log(`TESTING COMBINATIONS`);
  console.log(`${'='.repeat(60)}\n`);

  // Merge all improvements into a unified list sorted by netGain
  type UnifiedImprovement = {
    type: 'base' | 'stress';
    key: string; // base phoneme or raw phoneme
    from: string;
    to: string;
    netGain: number;
    gained: string[];
    lost: string[];
    freqGained: number;
    freqLost: number;
    freqNet: number;
  };

  const allImprovements: UnifiedImprovement[] = [
    ...improvements.map((imp) => ({
      type: 'base' as const,
      key: imp.phoneme,
      from: imp.from,
      to: imp.to,
      netGain: imp.netGain,
      gained: imp.gained,
      lost: imp.lost,
      freqGained: imp.freqGained,
      freqLost: imp.freqLost,
      freqNet: imp.freqNet,
    })),
    ...stressImprovements.map((imp) => ({
      type: 'stress' as const,
      key: imp.rawPhoneme,
      from: imp.from,
      to: imp.to,
      netGain: imp.netGain,
      gained: imp.gained,
      lost: imp.lost,
      freqGained: imp.freqGained,
      freqLost: imp.freqLost,
      freqNet: imp.freqNet,
    })),
  ];
  allImprovements.sort((a, b) => b.freqNet - a.freqNet);

  // Apply all non-conflicting improvements (one per phoneme, best first)
  let bestMap = { ...ARPABET_TO_INGGLISH_MAP };
  let bestStressOverrides = { ...baselineStressOverrides };
  const appliedChanges: UnifiedImprovement[] = [];
  const basePhonemesSeen = new Set<string>();
  const stressPhonemesSeen = new Set<string>();

  for (const imp of allImprovements) {
    if (imp.type === 'base') {
      if (basePhonemesSeen.has(imp.key)) continue;

      const testMap = { ...bestMap, [imp.key]: imp.to };
      const collisions = getCollisionCount(testMap, bestStressOverrides);

      if (collisions <= baselineCollisions) {
        bestMap[imp.key] = imp.to;
        appliedChanges.push(imp);
        basePhonemesSeen.add(imp.key);
        console.log(`✓ Applied ${imp.key}: ${imp.from} → ${imp.to} (${signedPM(imp.freqNet)} /M)`);
      } else {
        console.log(`✗ Skipped ${imp.key}: ${imp.from} → ${imp.to} (would add collisions)`);
      }
    } else {
      if (stressPhonemesSeen.has(imp.key)) continue;

      const testOverrides = { ...bestStressOverrides, [imp.key]: imp.to };
      const collisions = getCollisionCount(bestMap, testOverrides);

      if (collisions <= baselineCollisions) {
        bestStressOverrides[imp.key] = imp.to;
        appliedChanges.push(imp);
        stressPhonemesSeen.add(imp.key);
        console.log(
          `✓ Applied ${imp.key}: ${imp.from} → ${imp.to} (${signedPM(imp.freqNet)} /M) [stress]`
        );
      } else {
        console.log(
          `✗ Skipped ${imp.key}: ${imp.from} → ${imp.to} (would add collisions) [stress]`
        );
      }
    }
  }

  const finalIdentical = getIdenticalWords(bestMap, bestStressOverrides);
  const finalCollisions = getCollisionCount(bestMap, bestStressOverrides);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`FINAL RESULT`);
  console.log(`${'='.repeat(60)}`);
  console.log(
    `\nBefore: ${baselineIdentical.size} identical (${((baselineIdentical.size / allWords.length) * 100).toFixed(2)}%)`
  );
  console.log(
    `After:  ${finalIdentical.size} identical (${((finalIdentical.size / allWords.length) * 100).toFixed(2)}%)`
  );
  console.log(`Gain:   +${finalIdentical.size - baselineIdentical.size} words`);
  console.log(`\nCollisions: ${finalCollisions} (was ${baselineCollisions})`);

  console.log(`\n${'='.repeat(90)}`);
  console.log(`RECOMMENDED CHANGES (sorted by frequency impact)`);
  console.log(`${'='.repeat(90)}\n`);
  for (const imp of appliedChanges) {
    const label = imp.type === 'stress' ? ' [stress-conditioned]' : '';
    console.log(`  ${imp.key}: "${imp.from}" → "${imp.to}" (${signedPM(imp.freqNet)} /M)${label}`);
    console.log(`    Top gained: ${topWordsByFreq(imp.gained, 5)}`);
    console.log(`    Top lost:   ${topWordsByFreq(imp.lost, 5)}`);
  }
}

if (process.argv[1]?.includes('exhaustive-search')) main().catch(console.error);
