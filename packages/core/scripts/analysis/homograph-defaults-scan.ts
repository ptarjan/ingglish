#!/usr/bin/env npx vite-node
/**
 * Scan CMU dictionary homographs to check if default (first) pronunciations
 * are correct for the most common usage of each word.
 *
 * The raw CMU dictionary stores variant pronunciations with numbered suffixes:
 *   "READ"     -> default pronunciation
 *   "READ(2)"  -> second pronunciation
 *
 * The build step (build-dictionary.ts) strips variants and only keeps the first.
 * This script parses the raw dict file to recover variant information.
 *
 * Usage: npx vite-node scripts/homograph-defaults-scan.ts
 *
 * Requires /tmp/cmudict-raw.dict to exist. Download with:
 *   curl -sL https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict > /tmp/cmudict-raw.dict
 */

import * as fs from 'fs';
import { CUSTOM_PRONUNCIATIONS } from '@ingglish/dictionary';
import { loadFrequencies, getWordFrequency } from '@ingglish/dictionary';

await loadFrequencies();

// ---------------------------------------------------------------------------
// Step 1: Parse raw CMU dictionary to get all variants
// ---------------------------------------------------------------------------

const CMUDICT_RAW = '/tmp/cmudict-raw.dict';

if (!fs.existsSync(CMUDICT_RAW)) {
  console.error(`Missing ${CMUDICT_RAW}. Download with:`);
  console.error(
    `  curl -sL https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict > ${CMUDICT_RAW}`
  );
  process.exit(1);
}

const rawText = fs.readFileSync(CMUDICT_RAW, 'utf-8');

// Parse all entries, grouping variants by base word
const allVariants = new Map<string, string[][]>();

for (const line of rawText.split('\n')) {
  if (!line.trim() || line.startsWith(';;;')) continue;

  const spaceIdx = line.indexOf(' ');
  if (spaceIdx === -1) continue;

  const rawWord = line.slice(0, spaceIdx);
  const phonemes = line
    .slice(spaceIdx + 1)
    .trim()
    .split(' ');

  // Strip variant suffix: READ(2) -> read
  const baseWord = rawWord.replace(/\(\d+\)$/, '').toLowerCase();

  if (!allVariants.has(baseWord)) {
    allVariants.set(baseWord, []);
  }
  allVariants.get(baseWord)!.push(phonemes);
}

// Filter to only words with multiple pronunciations (true homographs)
interface HomographEntry {
  word: string;
  frequency: number;
  defaultPron: string[];
  variants: { num: number; pron: string[] }[];
  isCustomOverridden: boolean;
}

const homographs: HomographEntry[] = [];

for (const [word, prons] of allVariants.entries()) {
  if (prons.length < 2) continue;

  const freq = getWordFrequency(word) ?? 0;
  const isCustom = Object.prototype.hasOwnProperty.call(CUSTOM_PRONUNCIATIONS, word);

  const variants = prons.slice(1).map((pron, i) => ({ num: i + 2, pron }));

  homographs.push({
    word,
    frequency: freq,
    defaultPron: prons[0],
    variants,
    isCustomOverridden: isCustom,
  });
}

// Sort by frequency descending
homographs.sort((a, b) => b.frequency - a.frequency);

console.log(`Total words in raw CMU dict: ${allVariants.size}`);
console.log(`Words with multiple pronunciations: ${homographs.length}`);

// ---------------------------------------------------------------------------
// Step 2: Known homograph checks
// ---------------------------------------------------------------------------

function stripStress(phonemes: string[]): string {
  return phonemes.map((p) => p.replace(/[0-2]$/, '')).join(' ');
}

function phonemesStr(phonemes: string[]): string {
  return phonemes.join(' ');
}

interface KnownHomograph {
  word: string;
  expectedDefaultDescription: string;
  // The expected default should contain these phonemes (stress-stripped)
  expectedPhonemes: string[];
  // Description of what the wrong default would be
  wrongDescription: string;
}

const knownHomographs: KnownHomograph[] = [
  {
    word: 'read',
    expectedDefaultDescription: 'present tense /riːd/ (R IY D)',
    expectedPhonemes: ['R', 'IY', 'D'],
    wrongDescription: 'past tense /rɛd/ (R EH D)',
  },
  {
    word: 'lead',
    expectedDefaultDescription: 'verb /liːd/ (L IY D)',
    expectedPhonemes: ['L', 'IY', 'D'],
    wrongDescription: 'noun (metal) /lɛd/ (L EH D)',
  },
  {
    word: 'live',
    expectedDefaultDescription: 'verb /lɪv/ (L IH V)',
    expectedPhonemes: ['L', 'IH', 'V'],
    wrongDescription: 'adjective /laɪv/ (L AY V)',
  },
  {
    word: 'wind',
    expectedDefaultDescription: 'noun /wɪnd/ (W IH N D)',
    expectedPhonemes: ['W', 'IH', 'N', 'D'],
    wrongDescription: 'verb /waɪnd/ (W AY N D)',
  },
  {
    word: 'tear',
    expectedDefaultDescription: 'noun/verb "rip" /tɛr/ (T EH R)',
    expectedPhonemes: ['T', 'EH', 'R'],
    wrongDescription: '"crying" /tɪr/ (T IH R)',
  },
  {
    word: 'bow',
    expectedDefaultDescription: 'noun /baʊ/ (B AW)',
    expectedPhonemes: ['B', 'AW'],
    wrongDescription: '/boʊ/ (B OW)',
  },
  {
    word: 'close',
    expectedDefaultDescription: 'verb /kloʊz/ (K L OW Z)',
    expectedPhonemes: ['K', 'L', 'OW', 'Z'],
    wrongDescription: 'adjective /kloʊs/ (K L OW S)',
  },
  {
    word: 'use',
    expectedDefaultDescription: 'verb /juːz/ (Y UW Z)',
    expectedPhonemes: ['Y', 'UW', 'Z'],
    wrongDescription: 'noun /juːs/ (Y UW S)',
  },
  {
    word: 'house',
    expectedDefaultDescription: 'noun /haʊs/ (HH AW S)',
    expectedPhonemes: ['HH', 'AW', 'S'],
    wrongDescription: 'verb /haʊz/ (HH AW Z)',
  },
  {
    word: 'record',
    expectedDefaultDescription: 'noun /ˈrɛkɝd/ (R EH K ER D) — stress on first',
    expectedPhonemes: ['R', 'EH', 'K', 'ER', 'D'],
    wrongDescription: 'verb /rɪˈkɔrd/ (R IH K AO R D) — stress on second',
  },
  {
    word: 'present',
    expectedDefaultDescription: 'noun /ˈprɛzənt/ (P R EH Z AH N T) — stress on first',
    expectedPhonemes: ['P', 'R', 'EH', 'Z', 'AH', 'N', 'T'],
    wrongDescription: 'verb /prɪˈzɛnt/ — stress on second',
  },
  {
    word: 'project',
    expectedDefaultDescription: 'noun — stress on first syllable',
    expectedPhonemes: ['P', 'R', 'AA', 'JH', 'EH', 'K', 'T'],
    wrongDescription: 'verb — stress on second syllable',
  },
  {
    word: 'produce',
    expectedDefaultDescription: 'noun — stress on first syllable',
    expectedPhonemes: ['P', 'R', 'OW', 'D', 'UW', 'S'],
    wrongDescription: 'verb — stress on second syllable',
  },
  {
    word: 'object',
    expectedDefaultDescription: 'noun — stress on first syllable',
    expectedPhonemes: ['AA', 'B', 'JH', 'EH', 'K', 'T'],
    wrongDescription: 'verb — stress on second syllable',
  },
  {
    word: 'address',
    expectedDefaultDescription: 'noun — stress on first syllable',
    expectedPhonemes: ['AE', 'D', 'R', 'EH', 'S'],
    wrongDescription: 'verb — stress on second syllable',
  },
  {
    word: 'permit',
    expectedDefaultDescription: 'noun — stress on first syllable',
    expectedPhonemes: ['P', 'ER', 'M', 'IH', 'T'],
    wrongDescription: 'verb — stress on second syllable',
  },
  {
    word: 'conduct',
    expectedDefaultDescription: 'noun — stress on first syllable',
    expectedPhonemes: ['K', 'AA', 'N', 'D', 'AH', 'K', 'T'],
    wrongDescription: 'verb — stress on second syllable',
  },
  {
    word: 'minute',
    expectedDefaultDescription: 'noun /ˈmɪnɪt/ (M IH N AH T)',
    expectedPhonemes: ['M', 'IH', 'N', 'AH', 'T'],
    wrongDescription: 'adjective /maɪˈnjuːt/ (M AY N UW T)',
  },
  {
    word: 'bass',
    expectedDefaultDescription: 'the fish /bæs/ (B AE S)',
    expectedPhonemes: ['B', 'AE', 'S'],
    wrongDescription: 'musical /beɪs/ (B EY S)',
  },
];

// ---------------------------------------------------------------------------
// Step 3: Check known homographs
// ---------------------------------------------------------------------------

interface CheckResult {
  word: string;
  status: 'OK' | 'WRONG' | 'NOT_FOUND' | 'CUSTOM_OVERRIDE';
  expectedDescription: string;
  wrongDescription: string;
  actualDefault: string;
  allVariants: string[];
  frequency: number;
}

const checkResults: CheckResult[] = [];

for (const known of knownHomographs) {
  const entry = homographs.find((h) => h.word === known.word);

  if (!entry) {
    // Word exists but has no variants in raw dict
    const prons = allVariants.get(known.word);
    checkResults.push({
      word: known.word,
      status: 'NOT_FOUND',
      expectedDescription: known.expectedDefaultDescription,
      wrongDescription: known.wrongDescription,
      actualDefault: prons ? phonemesStr(prons[0]) : '(not in dictionary)',
      allVariants: [],
      frequency: getWordFrequency(known.word) ?? 0,
    });
    continue;
  }

  if (entry.isCustomOverridden) {
    checkResults.push({
      word: known.word,
      status: 'CUSTOM_OVERRIDE',
      expectedDescription: known.expectedDefaultDescription,
      wrongDescription: known.wrongDescription,
      actualDefault: phonemesStr(entry.defaultPron),
      allVariants: entry.variants.map((v) => `(${v.num}): ${phonemesStr(v.pron)}`),
      frequency: entry.frequency,
    });
    continue;
  }

  // Check if default matches expected (stress-stripped comparison)
  const actualStripped = stripStress(entry.defaultPron);
  const expectedStripped = known.expectedPhonemes.join(' ');
  const isCorrect = actualStripped === expectedStripped;

  checkResults.push({
    word: known.word,
    status: isCorrect ? 'OK' : 'WRONG',
    expectedDescription: known.expectedDefaultDescription,
    wrongDescription: known.wrongDescription,
    actualDefault: phonemesStr(entry.defaultPron),
    allVariants: entry.variants.map((v) => `(${v.num}): ${phonemesStr(v.pron)}`),
    frequency: entry.frequency,
  });
}

// ---------------------------------------------------------------------------
// Step 4: Heuristic checks on all top-200 homographs
// ---------------------------------------------------------------------------

interface HeuristicFlag {
  word: string;
  frequency: number;
  reason: string;
  defaultPron: string;
  variantProns: string[];
}

const heuristicFlags: HeuristicFlag[] = [];

function getStressPattern(phonemes: string[]): number[] {
  const stresses: number[] = [];
  for (const p of phonemes) {
    const match = p.match(/([0-2])$/);
    if (match) {
      stresses.push(parseInt(match[1], 10));
    }
  }
  return stresses;
}

function hasVowelDifference(pron1: string[], pron2: string[]): boolean {
  const s1 = stripStress(pron1);
  const s2 = stripStress(pron2);
  return s1 !== s2;
}

const top200 = homographs.slice(0, 200);

for (const entry of top200) {
  if (entry.isCustomOverridden) continue;

  const defaultStress = getStressPattern(entry.defaultPron);

  for (const variant of entry.variants) {
    const variantStress = getStressPattern(variant.pron);

    // Only check words with 2+ syllables
    if (defaultStress.length < 2 || variantStress.length < 2) continue;

    // Check if this is a stress-shift pair (same length, different stress)
    if (entry.defaultPron.length !== variant.pron.length) continue;

    const defaultStripped = stripStress(entry.defaultPron);
    const variantStripped = stripStress(variant.pron);

    // If only stress differs
    if (defaultStripped === variantStripped) {
      // Default has primary stress on second+ syllable, variant has it on first
      const defaultPrimaryIdx = defaultStress.indexOf(1);
      const variantPrimaryIdx = variantStress.indexOf(1);

      if (defaultPrimaryIdx > 0 && variantPrimaryIdx === 0) {
        heuristicFlags.push({
          word: entry.word,
          frequency: entry.frequency,
          reason:
            `Stress-only difference: default has primary stress on syllable ${defaultPrimaryIdx + 1}, ` +
            `variant (${variant.num}) has it on syllable 1. Noun form (first-syllable stress) ` +
            `may be more common.`,
          defaultPron: phonemesStr(entry.defaultPron),
          variantProns: entry.variants.map((v) => `(${v.num}): ${phonemesStr(v.pron)}`),
        });
      }
    }

    // If vowels differ (true homograph like read/read, lead/lead)
    if (hasVowelDifference(entry.defaultPron, variant.pron)) {
      // Skip known words already handled above
      if (knownHomographs.some((k) => k.word === entry.word)) continue;

      // Flag high-frequency words with vowel differences for manual review
      if (entry.frequency > 500) {
        heuristicFlags.push({
          word: entry.word,
          frequency: entry.frequency,
          reason: `Vowel/consonant difference between default and variant -- may need manual review.`,
          defaultPron: phonemesStr(entry.defaultPron),
          variantProns: entry.variants.map((v) => `(${v.num}): ${phonemesStr(v.pron)}`),
        });
      }
    }
  }
}

// Deduplicate flags (a word might match multiple variants)
const seenWords = new Set<string>();
const uniqueFlags = heuristicFlags.filter((f) => {
  if (seenWords.has(f.word)) return false;
  seenWords.add(f.word);
  return true;
});

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

console.log('\n' + '='.repeat(80));
console.log('HOMOGRAPH DEFAULTS SCAN');
console.log('='.repeat(80));
console.log(`\nTotal words with variants: ${homographs.length}`);
console.log(`Top 200 by frequency examined for heuristics\n`);

// Section 1: Known homograph checks
console.log('='.repeat(80));
console.log('KNOWN HOMOGRAPH CHECKS');
console.log('='.repeat(80));

const wrongChecks = checkResults.filter((r) => r.status === 'WRONG');
const okChecks = checkResults.filter((r) => r.status === 'OK');
const customChecks = checkResults.filter((r) => r.status === 'CUSTOM_OVERRIDE');
const notFoundChecks = checkResults.filter((r) => r.status === 'NOT_FOUND');

console.log(`\n  OK:              ${okChecks.length}`);
console.log(`  WRONG DEFAULT:   ${wrongChecks.length}`);
console.log(`  CUSTOM OVERRIDE: ${customChecks.length}`);
console.log(`  NOT FOUND:       ${notFoundChecks.length}`);

if (wrongChecks.length > 0) {
  console.log(`\n${'~'.repeat(60)}`);
  console.log('WRONG DEFAULTS (needs attention):');
  console.log('~'.repeat(60));
  for (const r of wrongChecks.sort((a, b) => b.frequency - a.frequency)) {
    console.log(`\n  ${r.word.toUpperCase()} (freq: ${r.frequency})`);
    console.log(`    Expected: ${r.expectedDescription}`);
    console.log(`    Got:      ${r.wrongDescription}`);
    console.log(`    Default:  ${r.actualDefault}`);
    for (const v of r.allVariants) {
      console.log(`    Variant ${v}`);
    }
  }
}

if (okChecks.length > 0) {
  console.log(`\n${'~'.repeat(60)}`);
  console.log('CORRECT DEFAULTS:');
  console.log('~'.repeat(60));
  for (const r of okChecks.sort((a, b) => b.frequency - a.frequency)) {
    console.log(`\n  ${r.word.toUpperCase()} (freq: ${r.frequency})`);
    console.log(`    Default:  ${r.actualDefault}  <-- ${r.expectedDescription}`);
    for (const v of r.allVariants) {
      console.log(`    Variant ${v}`);
    }
  }
}

if (customChecks.length > 0) {
  console.log(`\n${'~'.repeat(60)}`);
  console.log('CUSTOM OVERRIDDEN (already fixed in custom-words.ts):');
  console.log('~'.repeat(60));
  for (const r of customChecks.sort((a, b) => b.frequency - a.frequency)) {
    console.log(`  ${r.word.padEnd(15)} default: ${r.actualDefault}`);
  }
}

if (notFoundChecks.length > 0) {
  console.log(`\n${'~'.repeat(60)}`);
  console.log('NOT FOUND AS HOMOGRAPHS (no variant entries in raw CMU):');
  console.log('~'.repeat(60));
  for (const r of notFoundChecks) {
    console.log(`  ${r.word.padEnd(15)} only pronunciation: ${r.actualDefault}`);
  }
}

// Section 2: Heuristic flags
console.log(`\n${'='.repeat(80)}`);
console.log('HEURISTIC FLAGS (top 200 by frequency)');
console.log('='.repeat(80));
console.log(`\nTotal flagged: ${uniqueFlags.length}\n`);

const stressFlags = uniqueFlags.filter((f) => f.reason.includes('Stress-only'));
const vowelFlags = uniqueFlags.filter((f) => f.reason.includes('Vowel/consonant'));

if (stressFlags.length > 0) {
  console.log('~'.repeat(60));
  console.log(
    `STRESS-SHIFT PAIRS (${stressFlags.length}) -- verb stress as default, noun may be more common:`
  );
  console.log('~'.repeat(60));
  for (const f of stressFlags.sort((a, b) => b.frequency - a.frequency)) {
    console.log(`\n  ${f.word.toUpperCase()} (freq: ${f.frequency})`);
    console.log(`    Default:  ${f.defaultPron}`);
    for (const v of f.variantProns) {
      console.log(`    Variant ${v}`);
    }
    console.log(`    Flag:     ${f.reason}`);
  }
}

if (vowelFlags.length > 0) {
  console.log(`\n${'~'.repeat(60)}`);
  console.log(`VOWEL/CONSONANT DIFFERENCES (${vowelFlags.length}) -- manual review needed:`);
  console.log('~'.repeat(60));
  for (const f of vowelFlags.sort((a, b) => b.frequency - a.frequency)) {
    console.log(`\n  ${f.word.toUpperCase()} (freq: ${f.frequency})`);
    console.log(`    Default:  ${f.defaultPron}`);
    for (const v of f.variantProns) {
      console.log(`    Variant ${v}`);
    }
  }
}

// Section 3: Full list of top 200 homographs for reference
console.log(`\n${'='.repeat(80)}`);
console.log('ALL TOP 200 HOMOGRAPHS BY FREQUENCY');
console.log('='.repeat(80));

for (const entry of top200) {
  const customTag = entry.isCustomOverridden ? ' [CUSTOM]' : '';
  const knownTag = knownHomographs.some((k) => k.word === entry.word) ? ' [KNOWN]' : '';
  const flagTag = uniqueFlags.some((f) => f.word === entry.word) ? ' [FLAGGED]' : '';

  console.log(
    `\n  ${entry.word.padEnd(20)} freq=${String(entry.frequency).padStart(7)}${customTag}${knownTag}${flagTag}`
  );
  console.log(`    default: ${phonemesStr(entry.defaultPron)}`);
  for (const v of entry.variants) {
    console.log(`    (${v.num}):     ${phonemesStr(v.pron)}`);
  }
}
