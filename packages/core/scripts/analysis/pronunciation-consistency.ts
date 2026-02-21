#!/usr/bin/env npx vite-node
/**
 * Find likely CMU dictionary errors by comparing pronunciations of related words.
 *
 * When "cat" and "cats" share a root, the shared portion should be pronounced
 * the same. Similarly for compound words: "break" in "breakfast" should match
 * "break" standalone (unless there's a genuine English pronunciation change).
 *
 * Usage: npx vite-node scripts/analysis/pronunciation-consistency.ts
 */

import { loadDictionary, getDictionary } from '@ingglish/dictionary';

await loadDictionary();
const cmudict = getDictionary();

const allWords = Object.keys(cmudict).filter((w) => cmudict[w]?.length > 0 && !w.includes('('));
const wordSet = new Set(allWords);

function stripStress(phoneme: string): string {
  return phoneme.replace(/[0-2]$/, '');
}

function phonemesNoStress(word: string): string[] {
  return (cmudict[word] ?? []).map(stripStress);
}

// ============================================================
// Phase 1: Find related word pairs
// ============================================================

type CheckPosition = 'prefix' | 'suffix';

interface WordPair {
  shorter: string;
  longer: string;
  relationship: 'suffix-strip' | 'prefix' | 'compound-tail';
  detail: string;
  checkPosition: CheckPosition; // where to look for shorter's phonemes in longer's
}

const pairs: WordPair[] = [];
const pairKeys = new Set<string>();

function addPair(pair: WordPair) {
  const key = `${pair.shorter}|${pair.longer}|${pair.checkPosition}`;
  if (pairKeys.has(key)) return;
  pairKeys.add(key);
  pairs.push(pair);
}

// --- 1a: Suffix stripping ---
// The stem's phonemes should appear as a prefix of the derived word's phonemes
const suffixes = [
  's',
  'es',
  'ed',
  'd',
  'ing',
  'ly',
  'er',
  'ers',
  'est',
  'ness',
  'ful',
  'less',
  'ment',
  'ments',
  'able',
  'ible',
  'tion',
  'sion',
  'ous',
  'ive',
  'al',
  'ity',
  'ize',
  'ise',
];

for (const word of allWords) {
  for (const suffix of suffixes) {
    if (word.length <= suffix.length + 2) continue;
    if (!word.endsWith(suffix)) continue;
    const stem = word.slice(0, -suffix.length);
    if (wordSet.has(stem)) {
      addPair({
        shorter: stem,
        longer: word,
        relationship: 'suffix-strip',
        detail: `-${suffix}`,
        checkPosition: 'prefix',
      });
    }
    // Handle consonant doubling: "running" → "run"
    if (stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2]) {
      const undoubled = stem.slice(0, -1);
      if (wordSet.has(undoubled)) {
        addPair({
          shorter: undoubled,
          longer: word,
          relationship: 'suffix-strip',
          detail: `-${suffix} (doubled)`,
          checkPosition: 'prefix',
        });
      }
    }
    // Handle e-dropping: "making" → "make"
    if (wordSet.has(stem + 'e')) {
      addPair({
        shorter: stem + 'e',
        longer: word,
        relationship: 'suffix-strip',
        detail: `-e+${suffix}`,
        checkPosition: 'prefix',
      });
    }
  }
}

// --- 1b: Prefix matching ---
// The prefix word's phonemes should appear at the start of the longer word
// Use sorted array + binary search to avoid O(n²)
const sortedWords = [...allWords].sort();

for (const shorter of allWords) {
  if (shorter.length < 4) continue; // skip very short prefixes (too noisy)
  if (shorter.length > 10) continue;

  // Binary search for first word starting with `shorter`
  let lo = 0;
  let hi = sortedWords.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sortedWords[mid] < shorter) lo = mid + 1;
    else hi = mid;
  }

  for (let i = lo; i < sortedWords.length; i++) {
    const longer = sortedWords[i];
    if (!longer.startsWith(shorter)) break;
    if (longer === shorter) continue;
    if (longer.length - shorter.length < 2) continue;
    if (longer.length - shorter.length > 8) continue;
    addPair({
      shorter,
      longer,
      relationship: 'prefix',
      detail: `+${longer.slice(shorter.length)}`,
      checkPosition: 'prefix',
    });
  }
}

// --- 1c: Compound detection (tail part only) ---
// Prefix matching already catches the first part of compounds.
// Here we check if the SECOND part's phonemes appear at the END of the compound's phonemes.
for (const word of allWords) {
  if (word.length < 6) continue;
  for (let split = 3; split <= word.length - 3; split++) {
    const first = word.slice(0, split);
    const second = word.slice(split);
    if (first.length < 3 || second.length < 3) continue;
    if (wordSet.has(first) && wordSet.has(second)) {
      addPair({
        shorter: second,
        longer: word,
        relationship: 'compound-tail',
        detail: `${first}+${second}`,
        checkPosition: 'suffix',
      });
    }
  }
}

console.log(`Found ${pairs.length} related word pairs`);
const byRelCount = new Map<string, number>();
for (const p of pairs) byRelCount.set(p.relationship, (byRelCount.get(p.relationship) ?? 0) + 1);
for (const [r, c] of byRelCount) console.log(`  ${r}: ${c}`);
console.log();

// ============================================================
// Phase 2: Compare pronunciations
// ============================================================

interface Inconsistency {
  pair: WordPair;
  shorterPhonemes: string[];
  longerPhonemes: string[];
  divergeAt: number; // phoneme index (in shorter) where they diverge
  shorterPhoneme: string;
  longerPhoneme: string;
  category: 'vowel' | 'consonant' | 'missing' | 'extra' | 'complete';
}

const vowelSet = new Set([
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

function categorize(p1: string, p2: string): Inconsistency['category'] {
  const v1 = vowelSet.has(p1);
  const v2 = vowelSet.has(p2);
  if (v1 && v2) return 'vowel';
  if (!v1 && !v2) return 'consonant';
  return 'complete';
}

const inconsistencies: Inconsistency[] = [];

for (const pair of pairs) {
  const shorter = phonemesNoStress(pair.shorter);
  const longer = phonemesNoStress(pair.longer);
  if (shorter.length === 0 || longer.length === 0) continue;

  let divergeAt = -1;

  if (pair.checkPosition === 'prefix') {
    // Check if shorter's phonemes are a prefix of longer's
    for (let i = 0; i < shorter.length; i++) {
      if (i >= longer.length || shorter[i] !== longer[i]) {
        divergeAt = i;
        break;
      }
    }
  } else {
    // Check if shorter's phonemes are a suffix of longer's
    const offset = longer.length - shorter.length;
    if (offset < 0) {
      divergeAt = 0; // longer is shorter than shorter — skip
    } else {
      for (let i = 0; i < shorter.length; i++) {
        if (shorter[i] !== longer[offset + i]) {
          divergeAt = i;
          break;
        }
      }
    }
  }

  if (divergeAt === -1) continue; // perfect match

  let category: Inconsistency['category'];
  let shorterPhoneme: string;
  let longerPhoneme: string;

  if (pair.checkPosition === 'prefix') {
    if (divergeAt >= longer.length) {
      category = 'missing';
      shorterPhoneme = shorter[divergeAt];
      longerPhoneme = '(missing)';
    } else {
      shorterPhoneme = shorter[divergeAt];
      longerPhoneme = longer[divergeAt];
      category = categorize(shorterPhoneme, longerPhoneme);
    }
  } else {
    const offset = longer.length - shorter.length;
    shorterPhoneme = shorter[divergeAt];
    longerPhoneme = longer[offset + divergeAt];
    category = categorize(shorterPhoneme, longerPhoneme);
  }

  inconsistencies.push({
    pair,
    shorterPhonemes: shorter,
    longerPhonemes: longer,
    divergeAt,
    shorterPhoneme,
    longerPhoneme,
    category,
  });
}

console.log(`Found ${inconsistencies.length} pronunciation inconsistencies (before filtering)\n`);

// ============================================================
// Phase 3: Filter legitimate changes
// ============================================================

// Detect abbreviations/acronyms (pronounced letter-by-letter)
function isAbbreviation(word: string): boolean {
  const phonemes = cmudict[word];
  if (!phonemes) return false;
  // Abbreviations typically have way more phonemes than letters
  // e.g., "mit" = 3 letters but "EH1 M AY1 T IY1" = 5 phonemes
  // Normal words: phoneme count ≈ letter count (roughly)
  return phonemes.length > word.length * 1.5 && word.length <= 4;
}

function isLegitimateChange(inc: Inconsistency): boolean {
  const { pair, shorterPhoneme, longerPhoneme, divergeAt, shorterPhonemes } = inc;

  // Skip abbreviations — they're pronounced letter-by-letter, not as words
  if (isAbbreviation(pair.shorter) || isAbbreviation(pair.longer)) return true;

  // For suffix-strip pairs where divergeAt == 0: the words almost certainly
  // aren't morphologically related (e.g., "herb"/"herber" — surname)
  // UNLESS the shorter word has >= 5 letters (more likely to be a real root)
  if (pair.relationship === 'suffix-strip' && divergeAt === 0 && pair.shorter.length < 5) {
    return true;
  }

  // Voicing assimilation before -s/-ed is normal
  if (
    pair.detail === '-s' ||
    pair.detail === '-es' ||
    pair.detail === '-ed' ||
    pair.detail === '-d'
  ) {
    if (divergeAt === shorterPhonemes.length - 1) {
      const voicingPairs: Record<string, string> = {
        S: 'Z',
        Z: 'S',
        T: 'D',
        D: 'T',
        P: 'B',
        B: 'P',
        K: 'G',
        G: 'K',
        F: 'V',
        V: 'F',
        CH: 'JH',
        JH: 'CH',
        SH: 'ZH',
        ZH: 'SH',
        TH: 'DH',
        DH: 'TH',
      };
      if (voicingPairs[shorterPhoneme] === longerPhoneme) return true;
    }
  }

  // Vowel reduction: AH (schwa) alternation is almost always legitimate
  if (longerPhoneme === 'AH' || shorterPhoneme === 'AH') return true;

  // IY/IH alternation (very common in unstressed syllables)
  if (
    (shorterPhoneme === 'IY' && longerPhoneme === 'IH') ||
    (shorterPhoneme === 'IH' && longerPhoneme === 'IY')
  )
    return true;

  // AE/EH alternation
  if (
    (shorterPhoneme === 'AE' && longerPhoneme === 'EH') ||
    (shorterPhoneme === 'EH' && longerPhoneme === 'AE')
  )
    return true;

  // Divergence at the last phoneme for suffix-stripped words is often just
  // the suffix changing the final sound
  if (pair.relationship === 'suffix-strip' && divergeAt >= shorterPhonemes.length - 1) {
    return true;
  }

  // AA/AO alternation is dialectal (cot-caught merger)
  if (
    (shorterPhoneme === 'AA' && longerPhoneme === 'AO') ||
    (shorterPhoneme === 'AO' && longerPhoneme === 'AA')
  )
    return true;

  // ER alternation with other vowels is common in unstressed syllables
  if (shorterPhoneme === 'ER' || longerPhoneme === 'ER') return true;

  return false;
}

const suspicious = inconsistencies.filter((inc) => !isLegitimateChange(inc));

console.log(`After filtering: ${suspicious.length} suspicious inconsistencies\n`);

// ============================================================
// Phase 4: Rank and output top candidates
// ============================================================

function suspicionScore(inc: Inconsistency): number {
  let score = 0;

  // Suffix-strip relationships are most reliable (strong morphological link)
  if (inc.pair.relationship === 'suffix-strip') score += 40;

  // Simple inflectional suffixes are highest confidence
  const simpleInflections = ['-s', '-es', '-ed', '-d', '-ing', '-ly', '-er', '-ers', '-est'];
  if (
    simpleInflections.some(
      (s) => inc.pair.detail === s || inc.pair.detail.endsWith(`+${s.slice(1)}`)
    )
  ) {
    score += 20;
  }

  // Earlier divergence = more suspicious (but not position 0 — likely false pair)
  if (inc.divergeAt === 0) {
    score += 10; // still interesting but lower confidence
  } else {
    const divergeRatio = inc.divergeAt / inc.shorterPhonemes.length;
    score += (1 - divergeRatio) * 40;
  }

  // Longer root words are MORE likely to be genuine pairs
  if (inc.pair.shorter.length >= 5) score += 15;
  if (inc.pair.shorter.length >= 7) score += 10;

  // Vowel↔consonant changes are very suspicious
  if (inc.category === 'complete') score += 15;

  // Consonant mismatches are more suspicious than vowel ones
  if (inc.category === 'consonant') score += 10;

  return score;
}

suspicious.sort((a, b) => suspicionScore(b) - suspicionScore(a));

// Deduplicate: keep the highest-scoring pair per (shorter, longer) combo
const seenPairs = new Set<string>();
const deduped: Inconsistency[] = [];
for (const inc of suspicious) {
  const key = `${inc.pair.shorter}|${inc.pair.longer}`;
  if (seenPairs.has(key)) continue;
  seenPairs.add(key);
  deduped.push(inc);
}

console.log(`Top candidates (deduplicated): ${deduped.length}\n`);

// Print top 100
const top = deduped.slice(0, 100);

console.log('='.repeat(100));
console.log('TOP SUSPICIOUS PRONUNCIATION INCONSISTENCIES');
console.log('='.repeat(100));
console.log(
  `${'Score'.padStart(5)} | ${'Root'.padEnd(14)} | ${'Related'.padEnd(16)} | ${'Relation'.padEnd(20)} | ${'Pos'.padEnd(3)} | ${'Expected→Actual'.padEnd(14)} | Category`
);
console.log('-'.repeat(100));

for (const inc of top) {
  const score = suspicionScore(inc).toFixed(0).padStart(5);
  const shorter = inc.pair.shorter.padEnd(14);
  const longer = inc.pair.longer.padEnd(16);
  const rel = `${inc.pair.relationship}(${inc.pair.detail})`.padEnd(20);
  const pos = String(inc.divergeAt).padEnd(3);
  const change = `${inc.shorterPhoneme}→${inc.longerPhoneme}`.padEnd(14);

  console.log(`${score} | ${shorter} | ${longer} | ${rel} | ${pos} | ${change} | ${inc.category}`);
}

// Detailed view of top 30
console.log(`\n${'='.repeat(80)}`);
console.log('DETAILED TOP 30');
console.log('='.repeat(80));

for (const inc of top.slice(0, 30)) {
  const rawShorter = (cmudict[inc.pair.shorter] ?? []).join(' ');
  const rawLonger = (cmudict[inc.pair.longer] ?? []).join(' ');
  console.log(
    `\n  "${inc.pair.shorter}" → "${inc.pair.longer}" [${inc.pair.relationship}, ${inc.pair.detail}]`
  );
  console.log(`    ${inc.pair.shorter}: ${rawShorter}`);
  console.log(`    ${inc.pair.longer}: ${rawLonger}`);
  console.log(
    `    Diverges at phoneme ${inc.divergeAt}: ${inc.shorterPhoneme} → ${inc.longerPhoneme} (${inc.category})`
  );
  console.log(`    Score: ${suspicionScore(inc).toFixed(0)}`);
}

// Summary stats
console.log(`\n${'='.repeat(60)}`);
console.log('SUMMARY');
console.log('='.repeat(60));

console.log('\nBy category:');
const byCat = new Map<string, number>();
for (const inc of deduped) byCat.set(inc.category, (byCat.get(inc.category) ?? 0) + 1);
for (const [cat, count] of [...byCat.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat.padEnd(12)} ${count}`);
}

console.log('\nBy relationship:');
const byRel = new Map<string, number>();
for (const inc of deduped)
  byRel.set(inc.pair.relationship, (byRel.get(inc.pair.relationship) ?? 0) + 1);
for (const [rel, count] of [...byRel.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${rel.padEnd(16)} ${count}`);
}
