#!/usr/bin/env node
/**
 * Analyze CMU dict variant ordering to find words where variant 1
 * may not be the most standard American English pronunciation.
 *
 * Usage:
 *   node packages/dictionary/scripts/analyze-variants.js
 *
 * Requires /tmp/cmudict-raw.dict to exist. Download with:
 *   curl -sL https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict > /tmp/cmudict-raw.dict
 *
 * Categories of differences found:
 *
 * 1. GENUINELY WRONG (6 words): Days of week have IY0 ("ee") instead of
 *    EY ("ay") as variant 1. Fixed via custom-words.ts overrides.
 *
 * 2. NOUN/VERB HOMOGRAPHS (~90 words): "record", "subject", "present" etc.
 *    Both pronunciations are correct depending on part of speech.
 *    CMU tends to list verb stress first.
 *
 * 3. VALID ALTERNATIONS (~220 words): AH0↔IH0 in unstressed syllables,
 *    cot-caught merger (AA↔AO), WH-coalescence, strong/weak forms.
 *    Both variants are standard.
 *
 * Conclusion: The first-variant strategy is correct ~97% of the time.
 * The handful of exceptions are handled in custom-words.ts.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FREQ_PATH = path.join(__dirname, '..', 'src', 'data', 'word-frequencies.js');
const CMUDICT_RAW = '/tmp/cmudict-raw.dict';

// ── Load word frequencies ───────────────────────────────────────────
function loadFrequencies() {
  const source = fs.readFileSync(FREQ_PATH, 'utf-8');
  const match = source.match(/const WORD_FREQUENCIES = (\{[\s\S]*?\n\});/);
  if (!match) throw new Error('Could not parse word frequencies');
  return JSON.parse(match[1]);
}

// ── Parse all CMU dict variants ─────────────────────────────────────
function parseVariants(text) {
  const variants = new Map();
  for (const line of text.split('\n')) {
    if (!line || line.startsWith(';;;')) continue;
    const spaceIdx = line.indexOf(' ');
    if (spaceIdx === -1) continue;
    const rawWord = line.slice(0, spaceIdx);
    const phonemes = line.slice(spaceIdx + 1).trim();
    const word = rawWord.replace(/\(\d+\)$/, '').toLowerCase();
    if (!variants.has(word)) variants.set(word, []);
    variants.get(word).push(phonemes);
  }
  return variants;
}

function stripStress(p) {
  return p.replace(/[012]/g, '');
}

function getVowels(phonemes) {
  return phonemes.split(' ').filter((p) => /[012]$/.test(p));
}

// ── Classify variant differences ────────────────────────────────────
function classifyDiff(word, v1, v2) {
  const p1 = v1.split(' ');
  const p2 = v2.split(' ');

  // Pure stress difference
  if (stripStress(v1) === stripStress(v2)) return 'STRESS_ONLY';

  // Cot-caught merger (AA↔AO)
  const norm = (s) => s.replace(/AA/g, 'XX').replace(/AO/g, 'XX');
  if (stripStress(norm(v1)) === stripStress(norm(v2))) return 'COT_CAUGHT';

  // WH-coalescence (W↔HH W)
  const noHW = (s) => s.replace(/HH W/g, 'W');
  if (stripStress(noHW(v1)) === stripStress(noHW(v2))) return 'WH_COALESCENCE';

  // H-dropping (function words: him→'im)
  if (p1.length === p2.length - 1 && p2[0] === 'HH') {
    if (stripStress(v1) === stripStress(p2.slice(1).join(' '))) return 'H_DROP';
  }
  if (p2.length === p1.length - 1 && p1[0] === 'HH') {
    if (stripStress(v2) === stripStress(p1.slice(1).join(' '))) return 'H_DROP';
  }

  // IH↔IY or AH↔IH in unstressed syllables
  const unify = (s) => s.replace(/IH0/g, 'XX0').replace(/IY0/g, 'XX0').replace(/AH0/g, 'XX0');
  if (stripStress(unify(v1)) === stripStress(unify(v2))) return 'UNSTRESSED_VOWEL';

  // ER0↔R (syllabic R)
  const erR = (s) => s.replace(/ ER0/g, ' R');
  if (stripStress(erR(v1)) === stripStress(erR(v2))) return 'SYLLABIC_R';

  // Combined normalizations
  const fullNorm = (s) => stripStress(unify(noHW(norm(erR(s)))));
  if (fullNorm(v1) === fullNorm(v2)) return 'COMBINED_VALID';

  // Consonant cluster simplification (1 phoneme difference)
  if (Math.abs(p1.length - p2.length) === 1) {
    const [longer, shorter] = p1.length > p2.length ? [p1, p2] : [p2, p1];
    for (let i = 0; i < longer.length; i++) {
      const without = [...longer.slice(0, i), ...longer.slice(i + 1)];
      if (without.join(' ') === shorter.join(' ')) return 'CLUSTER_SIMPLIFICATION';
    }
  }

  // IY vs EY in day-like endings
  const v1vowels = getVowels(v1);
  const v2vowels = getVowels(v2);
  const v1last = v1vowels[v1vowels.length - 1] || '';
  const v2last = v2vowels[v2vowels.length - 1] || '';
  if (/^IY[02]$/.test(v1last) && /^EY[012]$/.test(v2last)) {
    if (word.match(/(day|ey|ay|sey|ley|ney|rey)$/i)) {
      return 'DAY_ENDING_ERROR';
    }
  }

  // Same consonant structure = likely homograph (noun/verb/adjective)
  if (p1.length === p2.length) {
    const c1 = p1.filter((p) => !/[012]$/.test(p));
    const c2 = p2.filter((p) => !/[012]$/.test(p));
    if (c1.join(' ') === c2.join(' ')) return 'HOMOGRAPH';
  }

  return 'UNCLASSIFIED';
}

// ── Main ────────────────────────────────────────────────────────────
function main() {
  if (!fs.existsSync(CMUDICT_RAW)) {
    console.error(`Missing ${CMUDICT_RAW}. Download with:`);
    console.error(
      `  curl -sL https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict > ${CMUDICT_RAW}`
    );
    process.exit(1);
  }

  const FREQ = loadFrequencies();
  const variants = parseVariants(fs.readFileSync(CMUDICT_RAW, 'utf-8'));

  // Classify all multi-variant words
  const results = new Map();
  for (const [word, vars] of variants) {
    if (vars.length < 2) continue;
    const cls = classifyDiff(word, vars[0], vars[1]);
    if (!results.has(cls)) results.set(cls, []);
    results.get(cls).push({ word, freq: FREQ[word] || 0, v1: vars[0], v2: vars[1] });
  }

  // Print summary
  const multiCount = [...variants.values()].filter((v) => v.length >= 2).length;
  console.log(`Total words: ${variants.size}`);
  console.log(`Multi-variant: ${multiCount}\n`);

  console.log('=== CATEGORY BREAKDOWN ===\n');
  const order = [
    'STRESS_ONLY',
    'UNSTRESSED_VOWEL',
    'COT_CAUGHT',
    'WH_COALESCENCE',
    'H_DROP',
    'SYLLABIC_R',
    'COMBINED_VALID',
    'CLUSTER_SIMPLIFICATION',
    'HOMOGRAPH',
    'DAY_ENDING_ERROR',
    'UNCLASSIFIED',
  ];

  for (const cls of order) {
    const words = results.get(cls) || [];
    console.log(`  ${cls.padEnd(25)} ${String(words.length).padStart(5)} words`);
  }

  // Show day ending errors (the clear bugs)
  const dayErrors = results.get('DAY_ENDING_ERROR') || [];
  if (dayErrors.length > 0) {
    console.log('\n=== DAY ENDING ERRORS (IY should be EY) ===\n');
    for (const w of dayErrors.sort((a, b) => b.freq - a.freq)) {
      console.log(`  ${w.word.padEnd(15)} v1: ${w.v1}`);
      console.log(`  ${' '.repeat(15)} v2: ${w.v2}`);
    }
  }

  // Show high-frequency unclassified (need manual review)
  const unclassified = (results.get('UNCLASSIFIED') || [])
    .filter((w) => w.freq > 1000)
    .sort((a, b) => b.freq - a.freq);
  if (unclassified.length > 0) {
    console.log(`\n=== UNCLASSIFIED (freq > 1000, needs review) ===\n`);
    for (const w of unclassified.slice(0, 30)) {
      console.log(`  ${w.word.padEnd(18)} (freq: ${String(w.freq).padStart(7)})  v1: ${w.v1}`);
      console.log(`  ${' '.repeat(18)}               v2: ${w.v2}`);
    }
  }

  // Show high-frequency homographs
  const homographs = (results.get('HOMOGRAPH') || [])
    .filter((w) => w.freq > 2000)
    .sort((a, b) => b.freq - a.freq);
  if (homographs.length > 0) {
    console.log(`\n=== HOMOGRAPHS (freq > 2000, context-dependent) ===\n`);
    for (const w of homographs.slice(0, 30)) {
      console.log(`  ${w.word.padEnd(18)} (freq: ${String(w.freq).padStart(7)})  v1: ${w.v1}`);
      console.log(`  ${' '.repeat(18)}               v2: ${w.v2}`);
    }
  }
}

main();
