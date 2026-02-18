/**
 * Systematic scan for specific error patterns across the entire CMU dictionary.
 * Unlike pronunciation-consistency.ts which compares related word pairs,
 * this script checks every entry against known phonological rules.
 *
 * Usage: npx vite-node scripts/cmu-error-scan.ts
 */

import { loadDictionary, getDictionary } from '@ingglish/dictionary';
import { CUSTOM_PRONUNCIATIONS } from '@ingglish/dictionary';
import { loadFrequencies, getWordFrequency } from '@ingglish/dictionary';

await loadDictionary();
await loadFrequencies();
const cmudict = getDictionary();

const allWords = Object.keys(cmudict).filter((w) => cmudict[w]?.length > 0 && !w.includes('('));

function stripStress(p: string): string {
  return p.replace(/[0-2]$/, '');
}

// Skip words we've already fixed
const alreadyFixed = new Set(Object.keys(CUSTOM_PRONUNCIATIONS));

// Detect proper nouns (heuristic: word appears only with capital in original dict)
const properNouns = new Set<string>();
// CMU dict lowercases everything, so we can't detect by case.
// Instead, use a heuristic: if the word ends in common name suffixes or is very short
// We'll just filter by frequency — common words are more interesting anyway.

interface ScanError {
  word: string;
  phonemes: string[];
  category: string;
  detail: string;
  position: number;
  frequency: number;
}

const errors: ScanError[] = [];

for (const word of allWords) {
  if (alreadyFixed.has(word)) continue;
  const phonemes = cmudict[word];
  if (!Array.isArray(phonemes)) continue;
  const bare = phonemes.map(stripStress);
  const freq = getWordFrequency(word) ?? 0;

  // ============================================================
  // Pattern 1: N before K or G (should be NG)
  // Now handled by normalizeVelarNasal in lookup.ts — still count for stats
  // ============================================================
  for (let i = 0; i < bare.length - 1; i++) {
    if (bare[i] === 'N' && (bare[i + 1] === 'K' || bare[i + 1] === 'G')) {
      errors.push({
        word,
        phonemes,
        frequency: freq,
        category: 'N-before-velar',
        detail: `N ${bare[i + 1]} at position ${i}`,
        position: i,
      });
    }
  }

  // ============================================================
  // Pattern 2: -tion/-sion with CH instead of SH
  // The suffix -tion/-sion is always /ʃ/ (SH), never /tʃ/ (CH)
  // e.g., "intention" CMU has CH but should be SH
  // ============================================================
  if (
    word.endsWith('tion') ||
    word.endsWith('sion') ||
    word.endsWith('tions') ||
    word.endsWith('sions')
  ) {
    for (let i = 0; i < bare.length - 2; i++) {
      if (bare[i] === 'CH' && bare[i + 1] === 'AH' && bare[i + 2] === 'N') {
        errors.push({
          word,
          phonemes,
          frequency: freq,
          category: 'tion-CH-instead-of-SH',
          detail: `CH AH N at position ${i} in -tion/-sion word`,
          position: i,
        });
      }
    }
  }

  // ============================================================
  // Pattern 3: Y-glide before UW after coronal consonants
  // In American English, Y is dropped after T, D, N, S, Z, L
  // e.g., "tune" is /tuːn/ not /tjuːn/ in AmE
  // ============================================================
  const coronals = new Set(['T', 'D', 'N', 'S', 'Z', 'L']);
  for (let i = 0; i < bare.length - 2; i++) {
    if (coronals.has(bare[i]) && bare[i + 1] === 'Y' && bare[i + 2] === 'UW') {
      errors.push({
        word,
        phonemes,
        frequency: freq,
        category: 'Y-glide-after-coronal',
        detail: `${bare[i]} Y UW at position ${i} (AmE drops Y after coronals)`,
        position: i + 1,
      });
    }
  }

  // ============================================================
  // Pattern 4: Stem-mismatch for common words (improved filtering)
  // Skip words with frequency 0 (very rare/unknown) in both word and stem
  // Focus on consonant mismatches (more likely errors than vowel alternations)
  // ============================================================
  const simpleSuffixes: [string, string[]][] = [
    ['s', ['S']],
    ['s', ['Z']],
    ['es', ['IH0', 'Z']],
    ['es', ['AH0', 'Z']],
    ['ed', ['D']],
    ['ed', ['T']],
    ['ed', ['IH0', 'D']],
    ['ing', ['IH0', 'NG']],
    ['ly', ['L', 'IY0']],
    ['er', ['ER0']],
    ['ers', ['ER0', 'Z']],
    ['est', ['AH0', 'S', 'T']],
    ['ness', ['N', 'AH0', 'S']],
    ['ness', ['N', 'IH0', 'S']],
    ['ment', ['M', 'AH0', 'N', 'T']],
    ['ments', ['M', 'AH0', 'N', 'T', 'S']],
    ['ful', ['F', 'AH0', 'L']],
    ['less', ['L', 'AH0', 'S']],
    ['less', ['L', 'IH0', 'S']],
    ['able', ['AH0', 'B', 'AH0', 'L']],
    ['ize', ['AY0', 'Z']],
    ['ized', ['AY0', 'Z', 'D']],
    ['izes', ['AY0', 'Z', 'IH0', 'Z']],
    ['izing', ['AY0', 'Z', 'IH0', 'NG']],
    ['tion', ['SH', 'AH0', 'N']],
    ['tions', ['SH', 'AH0', 'N', 'Z']],
    ['ally', ['AH0', 'L', 'IY0']],
    ['ously', ['AH0', 'S', 'L', 'IY0']],
    ['ively', ['IH0', 'V', 'L', 'IY0']],
  ];

  for (const suffixGroup of [simpleSuffixes]) {
    for (const [suffix, suffixPhonemes] of suffixGroup) {
      if (!word.endsWith(suffix)) continue;
      if (word.length <= suffix.length + 2) continue;

      // Try both normal stem and e-drop stem
      const stems = [word.slice(0, -suffix.length)];
      if (suffix !== 'e') stems.push(word.slice(0, -suffix.length) + 'e');

      for (const stem of stems) {
        const stemPhonemes = cmudict[stem];
        if (!stemPhonemes || !Array.isArray(stemPhonemes) || alreadyFixed.has(stem)) continue;

        // Require at least one of word/stem to have non-zero frequency
        const stemFreq = getWordFrequency(stem) ?? 0;
        if (freq === 0 && stemFreq === 0) continue;

        const wordBare = phonemes.map(stripStress);
        const stemBare = stemPhonemes.map(stripStress);
        const expectedSuffixBare = suffixPhonemes.map(stripStress);

        // Check if word ends with the expected suffix phonemes
        let suffixMatches = true;
        const suffixStart = wordBare.length - expectedSuffixBare.length;
        if (suffixStart < 0) continue;
        for (let i = 0; i < expectedSuffixBare.length; i++) {
          if (wordBare[suffixStart + i] !== expectedSuffixBare[i]) {
            suffixMatches = false;
            break;
          }
        }
        if (!suffixMatches) continue;

        const wordStemPart = wordBare.slice(0, suffixStart);
        if (wordStemPart.length !== stemBare.length) continue;

        // Find divergence
        for (let i = 0; i < stemBare.length; i++) {
          if (wordStemPart[i] !== stemBare[i]) {
            const p1 = wordStemPart[i];
            const p2 = stemBare[i];
            // Skip known legitimate alternations
            if (p1 === 'AH' || p2 === 'AH') break; // schwa
            if ((p1 === 'IY' && p2 === 'IH') || (p1 === 'IH' && p2 === 'IY')) break;
            if ((p1 === 'AE' && p2 === 'EH') || (p1 === 'EH' && p2 === 'AE')) break;
            if ((p1 === 'AA' && p2 === 'AO') || (p1 === 'AO' && p2 === 'AA')) break;
            if (p1 === 'ER' || p2 === 'ER') break;
            // N vs NG (already handled by normalizeVelarNasal)
            if ((p1 === 'N' && p2 === 'NG') || (p1 === 'NG' && p2 === 'N')) break;
            // Voicing at last position before suffix
            if (i === stemBare.length - 1) {
              const voicePairs = new Set([
                'S-Z',
                'Z-S',
                'T-D',
                'D-T',
                'P-B',
                'B-P',
                'K-G',
                'G-K',
                'F-V',
                'V-F',
                'TH-DH',
                'DH-TH',
                'SH-ZH',
                'ZH-SH',
                'CH-JH',
                'JH-CH',
              ]);
              if (voicePairs.has(`${p1}-${p2}`) || voicePairs.has(`${p2}-${p1}`)) break;
            }

            const isEdrop = stem.endsWith('e') && !word.slice(0, -suffix.length).endsWith('e');
            errors.push({
              word,
              phonemes,
              frequency: Math.max(freq, stemFreq),
              category: isEdrop ? 'stem-mismatch-edrop' : 'stem-mismatch',
              detail: `"${word}" vs stem "${stem}": phoneme ${i} is ${phonemes[i]} but stem has ${stemPhonemes[i]}`,
              position: i,
            });
            break;
          }
        }
      }
    }
  }

  // ============================================================
  // Pattern 5: TH/DH voicing errors
  // Check words where related forms use different TH/DH
  // Also check known patterns: "th" between vowels is usually DH
  // ============================================================
  // (Handled within stem-mismatch; adding specific well-known pattern)
  // Function words and demonstratives should use DH, not TH
  const dhWords = new Set([
    'the',
    'this',
    'that',
    'these',
    'those',
    'they',
    'them',
    'their',
    'theirs',
    'there',
    'than',
    'then',
    'thus',
    'though',
    'therefore',
    'thereby',
    'thereafter',
    'therein',
    'thereof',
    'thereupon',
    'thence',
  ]);
  if (dhWords.has(word) && bare[0] === 'TH') {
    errors.push({
      word,
      phonemes,
      frequency: freq,
      category: 'TH-should-be-DH',
      detail: `Function word "${word}" starts with TH but should use DH`,
      position: 0,
    });
  }

  // ============================================================
  // Pattern 6: Duplicate phonemes (likely typos)
  // ============================================================
  for (let i = 0; i < bare.length - 1; i++) {
    if (bare[i] === bare[i + 1]) {
      const isLegitGeminate =
        // Compound boundaries where doubling is expected
        (bare[i] === 'N' && word.includes('nn')) ||
        (bare[i] === 'L' && word.includes('ll')) ||
        (bare[i] === 'R' && word.includes('rr')) ||
        (bare[i] === 'S' && word.includes('ss')) ||
        (bare[i] === 'T' && word.includes('tt')) ||
        (bare[i] === 'P' && word.includes('pp')) ||
        (bare[i] === 'K' && (word.includes('kk') || word.includes('cc') || word.includes('ck'))) ||
        // ER ER is common and usually correct (emperor, caterer, etc.)
        bare[i] === 'ER' ||
        // Vowel sequences in spelled-out abbreviations (CEO = S IY IY OW)
        (bare[i] === 'IY' && word.length <= 3) ||
        (bare[i] === 'EY' && word.length <= 3) ||
        // OW OW in "co-" prefix compounds
        (bare[i] === 'OW' && word.startsWith('co')) ||
        // Compound word boundaries (bomb+maker, bird+dog, candle+light, etc.)
        (bare[i] === 'M' && word.includes('mm')) ||
        (bare[i] === 'D' && word.includes('dd')) ||
        (bare[i] === 'B' && word.includes('bb')) ||
        (bare[i] === 'G' && word.includes('gg'));

      if (!isLegitGeminate) {
        errors.push({
          word,
          phonemes,
          frequency: freq,
          category: 'duplicate-phoneme',
          detail: `${bare[i]} ${bare[i]} at positions ${i}-${i + 1}`,
          position: i,
        });
      }
    }
  }

  // ============================================================
  // Pattern 7: Missing phonemes in derived words
  // Words where the derived form has fewer phonemes than stem + suffix
  // (suggesting a phoneme was dropped in transcription)
  // ============================================================
  // (Covered by stem-mismatch when phoneme counts differ — not reported as divergence)
}

// ============================================================
// Report results
// ============================================================

// Group by category
const byCategory = new Map<string, ScanError[]>();
for (const err of errors) {
  const cat = err.category;
  if (!byCategory.has(cat)) byCategory.set(cat, []);
  byCategory.get(cat)!.push(err);
}

console.log('='.repeat(80));
console.log('CMU DICTIONARY ERROR SCAN RESULTS');
console.log('='.repeat(80));
console.log(`Total errors found: ${errors.length}\n`);

// Print summary
for (const [cat, errs] of [...byCategory.entries()].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${cat.padEnd(30)} ${errs.length} errors`);
}

// Detailed output for each category, sorted by frequency
for (const [cat, errs] of [...byCategory.entries()].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${cat.toUpperCase()} (${errs.length} errors)`);
  console.log('='.repeat(60));

  // Sort by frequency (most common words first)
  const sorted = errs.sort((a, b) => b.frequency - a.frequency);

  if (cat === 'N-before-velar') {
    console.log(`(All handled by normalizeVelarNasal in lookup.ts)`);
    console.log(`\nTop 20 most common affected words:`);
    for (const err of sorted.slice(0, 20)) {
      console.log(
        `  ${err.word.padEnd(20)} freq=${err.frequency.toString().padEnd(8)} ${err.phonemes.join(' ')}`
      );
    }
  } else if (cat === 'tion-CH-instead-of-SH') {
    console.log(`\nAll words with CH instead of SH in -tion/-sion:`);
    for (const err of sorted) {
      console.log(
        `  ${err.word.padEnd(25)} freq=${err.frequency.toString().padEnd(8)} ${err.phonemes.join(' ')}`
      );
    }
  } else if (cat === 'Y-glide-after-coronal') {
    console.log(`\nTop 50 most common words with Y-glide after coronal:`);
    for (const err of sorted.slice(0, 50)) {
      console.log(
        `  ${err.word.padEnd(25)} freq=${err.frequency.toString().padEnd(8)} ${err.phonemes.join(' ')}`
      );
    }
    if (sorted.length > 50) {
      console.log(`  ... and ${sorted.length - 50} more`);
    }
  } else if (cat === 'duplicate-phoneme') {
    console.log(`\nAll duplicate phoneme errors:`);
    for (const err of sorted) {
      console.log(
        `  ${err.word.padEnd(20)} freq=${err.frequency.toString().padEnd(8)} ${err.phonemes.join(' ').padEnd(40)} ${err.detail}`
      );
    }
  } else if (cat === 'TH-should-be-DH') {
    for (const err of sorted) {
      console.log(`  ${err.word.padEnd(20)} ${err.phonemes.join(' ')}`);
    }
  } else {
    // stem-mismatch categories
    console.log(`\nTop 80 most common stem-mismatch errors:`);
    for (const err of sorted.slice(0, 80)) {
      console.log(`  ${err.detail}`);
      console.log(`    ${err.word}: ${err.phonemes.join(' ')}  (freq=${err.frequency})`);
      const stemWord = err.detail.match(/stem "([^"]+)"/)?.[1];
      if (stemWord && cmudict[stemWord]) {
        console.log(`    ${stemWord}: ${cmudict[stemWord].join(' ')}`);
      }
    }
    if (sorted.length > 80) {
      console.log(`  ... and ${sorted.length - 80} more`);
    }
  }
}
