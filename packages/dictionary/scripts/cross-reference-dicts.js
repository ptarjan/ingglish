#!/usr/bin/env node
/**
 * Cross-reference CMU Pronouncing Dictionary against independent sources
 * to find potential errors.
 *
 * Independent sources:
 * 1. WikiPronunciationDict (Wiktionary-derived, ~70K words, IPA)
 * 2. WikiPron (Wiktionary-derived, ~81K words, IPA)
 * 3. Moby Pronunciator II (177K words, custom notation → IPA)
 *
 * Usage: node packages/dictionary/scripts/cross-reference-dicts.js
 *
 * Prerequisites:
 *   npm install wiki-pronunciation-dict  (or npm pack + extract)
 *   curl -o /tmp/wikipron-en-us.tsv https://raw.githubusercontent.com/CUNY-CL/wikipron/master/data/scrape/tsv/eng_latn_us_broad.tsv
 *   curl -o /tmp/mpron.txt https://www.gutenberg.org/files/3205/files/mpron.txt
 */

import { readFileSync } from 'node:fs';

// ---------------------------------------------------------------------------
// 1. Load CMU dict and convert to IPA
// ---------------------------------------------------------------------------

/** Strip stress digits from ARPAbet phonemes */
function stripStress(ph) {
  return ph.replace(/[0-9]/g, '');
}

/** CMU ARPAbet → IPA (stress-free, for comparison) */
const ARPA_TO_IPA = {
  AA: 'ɑ',
  AE: 'æ',
  AH: 'ə',
  AO: 'ɔ',
  AW: 'aʊ',
  AY: 'aɪ',
  EH: 'ɛ',
  ER: 'ɝ',
  EY: 'eɪ',
  IH: 'ɪ',
  IY: 'i',
  OW: 'oʊ',
  OY: 'ɔɪ',
  UH: 'ʊ',
  UW: 'u',
  B: 'b',
  CH: 'tʃ',
  D: 'd',
  DH: 'ð',
  F: 'f',
  G: 'ɡ',
  HH: 'h',
  JH: 'dʒ',
  K: 'k',
  L: 'l',
  M: 'm',
  N: 'n',
  NG: 'ŋ',
  P: 'p',
  R: 'ɹ',
  S: 's',
  SH: 'ʃ',
  T: 't',
  TH: 'θ',
  V: 'v',
  W: 'w',
  Y: 'j',
  Z: 'z',
  ZH: 'ʒ',
};

function cmuToIPA(phonemes) {
  return phonemes.map((p) => ARPA_TO_IPA[stripStress(p)] || stripStress(p)).join('');
}

function cmuToIPAWithStress(phonemes) {
  const result = [];
  for (const p of phonemes) {
    const base = stripStress(p);
    const ipa = ARPA_TO_IPA[base] || base;
    const stressMatch = p.match(/[0-9]/);
    if (stressMatch) {
      const stress = stressMatch[0];
      if (stress === '1') result.push('ˈ' + ipa);
      else if (stress === '2') result.push('ˌ' + ipa);
      else result.push(ipa);
    } else {
      result.push(ipa);
    }
  }
  return result.join('');
}

// Load CMU dict from generated JS file
const cmudictPath = new URL('../src/cmudict.js', import.meta.url).pathname;
const cmudictContent = readFileSync(cmudictPath, 'utf-8');
const jsonStart = cmudictContent.indexOf('{');
const jsonEnd = cmudictContent.lastIndexOf('}') + 1;
const cmuRaw = JSON.parse(cmudictContent.slice(jsonStart, jsonEnd));

const cmuDict = new Map();
for (const [word, phonemes] of Object.entries(cmuRaw)) {
  // Skip variant entries (word(2), word(3), etc.)
  if (word.includes('(')) continue;
  cmuDict.set(word.toLowerCase(), {
    phonemes,
    ipa: cmuToIPA(phonemes),
    ipaStress: cmuToIPAWithStress(phonemes),
    raw: phonemes.join(' '),
  });
}

console.log(`CMU dict: ${cmuDict.size} words (variant 1 only)`);

// ---------------------------------------------------------------------------
// 2. Load WikiPronunciationDict
// ---------------------------------------------------------------------------

let wikiPronDict;
try {
  wikiPronDict = JSON.parse(
    readFileSync(
      '/tmp/wiki-pron/node_modules/wiki-pronunciation-dict/dictionaries/en.json',
      'utf-8'
    )
  );
} catch {
  console.log('WikiPronunciationDict not found, skipping.');
  wikiPronDict = null;
}

/** Normalize IPA for comparison: strip stress, length marks, ties, syllable dots */
function normalizeIPA(ipa) {
  return ipa
    .replace(/[ˈˌ.ːˑ]/g, '') // stress, length
    .replace(/͡/g, '') // tie bar
    .replace(/ɝ/g, 'ɜɹ') // r-colored → vowel + r (for comparison)
    .replace(/ɚ/g, 'əɹ')
    .replace(/ɻ/g, 'ɹ')
    .replace(/ɡ/g, 'g') // normalize g variants
    .replace(/n̩/g, 'ən') // syllabic consonants → schwa + consonant
    .replace(/l̩/g, 'əl')
    .replace(/m̩/g, 'əm')
    .replace(/\s+/g, '') // collapse spaces
    .trim();
}

const wikiPronDictMap = new Map();
if (wikiPronDict) {
  for (const [word, prons] of Object.entries(wikiPronDict)) {
    const clean = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!clean || clean.length < 2) continue;
    // Each pronunciation is space-separated IPA phonemes — join for display
    const joined = prons.map((p) => p.replace(/\s+/g, ''));
    const normalized = prons.map((p) => normalizeIPA(p));
    wikiPronDictMap.set(clean, { raw: joined, normalized });
  }
  console.log(`WikiPronunciationDict: ${wikiPronDictMap.size} words`);
}

// ---------------------------------------------------------------------------
// 3. Load WikiPron (TSV)
// ---------------------------------------------------------------------------

const wikiPronMap = new Map();
try {
  const tsv = readFileSync('/tmp/wikipron-en-us.tsv', 'utf-8');
  for (const line of tsv.split('\n')) {
    if (!line.trim()) continue;
    const [word, pron] = line.split('\t');
    if (!word || !pron) continue;
    const clean = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!clean || clean.length < 2) continue;
    const joined = pron.replace(/\s+/g, '');
    const normalized = normalizeIPA(pron);
    if (!wikiPronMap.has(clean)) {
      wikiPronMap.set(clean, { raw: [joined], normalized: [normalized] });
    } else {
      const entry = wikiPronMap.get(clean);
      entry.raw.push(joined);
      entry.normalized.push(normalized);
    }
  }
  console.log(`WikiPron US: ${wikiPronMap.size} words`);
} catch {
  console.log('WikiPron data not found at /tmp/wikipron-en-us.tsv, skipping.');
}

// ---------------------------------------------------------------------------
// 4. Load Moby Pronunciator II
// ---------------------------------------------------------------------------

/** Moby custom notation → IPA */
const MOBY_TO_IPA = {
  '&': 'æ',
  '(@)': 'ɛɹ',
  A: 'ɑ',
  eI: 'eɪ',
  '@': 'ə',
  '-': 'aɪɚ',
  E: 'ɛ',
  i: 'i',
  I: 'ɪ',
  aI: 'aɪ',
  Oi: 'ɔɪ',
  AU: 'aʊ',
  O: 'ɔ',
  oU: 'oʊ',
  u: 'u',
  U: 'ʊ',
  '@r': 'ɜɹ',
  b: 'b',
  d: 'd',
  f: 'f',
  g: 'g',
  h: 'h',
  k: 'k',
  l: 'l',
  m: 'm',
  n: 'n',
  p: 'p',
  r: 'ɹ',
  s: 's',
  t: 't',
  v: 'v',
  w: 'w',
  z: 'z',
  tS: 'tʃ',
  dZ: 'dʒ',
  N: 'ŋ',
  S: 'ʃ',
  T: 'θ',
  D: 'ð',
  Z: 'ʒ',
  j: 'j',
  hw: 'hw',
  x: 'x',
  y: 'y',
};

function parseMobyPron(pronStr) {
  // Moby format: phonemes separated by /, with stress markers ' and ,
  // Strip stress markers for comparison
  const stripped = pronStr.replace(/[',_]/g, '');
  const parts = stripped.split('/').filter(Boolean);
  const ipa = parts
    .map((p) => {
      if (MOBY_TO_IPA[p]) return MOBY_TO_IPA[p];
      // Multi-char consonant clusters (e.g. "nd", "st", "rg") — split into individual chars
      if (/^[a-z]+$/.test(p) && p.length > 1) {
        return [...p].map((c) => MOBY_TO_IPA[c] || c).join('');
      }
      return MOBY_TO_IPA[p] || p;
    })
    .join('');
  return normalizeIPA(ipa);
}

const mobyMap = new Map();
try {
  const mobyData = readFileSync('/tmp/mpron.txt', 'utf-8');
  for (const line of mobyData.split('\n')) {
    if (!line.trim()) continue;
    // Format: "word pronuncation" (space-separated)
    const spaceIdx = line.indexOf(' ');
    if (spaceIdx === -1) continue;
    const word = line
      .substring(0, spaceIdx)
      .toLowerCase()
      .replace(/[^a-z]/g, '');
    const pron = line.substring(spaceIdx + 1).trim();
    if (!word || word.length < 2) continue;
    const normalized = parseMobyPron(pron);
    if (!mobyMap.has(word)) {
      mobyMap.set(word, { raw: [normalized], normalized: [normalized] });
    } else {
      const entry = mobyMap.get(word);
      entry.raw.push(normalized);
      entry.normalized.push(normalized);
    }
  }
  console.log(`Moby Pronunciator: ${mobyMap.size} words`);
} catch {
  console.log('Moby data not found at /tmp/mpron.txt, skipping.');
}

// ---------------------------------------------------------------------------
// 5. Cross-reference: find words where CMU disagrees with ALL other sources
// ---------------------------------------------------------------------------

console.log('\n=== Cross-referencing ===\n');

/** Check if any pronunciation in the source matches the CMU pronunciation */
function anyMatch(cmuIPA, sourceNormalized) {
  const cmuNorm = normalizeIPA(cmuIPA);
  return sourceNormalized.some((s) => s === cmuNorm);
}

/** Check if pronunciations are "close" (differ in only 1 phoneme position) */
function areSimilar(a, b) {
  if (a === b) return true;
  // Simple: check if one contains the other or Levenshtein is small
  if (a.length === b.length) {
    let diffs = 0;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) diffs++;
    }
    return diffs <= 1;
  }
  return false;
}

// Category tracking
const disagreements = [];
let checkedCount = 0;
let agreedCount = 0;
let noOverlapCount = 0;

for (const [word, cmu] of cmuDict) {
  const cmuNorm = normalizeIPA(cmu.ipa);

  // Collect evidence from each source
  const evidence = [];

  const wiki1 = wikiPronDictMap.get(word);
  if (wiki1) {
    evidence.push({
      source: 'WikiPronDict',
      match: anyMatch(cmu.ipa, wiki1.normalized),
      prons: wiki1.normalized,
      raw: wiki1.raw,
    });
  }

  const wiki2 = wikiPronMap.get(word);
  if (wiki2) {
    evidence.push({
      source: 'WikiPron',
      match: anyMatch(cmu.ipa, wiki2.normalized),
      prons: wiki2.normalized,
      raw: wiki2.raw,
    });
  }

  const moby = mobyMap.get(word);
  if (moby) {
    evidence.push({
      source: 'Moby',
      match: anyMatch(cmu.ipa, moby.normalized),
      prons: moby.normalized,
      raw: moby.raw,
    });
  }

  if (evidence.length === 0) {
    noOverlapCount++;
    continue;
  }

  checkedCount++;

  const allDisagree = evidence.every((e) => !e.match);
  if (allDisagree) {
    disagreements.push({ word, cmuNorm, cmuIPA: cmu.ipaStress, evidence });
  } else {
    agreedCount++;
  }
}

console.log(`Words checked against at least 1 source: ${checkedCount}`);
console.log(`Words with no overlap in any source: ${noOverlapCount}`);
console.log(`Words where at least 1 source agrees: ${agreedCount}`);
console.log(`Words where ALL sources disagree: ${disagreements.length}`);

// ---------------------------------------------------------------------------
// 6. Classify disagreements
// ---------------------------------------------------------------------------

console.log('\n=== Analyzing disagreements ===\n');

/**
 * Apply all benign normalizations to make IPA maximally comparable.
 * Returns multiple normalized forms to check against.
 */
function aggressiveNormalize(ipa) {
  let s = ipa;
  // r notation
  s = s.replace(/ɹ/g, 'r');
  // schwa/strut (treat as same)
  s = s.replace(/ʌ/g, 'ə');
  // unstressed vowel reductions
  s = s.replace(/ɪ/g, 'ə');
  // ɜr vs ər
  s = s.replace(/ɜ/g, 'ə');
  // i vs ɪ (already ɪ→ə above, so i→ə too for unstressed)
  // British ɒ → ɑ
  s = s.replace(/ɒ/g, 'ɑ');
  // j-insertion (absolution: lju vs lu)
  s = s.replace(/j([uʊ])/g, '$1');
  // t-flapping (ɾ → t or d)
  s = s.replace(/ɾ/g, 't');
  // ʔ (glottal stop) → t
  s = s.replace(/ʔ/g, 't');
  // æ vs a (many sources use 'a' for TRAP vowel)
  s = s.replace(/a/g, 'æ');
  // oʊ vs əʊ (British)
  s = s.replace(/əʊ/g, 'oʊ');
  // hw vs w (wh-coalescence)
  s = s.replace(/hw/g, 'w');
  return s;
}

function classifyDisagreement(word, cmuNorm, evidence) {
  const cmuAgg = aggressiveNormalize(cmuNorm);

  // Check if any source agrees after aggressive normalization
  const altProns = evidence.flatMap((e) => e.prons);
  for (const alt of altProns) {
    const altAgg = aggressiveNormalize(alt);
    if (cmuAgg === altAgg) return 'BENIGN_NOTATION';
  }

  return 'DIFFERENT';
}

const categories = {};
const realDiffs = [];

for (const d of disagreements) {
  const category = classifyDisagreement(d.word, d.cmuNorm, d.evidence);
  categories[category] = (categories[category] || 0) + 1;
  if (category === 'DIFFERENT') {
    realDiffs.push(d);
  }
}

console.log('Disagreement categories:');
for (const [cat, count] of Object.entries(categories).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat}: ${count}`);
}

// ---------------------------------------------------------------------------
// 7. Load word frequencies and focus on common words
// ---------------------------------------------------------------------------

// Load word frequencies
const freqPath = new URL('../src/data/word-frequencies.js', import.meta.url).pathname;
let wordFreqs = new Map();
try {
  const freqContent = readFileSync(freqPath, 'utf-8');
  const freqJsonStart = freqContent.indexOf('{');
  const freqJsonEnd = freqContent.lastIndexOf('}') + 1;
  const freqData = JSON.parse(freqContent.slice(freqJsonStart, freqJsonEnd));
  for (const [word, freq] of Object.entries(freqData)) {
    wordFreqs.set(word.toLowerCase(), freq);
  }
  console.log(`Word frequencies loaded: ${wordFreqs.size} words`);
} catch {
  console.log('Word frequencies not found, skipping frequency filtering.');
}

// ---------------------------------------------------------------------------
// 8. Show the real differences (potential CMU errors)
// ---------------------------------------------------------------------------

console.log(`\n=== ${realDiffs.length} potentially real differences ===\n`);

// Add frequency info to each diff
for (const d of realDiffs) {
  d.freq = wordFreqs.get(d.word) || 0;
}

// Filter to words where at least 2 sources disagree
const multiSourceDiffs = realDiffs.filter((d) => d.evidence.length >= 2);
console.log(`Words where 2+ independent sources disagree with CMU: ${multiSourceDiffs.length}`);

// Focus on words where ALL sources agree with EACH OTHER but disagree with CMU
const unanimousDiffs = multiSourceDiffs.filter((d) => {
  // Check if all external sources have at least one pronunciation in common
  if (d.evidence.length < 2) return false;
  const allProns = d.evidence.map((e) => e.prons);

  // For each pronunciation in the first source, check if any source contains a match
  for (const p1 of allProns[0]) {
    const p1Agg = aggressiveNormalize(p1);
    let allMatch = true;
    for (let i = 1; i < allProns.length; i++) {
      const hasMatch = allProns[i].some((p2) => aggressiveNormalize(p2) === p1Agg);
      if (!hasMatch) {
        allMatch = false;
        break;
      }
    }
    if (allMatch) return true;
  }
  return false;
});

console.log(
  `Words where all external sources AGREE with each other but disagree with CMU: ${unanimousDiffs.length}`
);

// Sub-classify the unanimous disagreements into structural patterns
const patterns = {
  IY0_PREFIX: [], // re-, pre-, de-, be- using IY0 instead of IH0
  SPURIOUS_W: [], // -ual words: AH0+W instead of UW/UH
  EH_R_vs_AE_R: [], // EH+R where others have AE+R (harris vs hærɪs)
  AO_AA_SWAP: [], // cot-caught: AO vs AA
  EXTRA_PHONEME: [], // CMU has extra phoneme others don't
  MISSING_PHONEME: [], // CMU missing a phoneme present in all others
  OTHER: [], // Uncategorized — most interesting!
};

for (const d of unanimousDiffs) {
  const cmu = d.cmuNorm;
  const alt = aggressiveNormalize(d.evidence[0].prons[0]);

  // IY0 prefix: CMU has 'i' where others have ə (from ɪ normalization)
  if (/^ɹi/.test(cmu) && /^ɹə/.test(alt)) {
    patterns.IY0_PREFIX.push(d);
    continue;
  }
  if (/^pɹi/.test(cmu) && /^pɹə/.test(alt)) {
    patterns.IY0_PREFIX.push(d);
    continue;
  }
  if (/^di/.test(cmu) && /^də/.test(alt)) {
    patterns.IY0_PREFIX.push(d);
    continue;
  }
  if (/^bi/.test(cmu) && /^bə/.test(alt)) {
    patterns.IY0_PREFIX.push(d);
    continue;
  }
  if (/^ɛkst/.test(cmu) && /^əkst/.test(alt)) {
    patterns.IY0_PREFIX.push(d);
    continue;
  }

  // Spurious W: CMU has əwə where others have uə
  if (cmu.includes('əwə') && !alt.includes('əwə')) {
    patterns.SPURIOUS_W.push(d);
    continue;
  }

  // EH+R vs AE+R
  if (cmu.includes('ɛɹ') && alt.includes('æɹ') && cmu.replace(/ɛɹ/g, 'æɹ') === alt) {
    patterns.EH_R_vs_AE_R.push(d);
    continue;
  }

  // AO vs AA: ɔ in CMU vs ɑ in alt (or vice versa)
  if (cmu.replace(/ɔ/g, 'ɑ') === alt || alt.replace(/ɔ/g, 'ɑ') === cmu) {
    patterns.AO_AA_SWAP.push(d);
    continue;
  }

  // Length difference (extra/missing phoneme)
  if (cmu.length > alt.length + 2) {
    patterns.EXTRA_PHONEME.push(d);
    continue;
  }
  if (cmu.length < alt.length - 2) {
    patterns.MISSING_PHONEME.push(d);
    continue;
  }

  patterns.OTHER.push(d);
}

console.log('\n=== Pattern breakdown (unanimous disagreements) ===\n');
for (const [name, items] of Object.entries(patterns)) {
  console.log(`${name}: ${items.length}`);
}

// Sort OTHER (most interesting) by frequency
patterns.OTHER.sort((a, b) => b.freq - a.freq);

console.log(`\n=== OTHER category: potential real CMU errors (sorted by frequency) ===\n`);
const otherHighFreq = patterns.OTHER.filter((d) => d.freq >= 10);
console.log(`With frequency >= 10: ${otherHighFreq.length}\n`);

for (const d of otherHighFreq) {
  console.log(`${d.word} (freq=${d.freq}):`);
  console.log(`  CMU: /${d.cmuIPA}/`);
  for (const e of d.evidence) {
    console.log(
      `  ${e.source}: /${e.raw[0]}/${e.prons.length > 1 ? ` (+${e.prons.length - 1} variants)` : ''}`
    );
  }
  console.log();
}

// Show some examples of each named pattern for reference
console.log('\n=== Example words per pattern (top 5 by freq) ===\n');
for (const [name, items] of Object.entries(patterns)) {
  if (name === 'OTHER') continue;
  items.sort((a, b) => b.freq - a.freq);
  console.log(`${name} (${items.length} total):`);
  for (const d of items.slice(0, 5)) {
    console.log(`  ${d.word} (freq=${d.freq}): CMU=/${d.cmuIPA}/ vs /${d.evidence[0].raw[0]}/`);
  }
  console.log();
}

// Summary
console.log(`\n=== Summary ===`);
console.log(`Total CMU words: ${cmuDict.size}`);
console.log(`Checked against other sources: ${checkedCount}`);
console.log(
  `Agreed with at least 1 source: ${agreedCount} (${((agreedCount / checkedCount) * 100).toFixed(1)}%)`
);
console.log(`All sources disagree (raw): ${disagreements.length}`);
console.log(`After filtering benign notation: ${realDiffs.length}`);
console.log(`Multi-source disagreements: ${multiSourceDiffs.length}`);
console.log(`Unanimous external agreement against CMU: ${unanimousDiffs.length}`);
console.log(
  `  OTHER (potential real errors): ${patterns.OTHER.length} (${patterns.OTHER.filter((d) => d.freq >= 10).length} with freq >= 10)`
);
