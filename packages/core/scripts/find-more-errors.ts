/**
 * Find CMU dictionary pronunciation errors by comparing common words against
 * their inflected forms. Aggressively filters to eliminate false positives.
 *
 * Key insight: if "running" doesn't share the stem phonemes of "run", one of
 * them is wrong. By requiring BOTH forms to be frequent and stems to be long,
 * we eliminate proper nouns, rare words, and coincidental overlaps.
 *
 * Usage: cd packages/core && npx vite-node scripts/find-more-errors.ts
 */

import { loadDictionary, getDictionary } from '@ingglish/dictionary';
import { loadFrequencies, getWordFrequency } from '@ingglish/dictionary';
import { CUSTOM_PRONUNCIATIONS } from '@ingglish/dictionary';

await loadDictionary();
await loadFrequencies();
const cmudict = getDictionary();

const alreadyFixed = new Set(Object.keys(CUSTOM_PRONUNCIATIONS));

// All words without variant markers like "(2)"
const allWords = Object.keys(cmudict).filter((w) => cmudict[w]?.length > 0 && !w.includes('('));
const wordSet = new Set(allWords);

function stripStress(p: string): string {
  return p.replace(/[0-2]$/, '');
}

// Vowel phonemes in CMU (stress-stripped)
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

// Suffix definitions: [textSuffix, expectedPhonemes (stress-stripped)]
// We list multiple phoneme variants for suffixes that can be pronounced differently
const SUFFIX_PATTERNS: [string, string[]][] = [
  // -s/-es
  ['s', ['S']],
  ['s', ['Z']],
  ['es', ['IH', 'Z']],
  ['es', ['AH', 'Z']],
  // -ed
  ['ed', ['D']],
  ['ed', ['T']],
  ['ed', ['IH', 'D']],
  ['ed', ['AH', 'D']],
  // -ing
  ['ing', ['IH', 'NG']],
  ['ing', ['AH', 'NG']],
  // -ly
  ['ly', ['L', 'IY']],
  // -er/-ers
  ['er', ['ER']],
  ['ers', ['ER', 'Z']],
  // -est
  ['est', ['AH', 'S', 'T']],
  ['est', ['IH', 'S', 'T']],
  // -ness
  ['ness', ['N', 'AH', 'S']],
  ['ness', ['N', 'IH', 'S']],
  // -ment/-ments
  ['ment', ['M', 'AH', 'N', 'T']],
  ['ments', ['M', 'AH', 'N', 'T', 'S']],
  // -ful
  ['ful', ['F', 'AH', 'L']],
  // -less
  ['less', ['L', 'AH', 'S']],
  ['less', ['L', 'IH', 'S']],
  // -able/-ible
  ['able', ['AH', 'B', 'AH', 'L']],
  ['ible', ['AH', 'B', 'AH', 'L']],
  // -tion/-tions
  ['tion', ['SH', 'AH', 'N']],
  ['tions', ['SH', 'AH', 'N', 'Z']],
  // -ally
  ['ally', ['AH', 'L', 'IY']],
  // -ously
  ['ously', ['AH', 'S', 'L', 'IY']],
  // -ively
  ['ively', ['IH', 'V', 'L', 'IY']],
];

// Known-legitimate vowel alternation pairs (stress-stripped)
const LEGIT_VOWEL_PAIRS = new Set([
  'AH', // schwa alternates with everything
  'ER', // r-colored vowel alternates freely
]);

function isLegitVowelAlternation(p1: string, p2: string): boolean {
  const b1 = stripStress(p1);
  const b2 = stripStress(p2);
  if (b1 === b2) return true;
  // Skip all vowel-vs-vowel differences (too many legitimate alternations)
  if (isVowel(p1) && isVowel(p2)) return true;
  // AH (schwa) alternation with anything
  if (b1 === 'AH' || b2 === 'AH') return true;
  // ER alternation with anything
  if (b1 === 'ER' || b2 === 'ER') return true;
  return false;
}

// Known-legitimate consonant alternation pairs
function isLegitConsonantAlternation(p1: string, p2: string): boolean {
  const b1 = stripStress(p1);
  const b2 = stripStress(p2);
  if (b1 === b2) return true;
  // N/NG alternation (already handled by normalizeVelarNasal)
  if ((b1 === 'N' && b2 === 'NG') || (b1 === 'NG' && b2 === 'N')) return true;
  // Y/IY alternation (semivowel/vowel boundary — legitimate)
  if ((b1 === 'Y' && b2 === 'IY') || (b1 === 'IY' && b2 === 'Y')) return true;
  // W/UW alternation (semivowel/vowel boundary — legitimate)
  if ((b1 === 'W' && b2 === 'UW') || (b1 === 'UW' && b2 === 'W')) return true;
  return false;
}

// Voicing pairs for final-position alternation before suffix
const VOICING_PAIRS = new Set([
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

interface Mismatch {
  word: string;
  stem: string;
  wordFreq: number;
  stemFreq: number;
  position: number;
  wordPhoneme: string;
  stemPhoneme: string;
  wordPhonemes: string[];
  stemPhonemes: string[];
  maxFreq: number;
}

const results: Mismatch[] = [];
const seenPairs = new Set<string>(); // avoid duplicate word|stem pairs

for (const word of allWords) {
  if (alreadyFixed.has(word)) continue;

  const wordPhonemes = cmudict[word];
  if (!Array.isArray(wordPhonemes) || wordPhonemes.length === 0) continue;

  const wordFreq = getWordFrequency(word) ?? 0;

  for (const [suffix, suffixPhonemes] of SUFFIX_PATTERNS) {
    if (!word.endsWith(suffix)) continue;

    // Try normal stem, e-drop stem, consonant-undoubling stem, and y-stems
    const normalStem = word.slice(0, -suffix.length);
    const eDropStem = normalStem + 'e';
    const stems: string[] = [normalStem];
    // e-drop: only use if normal stem is NOT in the dictionary AND the suffix
    // actually triggers e-dropping in English (ing, ed, er, ers, est, able, ible, ize, ized, izing)
    // NOT for -s/-es (plurals of e-words just add -s: "statue"->"statues" not "status")
    const eDropSuffixes = new Set(['ing', 'ed', 'er', 'ers', 'est', 'able', 'ible', 'ly']);
    if (!wordSet.has(normalStem) && wordSet.has(eDropStem) && eDropSuffixes.has(suffix)) {
      stems.push(eDropStem);
    }
    // Consonant doubling: "running" -> "runn" -> "run"
    if (
      normalStem.length >= 4 &&
      normalStem[normalStem.length - 1] === normalStem[normalStem.length - 2]
    ) {
      const undoubled = normalStem.slice(0, -1);
      if (wordSet.has(undoubled)) stems.push(undoubled);
    }
    // y-stems: "carries" -> "carri" -> "carry" (for -es, -ed suffixes)
    if ((suffix === 'es' || suffix === 'ed') && normalStem.endsWith('i')) {
      const yStem = normalStem.slice(0, -1) + 'y';
      if (wordSet.has(yStem)) stems.push(yStem);
    }

    for (const stem of stems) {
      // Stem must be >= 5 characters
      if (stem.length < 5) continue;

      // Skip already-fixed stems
      if (alreadyFixed.has(stem)) continue;

      // Stem must exist in dictionary
      const stemPhonemes = cmudict[stem];
      if (!stemPhonemes || !Array.isArray(stemPhonemes) || stemPhonemes.length === 0) continue;

      const stemFreq = getWordFrequency(stem) ?? 0;

      // BOTH must have frequency >= 5
      if (wordFreq < 5 || stemFreq < 5) continue;

      // Avoid duplicate pairs
      const pairKey = `${word}|${stem}`;
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);

      // Strip stress from all phonemes for comparison
      const wordBare = wordPhonemes.map(stripStress);
      const stemBare = stemPhonemes.map(stripStress);
      const suffBare = suffixPhonemes.map(stripStress);

      // Check if word ends with the expected suffix phonemes
      const suffixStart = wordBare.length - suffBare.length;
      if (suffixStart < 0) continue;

      let suffixMatches = true;
      for (let i = 0; i < suffBare.length; i++) {
        if (wordBare[suffixStart + i] !== suffBare[i]) {
          suffixMatches = false;
          break;
        }
      }
      if (!suffixMatches) continue;

      // The stem portion of the word's phonemes
      const wordStemPart = wordBare.slice(0, suffixStart);

      // Must be same length as stem phonemes
      if (wordStemPart.length !== stemBare.length) continue;

      // Find divergence positions
      for (let i = 0; i < stemBare.length; i++) {
        if (wordStemPart[i] === stemBare[i]) continue;

        const wp = wordStemPart[i];
        const sp = stemBare[i];

        // Skip legitimate vowel alternations (too noisy)
        if (isLegitVowelAlternation(wordPhonemes[i], stemPhonemes[i])) break;

        // Skip known legitimate consonant alternations
        if (isLegitConsonantAlternation(wp, sp)) break;

        // Skip voicing alternations at the final position before suffix
        if (i === stemBare.length - 1) {
          const pair = `${wp}-${sp}`;
          if (VOICING_PAIRS.has(pair)) break;
        }

        // This is a CONSONANT difference — likely an error!
        const maxFreq = Math.max(wordFreq, stemFreq);
        results.push({
          word,
          stem,
          wordFreq,
          stemFreq,
          position: i,
          wordPhoneme: wordPhonemes[i],
          stemPhoneme: stemPhonemes[i],
          wordPhonemes,
          stemPhonemes,
          maxFreq,
        });
        break; // only report first mismatch per pair
      }
    }
  }
}

// Sort by max frequency descending (most important errors first)
results.sort((a, b) => b.maxFreq - a.maxFreq);

// Deduplicate: if the same stem appears with multiple inflected forms showing
// the same mismatch, keep the highest-frequency one
const seenStemPos = new Set<string>();
const deduped: Mismatch[] = [];
for (const r of results) {
  const key = `${r.stem}|${r.position}|${stripStress(r.wordPhoneme)}|${stripStress(r.stemPhoneme)}`;
  if (seenStemPos.has(key)) continue;
  seenStemPos.add(key);
  deduped.push(r);
}

// Output
console.log('='.repeat(90));
console.log('CMU DICTIONARY ERRORS: Consonant Mismatches in Inflected Forms');
console.log('='.repeat(90));
console.log(`Total raw mismatches: ${results.length}`);
console.log(`After deduplication: ${deduped.length}`);
console.log(`\nFilters applied:`);
console.log(`  - Stem length >= 5 characters`);
console.log(`  - Both word and stem frequency >= 5`);
console.log(`  - Only consonant differences (no vowel alternations)`);
console.log(`  - Skip AH/schwa, ER, N/NG alternations`);
console.log(`  - Skip voicing alternations at final position before suffix`);
console.log(`  - Skip words already in CUSTOM_PRONUNCIATIONS`);
console.log();

const top = deduped.slice(0, 100);
console.log(`Top ${top.length} results (sorted by max frequency):\n`);

for (const r of top) {
  console.log(
    `${r.word} (freq=${r.wordFreq}) vs ${r.stem} (freq=${r.stemFreq}): ` +
      `position ${r.position} — word has ${r.wordPhoneme}, stem has ${r.stemPhoneme}`
  );
  console.log(`  word: [${r.wordPhonemes.join(' ')}]`);
  console.log(`  stem: [${r.stemPhonemes.join(' ')}]`);
}
