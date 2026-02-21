#!/usr/bin/env npx vite-node
/**
 * Find CMU dictionary errors by comparing prefixed words to their base forms.
 *
 * Strategy: For words like "undo", strip the prefix "un" to get "do", then
 * verify the prefixed word's phonemes match [prefix phonemes] + [base phonemes].
 * Consonant mismatches after the prefix are likely CMU dictionary errors.
 *
 * Usage: cd packages/core && npx vite-node scripts/prefix-consistency-scan.ts
 */

import { loadDictionary, getDictionary } from '@ingglish/dictionary';
import { loadFrequencies, getWordFrequency } from '@ingglish/dictionary';
import { getCustomPronunciation } from '@ingglish/dictionary';

await loadDictionary();
await loadFrequencies();
const cmudict = getDictionary();

// All words without variant markers like "(2)"
const allWords = Object.keys(cmudict).filter((w) => cmudict[w]?.length > 0 && !w.includes('('));
const wordSet = new Set(allWords);

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

// Prefix definitions: [textPrefix, ...possible phoneme sequences]
// Each prefix can have multiple valid pronunciations
const PREFIX_DEFS: { text: string; phonemes: string[][] }[] = [
  {
    text: 'un',
    phonemes: [
      ['AH', 'N'],
      ['AH', 'NG'],
    ],
  },
  {
    text: 're',
    phonemes: [
      ['R', 'IY'],
      ['R', 'IH'],
      ['R', 'EH'],
      ['R', 'AH'],
    ],
  },
  {
    text: 'dis',
    phonemes: [
      ['D', 'IH', 'S'],
      ['D', 'IH', 'Z'],
      ['D', 'AH', 'S'],
      ['D', 'AH', 'Z'],
    ],
  },
  {
    text: 'mis',
    phonemes: [
      ['M', 'IH', 'S'],
      ['M', 'IH', 'Z'],
      ['M', 'AH', 'S'],
      ['M', 'AH', 'Z'],
    ],
  },
  {
    text: 'pre',
    phonemes: [
      ['P', 'R', 'IY'],
      ['P', 'R', 'IH'],
      ['P', 'R', 'EH'],
      ['P', 'R', 'AH'],
    ],
  },
  { text: 'over', phonemes: [['OW', 'V', 'ER']] },
  { text: 'under', phonemes: [['AH', 'N', 'D', 'ER']] },
  { text: 'out', phonemes: [['AW', 'T']] },
  { text: 'up', phonemes: [['AH', 'P']] },
  {
    text: 'non',
    phonemes: [
      ['N', 'AA', 'N'],
      ['N', 'AH', 'N'],
    ],
  },
  {
    text: 'anti',
    phonemes: [
      ['AE', 'N', 'T', 'IY'],
      ['AE', 'N', 'T', 'AH'],
      ['AE', 'N', 'AY'],
      ['AE', 'N', 'T', 'IH'],
    ],
  },
  {
    text: 'counter',
    phonemes: [
      ['K', 'AW', 'N', 'T', 'ER'],
      ['K', 'AW', 'N', 'ER'],
    ],
  },
  { text: 'super', phonemes: [['S', 'UW', 'P', 'ER']] },
  {
    text: 'semi',
    phonemes: [
      ['S', 'EH', 'M', 'IY'],
      ['S', 'EH', 'M', 'AY'],
      ['S', 'EH', 'M', 'IH'],
    ],
  },
  { text: 'sub', phonemes: [['S', 'AH', 'B']] },
  {
    text: 'inter',
    phonemes: [
      ['IH', 'N', 'T', 'ER'],
      ['IH', 'N', 'ER'],
    ],
  },
  { text: 'intra', phonemes: [['IH', 'N', 'T', 'R', 'AH']] },
  { text: 'extra', phonemes: [['EH', 'K', 'S', 'T', 'R', 'AH']] },
  { text: 'ultra', phonemes: [['AH', 'L', 'T', 'R', 'AH']] },
  {
    text: 'multi',
    phonemes: [
      ['M', 'AH', 'L', 'T', 'IY'],
      ['M', 'AH', 'L', 'T', 'IH'],
      ['M', 'AH', 'L', 'AH'],
    ],
  },
  { text: 'mega', phonemes: [['M', 'EH', 'G', 'AH']] },
  {
    text: 'micro',
    phonemes: [
      ['M', 'AY', 'K', 'R', 'OW'],
      ['M', 'AY', 'K', 'R', 'AH'],
    ],
  },
];

// Voicing pairs: S/Z alternation is normal when a prefix ending in a vowel
// attaches to a base starting with S (intervocalic voicing), and SH/ZH is similar.
// These are NOT dictionary errors.
const VOICING_PAIRS = new Set(['S-Z', 'Z-S', 'SH-ZH', 'ZH-SH', 'SH-CH', 'CH-SH']);

// Known legitimate consonant alternation pairs
function isLegitConsonantAlternation(p1: string, p2: string): boolean {
  const b1 = stripStress(p1);
  const b2 = stripStress(p2);
  if (b1 === b2) return true;
  // N/NG alternation (handled by normalizeVelarNasal)
  if ((b1 === 'N' && b2 === 'NG') || (b1 === 'NG' && b2 === 'N')) return true;
  // Y/IY alternation (semivowel/vowel boundary)
  if ((b1 === 'Y' && b2 === 'IY') || (b1 === 'IY' && b2 === 'Y')) return true;
  // W/UW alternation (semivowel/vowel boundary)
  if ((b1 === 'W' && b2 === 'UW') || (b1 === 'UW' && b2 === 'W')) return true;
  // ER/R alternation (r-coloring)
  if ((b1 === 'ER' && b2 === 'R') || (b1 === 'R' && b2 === 'ER')) return true;
  // Voicing alternations (S/Z, SH/ZH, SH/CH) — normal in prefix attachment
  if (VOICING_PAIRS.has(`${b1}-${b2}`)) return true;
  // T/D alternation (voicing at morpheme boundary)
  if ((b1 === 'T' && b2 === 'D') || (b1 === 'D' && b2 === 'T')) return true;
  return false;
}

/**
 * Try to match prefix phonemes at the start of the word's phonemes.
 * Returns the number of phonemes consumed by the prefix, or -1 if no match.
 */
function matchPrefixPhonemes(wordBare: string[], prefixVariants: string[][]): number {
  for (const variant of prefixVariants) {
    if (variant.length > wordBare.length) continue;
    let matches = true;
    for (let i = 0; i < variant.length; i++) {
      if (wordBare[i] !== variant[i]) {
        matches = false;
        break;
      }
    }
    if (matches) return variant.length;
  }
  return -1;
}

interface PrefixMismatch {
  word: string;
  base: string;
  prefix: string;
  wordFreq: number;
  baseFreq: number;
  maxFreq: number;
  position: number; // position in the base phonemes where mismatch occurs
  wordPhoneme: string; // the phoneme in the prefixed word (at suffix portion)
  basePhoneme: string; // the phoneme in the base word
  wordPhonemes: string[];
  basePhonemes: string[];
  prefixLen: number; // number of prefix phonemes consumed
  mismatchType: 'consonant-diff' | 'length-diff';
  details: string;
}

// Words that look like prefix+base but are actually unrelated etymologically.
// These are false prefix splits where the word's meaning/origin doesn't involve the prefix.
const FALSE_PREFIX_SPLITS = new Set([
  // re+X false splits
  'reaches', // not re+aches
  'realms', // not re+alms
  'renoir', // proper noun, not re+noir
  'revenue', // not re+venue (Latin revenire)
  'recount', // ambiguous: can be re+count or "narrate"
  'record', // noun vs verb stress difference
  'records',
  // pre+X false splits
  'preaches', // not pre+aches; it's "preaches" from "preach"
  // up+X false splits
  'uppity', // not up+pity
  // out+X where the pronunciation legitimately changes
  'outward', // "ward" /wɔːrd/ -> "outward" /aʊtwɝd/ is legitimate vowel reduction
  'outwards', // same as outward
  // dis+X false splits where double-S causes expected phoneme absorption
  'dissent', // dis+sent: the S in "sent" merges with "dis" final S
  'disservice', // dis+service: same double-S merger
  'dissolve', // dis+solve: same pattern
  'dissolved',
  'dissolves',
  'dissolving',
  'dissolution',
  'dissimilar', // dis+similar: same pattern
  'dissatisfied', // dis+satisfied: same pattern
  'dissatisfaction', // dis+satisfaction: same pattern
  'disembodied', // dis+embodied: M/MB boundary assimilation
]);

const results: PrefixMismatch[] = [];
const seenPairs = new Set<string>();

for (const word of allWords) {
  // Skip words already fixed in custom pronunciations
  if (getCustomPronunciation(word) !== undefined) continue;

  const wordPhonemes = cmudict[word];
  if (!Array.isArray(wordPhonemes) || wordPhonemes.length === 0) continue;

  const wordFreq = getWordFrequency(word) ?? 0;
  if (wordFreq < 5) continue;

  const wordBare = stripStressAll(wordPhonemes);

  for (const prefixDef of PREFIX_DEFS) {
    const { text: prefixText, phonemes: prefixVariants } = prefixDef;

    // Check if spelling starts with this prefix
    if (!word.startsWith(prefixText)) continue;

    const base = word.slice(prefixText.length);

    // Base must be >= 4 characters and exist in dictionary
    if (base.length < 4) continue;
    if (!wordSet.has(base)) continue;

    // Skip base words already in custom pronunciations
    if (getCustomPronunciation(base) !== undefined) continue;

    const basePhonemes = cmudict[base];
    if (!Array.isArray(basePhonemes) || basePhonemes.length === 0) continue;

    const baseFreq = getWordFrequency(base) ?? 0;
    if (baseFreq < 5) continue;

    // Avoid duplicate pairs
    const pairKey = `${word}|${base}`;
    if (seenPairs.has(pairKey)) continue;
    seenPairs.add(pairKey);

    // Skip known false prefix splits
    if (FALSE_PREFIX_SPLITS.has(word)) continue;

    const baseBare = stripStressAll(basePhonemes);

    // Try to match prefix phonemes at the start of the word
    const prefixLen = matchPrefixPhonemes(wordBare, prefixVariants);
    if (prefixLen < 0) continue;

    // The remainder of the word's phonemes after the prefix
    const wordSuffix = wordBare.slice(prefixLen);

    const lengthDiff = wordSuffix.length - baseBare.length;

    // Skip expected Y-glide drop: when a prefix ending in a vowel attaches to a
    // base starting with Y+UW (e.g., re+unite -> /riːjuːnaɪt/ drops the Y),
    // the Y is naturally absorbed. This is not a dictionary error.
    if (
      lengthDiff === -1 &&
      baseBare[0] === 'Y' &&
      baseBare.length >= 2 &&
      baseBare[1] === 'UW' &&
      wordSuffix[0] === 'UW'
    ) {
      continue;
    }

    // Handle same-length case: look for consonant differences
    if (lengthDiff === 0) {
      for (let i = 0; i < baseBare.length; i++) {
        if (wordSuffix[i] === baseBare[i]) continue;

        // Skip vowel-only differences (normal in prefix attachment due to stress shifts)
        if (isVowel(wordSuffix[i]) && isVowel(baseBare[i])) continue;

        // Skip known legitimate consonant alternations
        if (isLegitConsonantAlternation(wordSuffix[i], baseBare[i])) continue;

        // This is a consonant difference — likely an error!
        const maxFreq = Math.max(wordFreq, baseFreq);
        results.push({
          word,
          base,
          prefix: prefixText,
          wordFreq,
          baseFreq,
          maxFreq,
          position: i,
          wordPhoneme: wordPhonemes[prefixLen + i],
          basePhoneme: basePhonemes[i],
          wordPhonemes,
          basePhonemes,
          prefixLen,
          mismatchType: 'consonant-diff',
          details: `position ${i}: word has ${stripStress(wordPhonemes[prefixLen + i])}, base has ${stripStress(basePhonemes[i])}`,
        });
        break; // only report first mismatch per pair
      }
    } else if (Math.abs(lengthDiff) <= 2) {
      // Handle small length differences (extra or missing phonemes)
      // Align from the start to find where the divergence is
      const minLen = Math.min(wordSuffix.length, baseBare.length);
      let prefixMatches = 0;
      for (let i = 0; i < minLen; i++) {
        const ws = wordSuffix[i];
        const bs = baseBare[i];
        if (ws === bs || (isVowel(ws) && isVowel(bs)) || isLegitConsonantAlternation(ws, bs)) {
          prefixMatches++;
        } else {
          break;
        }
      }

      let suffixMatches = 0;
      for (let i = 0; i < minLen - prefixMatches; i++) {
        const wi = wordSuffix.length - 1 - i;
        const bi = baseBare.length - 1 - i;
        const ws = wordSuffix[wi];
        const bs = baseBare[bi];
        if (ws === bs || (isVowel(ws) && isVowel(bs)) || isLegitConsonantAlternation(ws, bs)) {
          suffixMatches++;
        } else {
          break;
        }
      }

      const totalMatches = prefixMatches + suffixMatches;
      const maxLen = Math.max(wordSuffix.length, baseBare.length);
      const matchPct = totalMatches / maxLen;

      // Require >= 75% match to be confident this is a real prefix attachment
      if (matchPct >= 0.75) {
        const maxFreq = Math.max(wordFreq, baseFreq);
        const extraOrMissing =
          lengthDiff > 0
            ? `${lengthDiff} extra phoneme(s) in prefixed form`
            : `${Math.abs(lengthDiff)} missing phoneme(s) in prefixed form`;
        results.push({
          word,
          base,
          prefix: prefixText,
          wordFreq,
          baseFreq,
          maxFreq,
          position: prefixMatches,
          wordPhoneme: wordSuffix[prefixMatches] ?? '(end)',
          basePhoneme: baseBare[prefixMatches] ?? '(end)',
          wordPhonemes,
          basePhonemes,
          prefixLen,
          mismatchType: 'length-diff',
          details: `${extraOrMissing}: suffix has ${wordSuffix.length}, base has ${baseBare.length} phonemes (${(matchPct * 100).toFixed(0)}% match)`,
        });
      }
    }
  }
}

// Sort by max frequency descending (most important errors first)
results.sort((a, b) => b.maxFreq - a.maxFreq);

// Deduplicate: if the same base appears with multiple prefixed forms showing
// the same mismatch, keep the highest-frequency one
const seenBasePos = new Set<string>();
const deduped: PrefixMismatch[] = [];
for (const r of results) {
  const key = `${r.base}|${r.position}|${stripStress(r.wordPhoneme)}|${stripStress(r.basePhoneme)}`;
  if (seenBasePos.has(key)) continue;
  seenBasePos.add(key);
  deduped.push(r);
}

// Output
console.log('='.repeat(90));
console.log('PREFIX CONSISTENCY SCAN: Consonant Mismatches in Prefixed Words');
console.log('='.repeat(90));
console.log(`Total raw mismatches: ${results.length}`);
console.log(`After deduplication: ${deduped.length}`);
const consonantDiffs = deduped.filter((r) => r.mismatchType === 'consonant-diff');
const lengthDiffs = deduped.filter((r) => r.mismatchType === 'length-diff');
console.log(`  Consonant differences: ${consonantDiffs.length}`);
console.log(`  Length differences:     ${lengthDiffs.length}`);
console.log(`\nFilters applied:`);
console.log(`  - Base word length >= 4 characters`);
console.log(`  - Both prefixed word and base word frequency >= 5`);
console.log(`  - Only consonant differences (vowel alternations skipped)`);
console.log(`  - Skip N/NG, Y/IY, W/UW, ER/R, S/Z, SH/ZH, SH/CH alternations`);
console.log(`  - Skip words already in custom pronunciations`);
console.log(`  - Prefix phonemes must match at start of word`);
console.log(`  - For length diffs: require >= 75% phoneme match`);
console.log();

const top = deduped.slice(0, 50);
console.log(`Top ${top.length} results (sorted by max frequency):\n`);

for (let i = 0; i < top.length; i++) {
  const r = top[i];
  const prefixPhones = r.wordPhonemes.slice(0, r.prefixLen).join(' ');
  const suffixPhones = r.wordPhonemes.slice(r.prefixLen).join(' ');

  console.log(
    `${String(i + 1).padStart(3)}. ${r.prefix}+${r.base} = "${r.word}" ` +
      `(freq: word=${r.wordFreq}, base=${r.baseFreq})`
  );
  console.log(`     ${r.mismatchType}: ${r.details}`);
  console.log(`     word:  [${prefixPhones} | ${suffixPhones}]`);
  console.log(`     base:  [${r.basePhonemes.join(' ')}]`);
  console.log();
}

// Summary of difference patterns
console.log('='.repeat(90));
console.log('SUMMARY OF DIFFERENCE PATTERNS');
console.log('='.repeat(90));

const patternCounts = new Map<string, number>();
for (const r of deduped) {
  const key = `${stripStress(r.wordPhoneme)} vs ${stripStress(r.basePhoneme)}`;
  patternCounts.set(key, (patternCounts.get(key) ?? 0) + 1);
}

const sortedPatterns = [...patternCounts.entries()].sort((a, b) => b[1] - a[1]);
console.log('\nMost common phoneme difference patterns:\n');
for (const [pattern, count] of sortedPatterns.slice(0, 30)) {
  console.log(`  ${String(count).padStart(4)}x  ${pattern}`);
}

// Breakdown by prefix
console.log('\n\nBreakdown by prefix:\n');
const prefixCounts = new Map<string, number>();
for (const r of deduped) {
  prefixCounts.set(r.prefix, (prefixCounts.get(r.prefix) ?? 0) + 1);
}
const sortedPrefixes = [...prefixCounts.entries()].sort((a, b) => b[1] - a[1]);
for (const [prefix, count] of sortedPrefixes) {
  console.log(`  ${String(count).padStart(4)}x  ${prefix}-`);
}
