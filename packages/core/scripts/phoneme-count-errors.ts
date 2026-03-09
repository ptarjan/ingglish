/**
 * Find CMU dictionary errors by checking inflected forms against their stems.
 *
 * If "forge" has 3 phonemes and "forging" should be forge's 3 + IH0 NG = 5,
 * but CMU has 4, that means a phoneme was dropped (or added).
 *
 * Usage: cd packages/core && npx vite-node scripts/phoneme-count-errors.ts
 */

import { loadDictionary, getDictionary } from '@ingglish/dictionary';
import { loadFrequencies, getWordFrequency } from '@ingglish/dictionary';
import { CUSTOM_PRONUNCIATIONS } from '@ingglish/dictionary';
import { parseWordLimit } from './g2p/eval-g2p.js';

await loadDictionary();
await loadFrequencies();
const limit = parseWordLimit();
const cmudict = getDictionary();

// All words without variant markers like (2)
const allWords = Object.keys(cmudict).filter((w) => cmudict[w]?.length > 0 && !w.includes('('));

// Skip words we've already fixed
const alreadyFixed = new Set(Object.keys(CUSTOM_PRONUNCIATIONS));

// Suffix definitions: [spelling suffix, phoneme suffix]
// Some suffixes have multiple possible phoneme realizations
const SUFFIX_DEFS: [string, string[]][] = [
  // -s/-es plurals and 3rd person
  ['s', ['S']],
  ['s', ['Z']],
  ['es', ['IH0', 'Z']],
  ['es', ['AH0', 'Z']],

  // -ed past tense
  ['ed', ['D']],
  ['ed', ['T']],
  ['ed', ['IH0', 'D']],
  ['ed', ['AH0', 'D']],

  // -ing progressive
  ['ing', ['IH0', 'NG']],

  // -ly adverb
  ['ly', ['L', 'IY0']],

  // -er comparative / agent
  ['er', ['ER0']],
  ['ers', ['ER0', 'Z']],

  // -ness
  ['ness', ['N', 'AH0', 'S']],
  ['ness', ['N', 'IH0', 'S']],

  // -ment
  ['ment', ['M', 'AH0', 'N', 'T']],
  ['ments', ['M', 'AH0', 'N', 'T', 'S']],

  // -ful
  ['ful', ['F', 'AH0', 'L']],

  // -less
  ['less', ['L', 'AH0', 'S']],
  ['less', ['L', 'IH0', 'S']],

  // -tion/-tions
  ['tion', ['SH', 'AH0', 'N']],
  ['tions', ['SH', 'AH0', 'N', 'Z']],
];

function stripStress(p: string): string {
  return p.replace(/[0-2]$/, '');
}

interface PhonemeCountError {
  word: string;
  stem: string;
  wordPhonemes: string[];
  stemPhonemes: string[];
  suffixSpelling: string;
  suffixPhonemes: string[];
  expectedCount: number;
  actualCount: number;
  diff: number; // positive = extra phoneme in word, negative = missing phoneme
  frequency: number;
}

const errors: PhonemeCountError[] = [];
// Track word+stem pairs we've already reported to avoid duplicates
const reported = new Set<string>();

let count = 0;
for (const word of allWords) {
  if (alreadyFixed.has(word)) continue;
  if (++count > limit) break;

  const wordPhonemes = cmudict[word];
  if (!Array.isArray(wordPhonemes)) continue;

  const wordFreq = getWordFrequency(word) ?? 0;

  for (const [suffix, suffixPhonemes] of SUFFIX_DEFS) {
    if (!word.endsWith(suffix)) continue;
    if (word.length <= suffix.length + 2) continue; // stem must be at least 3 chars

    // Try normal stem and e-drop stem
    const normalStem = word.slice(0, -suffix.length);
    const eDropStem = normalStem + 'e';
    const stems = [normalStem, eDropStem];

    for (const stem of stems) {
      if (alreadyFixed.has(stem)) continue;
      const stemPhonemes = cmudict[stem];
      if (!stemPhonemes || !Array.isArray(stemPhonemes)) continue;

      const stemFreq = getWordFrequency(stem) ?? 0;

      // Both must have freq >= 5
      if (wordFreq < 5 || stemFreq < 5) continue;

      // Calculate expected phoneme count
      const expectedCount = stemPhonemes.length + suffixPhonemes.length;
      const actualCount = wordPhonemes.length;
      const diff = actualCount - expectedCount;

      // Only report if off by exactly 1 (missing or extra phoneme)
      if (Math.abs(diff) !== 1) continue;

      // Deduplicate: only report first suffix match per word+stem pair
      const key = `${word}|${stem}`;
      if (reported.has(key)) continue;
      reported.add(key);

      const freq = Math.max(wordFreq, stemFreq);

      errors.push({
        word,
        stem,
        wordPhonemes,
        stemPhonemes,
        suffixSpelling: suffix,
        suffixPhonemes,
        expectedCount,
        actualCount,
        diff,
        frequency: freq,
      });
    }
  }
}

// Sort by frequency descending
errors.sort((a, b) => b.frequency - a.frequency);

// Print results
console.log('='.repeat(90));
console.log('PHONEME COUNT ERRORS: inflected form has wrong number of phonemes');
console.log('='.repeat(90));
console.log(`Total errors found: ${errors.length}`);
console.log(`  Missing phoneme (actual < expected): ${errors.filter((e) => e.diff < 0).length}`);
console.log(`  Extra phoneme (actual > expected):   ${errors.filter((e) => e.diff > 0).length}`);
console.log();

// Show top 100
const top = errors.slice(0, 100);
for (let i = 0; i < top.length; i++) {
  const e = top[i];
  const diffLabel = e.diff < 0 ? 'MISSING' : 'EXTRA';
  const stemBare = e.stemPhonemes.map(stripStress).join(' ');
  const wordBare = e.wordPhonemes.map(stripStress).join(' ');
  const suffixBare = e.suffixPhonemes.map(stripStress).join(' ');

  console.log(
    `${String(i + 1).padStart(3)}. ${e.word.padEnd(22)} freq=${String(e.frequency).padStart(7)}  ${diffLabel} phoneme`
  );
  console.log(`     stem "${e.stem}" (${e.stemPhonemes.length}p): ${stemBare}`);
  console.log(`     suffix -${e.suffixSpelling} (${e.suffixPhonemes.length}p): ${suffixBare}`);
  console.log(`     expected ${e.expectedCount}p, actual ${e.actualCount}p: ${wordBare}`);
  console.log();
}
