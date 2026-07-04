#!/usr/bin/env -S npx vite-node --script
/**
 * Analyze whether current phoneme mappings maximize identical words.
 * An "identical word" is one where the Ingglish spelling equals the English spelling.
 *
 * Run with: npx vite-node --script scripts/analyze-identical-words.ts
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
  // Load dictionary and frequencies
  await Promise.all([loadDictionary(), loadFrequencies()]);
  const cmudict = getDictionary();
  const corpusTotal = getCorpusTotal();
  const toPerMillion = (raw: number) => (raw / corpusTotal) * 1_000_000;

  // Get all words from the dictionary
  const allWords = Object.keys(cmudict).filter((w) => cmudict[w]?.length > 0);
  console.log(`Total words in dictionary: ${allWords.length}`);
  console.log(
    `Frequency unit: per million words of text (SUBTLEX-US, ${(corpusTotal / 1_000_000).toFixed(1)}M word corpus)`
  );

  /**
   * Convert phonemes to Ingglish using a custom mapping.
   * Includes R-colored vowel rules and AH0→'a' schwa split
   * to match the actual arpabetToIngglish() translation.
   */
  function phonemesToIngglish(phonemes: string[], customMap: Record<string, string>): string {
    let result = '';
    const len = phonemes.length;
    for (let i = 0; i < len; i++) {
      const p = phonemes[i];
      const base = p.replace(/[0-2]$/, '');

      // R-colored vowel check: if next phoneme is R
      if (i + 1 < len && phonemes[i + 1] === 'R') {
        const rPrefix = R_COLORED_FORWARD.get(base);
        if (rPrefix !== undefined) {
          result += rPrefix;
          continue;
        }
      }

      // Unstressed schwa AH0 → 'a'
      if (p === 'AH0') {
        result += 'a';
        continue;
      }

      result += customMap[base] || ARPABET_TO_INGGLISH_MAP[base] || base.toLowerCase();
    }
    return result;
  }

  /** Format a per-million frequency value */
  function fmtPM(raw: number): string {
    const pm = toPerMillion(raw);
    if (pm >= 1000) return `${(pm / 1000).toFixed(1)}K`;
    if (pm >= 1) return pm.toFixed(0);
    if (pm >= 0.1) return pm.toFixed(1);
    if (raw > 0) return '<0.1';
    return '0';
  }

  /**
   * Count identical words using a custom mapping override
   */
  function countIdenticalWithMapping(override: Record<string, string>): {
    count: number;
    totalFreq: number;
    examples: string[];
  } {
    const customMap = { ...ARPABET_TO_INGGLISH_MAP, ...override };
    let count = 0;
    let totalFreq = 0;
    const examples: string[] = [];

    for (const word of allWords) {
      const phonemes = cmudict[word];
      if (!phonemes) continue;

      const ingglish = phonemesToIngglish(phonemes, customMap);
      if (ingglish.toLowerCase() === word.toLowerCase()) {
        count++;
        totalFreq += getWordFrequency(word) ?? 0;
        if (examples.length < 5) examples.push(word);
      }
    }

    return { count, totalFreq, examples };
  }

  // Current mappings baseline
  const baseline = countIdenticalWithMapping({});
  console.log(`\n${'='.repeat(70)}`);
  console.log(
    `CURRENT MAPPINGS: ${baseline.count} identical words (${((baseline.count / allWords.length) * 100).toFixed(2)}%)`
  );
  console.log(`${'='.repeat(70)}`);

  // Test alternative mappings for key phonemes
  console.log(`\n${'='.repeat(70)}`);
  console.log(`TESTING ALTERNATIVE MAPPINGS`);
  console.log(`${'='.repeat(70)}`);

  const alternatives: { phoneme: string; current: string; alternatives: string[] }[] = [
    // Vowels - these have the most variation in English spelling
    { phoneme: 'AH', current: 'u', alternatives: ['a', 'o', 'uh'] },
    { phoneme: 'IH', current: 'i', alternatives: ['e', 'y'] },
    { phoneme: 'EH', current: 'e', alternatives: ['a', 'ai'] },
    { phoneme: 'AE', current: 'a', alternatives: ['e', 'ai'] },
    { phoneme: 'AA', current: 'o', alternatives: ['a', 'ah'] },
    { phoneme: 'UH', current: 'oo', alternatives: ['u', 'o'] },
    { phoneme: 'IY', current: 'ee', alternatives: ['i', 'y', 'ie', 'e'] },
    { phoneme: 'EY', current: 'ay', alternatives: ['a', 'ai', 'ey'] },
    { phoneme: 'OW', current: 'oh', alternatives: ['o', 'ow'] },
    { phoneme: 'AO', current: 'aw', alternatives: ['o', 'au', 'a'] },

    // Consonants
    { phoneme: 'K', current: 'k', alternatives: ['c', 'ck'] },
    { phoneme: 'S', current: 's', alternatives: ['c', 'ss'] },
    { phoneme: 'Z', current: 'z', alternatives: ['s', 'zz'] },
    { phoneme: 'F', current: 'f', alternatives: ['ph', 'ff'] },
    { phoneme: 'JH', current: 'j', alternatives: ['g', 'dge'] },
  ];

  console.log(`\nPhoneme | Current | Alt   | Net /M      | Winner`);
  console.log(`${'─'.repeat(55)}`);

  const improvements: { phoneme: string; from: string; to: string; freqDiff: number }[] = [];

  for (const { phoneme, current, alternatives: alts } of alternatives) {
    const currentResult = countIdenticalWithMapping({});

    for (const alt of alts) {
      const altResult = countIdenticalWithMapping({ [phoneme]: alt });
      const freqDiff = altResult.totalFreq - currentResult.totalFreq;
      const winner = freqDiff > 0 ? '← ALT' : freqDiff < 0 ? 'CURRENT →' : 'TIE';

      console.log(
        `  ${phoneme.padEnd(5)} | ${current.padEnd(7)} | ${alt.padEnd(5)} | ${(freqDiff >= 0 ? '+' : '-') + fmtPM(Math.abs(freqDiff)).padEnd(10)} | ${winner}`
      );

      if (freqDiff > 0) {
        improvements.push({ phoneme, from: current, to: alt, freqDiff });
      }
    }
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`SUMMARY`);
  console.log(`${'='.repeat(70)}`);

  if (improvements.length === 0) {
    console.log(
      `\n✓ VERIFIED: Current mappings are OPTIMAL by frequency-weighted identical words.`
    );
    console.log(`  No alternative mapping produces higher frequency-weighted identical words.`);
  } else {
    console.log(`\nAlternatives with positive frequency impact:`);
    improvements.sort((a, b) => b.freqDiff - a.freqDiff);
    for (const { phoneme, from, to, freqDiff } of improvements.slice(0, 10)) {
      console.log(
        `  ${phoneme}: ${from} → ${to} (${freqDiff >= 0 ? '+' : ''}${fmtPM(freqDiff)} /M)`
      );
    }
    console.log(`\n(Note: gains may not be additive - changing one may affect others)`);
  }

  console.log(
    `\nBaseline: ${baseline.count} identical words (${((baseline.count / allWords.length) * 100).toFixed(2)}%)`
  );

  // Test combining top improvements
  console.log(`\n${'='.repeat(70)}`);
  console.log(`TESTING COMBINED IMPROVEMENTS`);
  console.log(`${'='.repeat(70)}`);

  const combinedMappings = {
    OW: 'o',
    AH: 'a',
    Z: 's',
    AO: 'o',
    AA: 'a',
  };

  const combined = countIdenticalWithMapping(combinedMappings);
  console.log(`\nWith combined "identical-maximizing" mappings:`);
  console.log(`  OW→o, AH→a, Z→s, AO→o, AA→a`);
  console.log(
    `  Result: ${combined.count} identical words (${((combined.count / allWords.length) * 100).toFixed(2)}%)`
  );
  console.log(`  Freq gain over current: +${fmtPM(combined.totalFreq - baseline.totalFreq)} /M`);

  console.log(`\n${'='.repeat(70)}`);
  console.log(`WHY DON'T WE USE THESE MAPPINGS?`);
  console.log(`${'='.repeat(70)}`);
  console.log(`
The current mappings prioritize OTHER goals over raw identical word count:

1. DISAMBIGUATION - Different sounds should look different
   - 'go' (OW) vs 'got' (AA) → goh vs got (current) vs go vs gat (alt)
   - Using 'o' for both OW and AA would create ambiguity

2. CONSISTENCY - Same sound should always look the same
   - Z→s would spell 'zero' as 'sero' but 'zebra' can't be 'sebra'

3. PHONETIC CLARITY - Spellings should match sounds
   - AH→a makes 'cup' → 'cap' (confusing with actual 'cap')
   - OW→o makes 'go' → 'go' (identical!) but loses the long-O marker

4. AVOIDING HOMOPHONES - Different words shouldn't become identical
   - Z→s might make 'prize' and 'prise' identical

CONCLUSION: The current mappings balance identical words with readability,
disambiguation, and consistency. Raw identical count isn't the only goal.
`);
}

main().catch(console.error);
