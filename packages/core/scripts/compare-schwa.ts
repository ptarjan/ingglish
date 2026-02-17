#!/usr/bin/env npx vite-node
/**
 * Compare schwa mapping: AH0 -> 'u' (current) vs AH0 -> 'a' (proposed).
 *
 * Only AH0 (unstressed schwa) changes. AH1 and AH2 (stressed /ʌ/) stay as 'u'.
 *
 * Usage: npx vite-node packages/core/scripts/compare-schwa.ts
 */
import {
  loadDictionary,
  getDictionary,
  loadFrequencies,
  getWordFrequency,
} from '@ingglish/dictionary';
import { stripStress } from '@ingglish/phonemes';
import { ARPABET_TO_INGGLISH_MAP, R_COLORED_FORWARD } from '@ingglish/phonemes';

/** Pad/truncate string to fixed width (left-aligned). */
function pad(s: string, width: number): string {
  return s.length >= width ? s : s + ' '.repeat(width - s.length);
}

/**
 * Translate a phoneme array to Ingglish, but with AH0 mapped to a custom value.
 * This duplicates the logic of arpabetToIngglish() but intercepts AH0 specifically.
 */
function arpabetToIngglishWithSchwa(arpabet: string[], schwaMapping: string): string {
  let result = '';
  const len = arpabet.length;

  for (let i = 0; i < len; i++) {
    const phoneme = arpabet[i];
    const base = stripStress(phoneme);

    // R-colored vowel check (same as original)
    if (i + 1 < len) {
      const next = arpabet[i + 1];
      if (next === 'R') {
        const rPrefix = R_COLORED_FORWARD.get(base);
        if (rPrefix !== undefined) {
          result += rPrefix;
          continue;
        }
      }
    }

    // Intercept AH0 specifically
    if (phoneme === 'AH0') {
      result += schwaMapping;
      continue;
    }

    result += ARPABET_TO_INGGLISH_MAP[base] ?? phoneme.toLowerCase();
  }
  return result;
}

interface WordComparison {
  english: string;
  phonemes: string[];
  current: string; // AH0 -> 'u'
  proposed: string; // AH0 -> 'a'
  frequency: number;
}

async function main() {
  await Promise.all([loadDictionary(), loadFrequencies()]);
  const dict = getDictionary();

  // Filter to clean words only (no variants like "HELLO(2)", no apostrophes)
  const allWords = Object.keys(dict).filter(
    (w) => !w.includes('(') && !w.includes("'") && /^[a-z]+$/.test(w)
  );

  // Translate every word with both mappings
  const affected: WordComparison[] = [];
  const currentMap = new Map<string, string[]>(); // ingglish -> english words (current)
  const proposedMap = new Map<string, string[]>(); // ingglish -> english words (proposed)

  let totalWords = 0;
  let wordsWithAH0 = 0;

  for (const word of allWords) {
    totalWords++;
    const phonemes = dict[word];
    if (!phonemes) continue;

    const hasAH0 = phonemes.includes('AH0');

    // Current translation (AH0 -> 'u')
    const current = arpabetToIngglishWithSchwa(phonemes, 'u');
    // Proposed translation (AH0 -> 'a')
    const proposed = hasAH0 ? arpabetToIngglishWithSchwa(phonemes, 'a') : current;

    // Build collision maps for ALL words (not just affected ones)
    {
      const existing = currentMap.get(current);
      if (existing) existing.push(word);
      else currentMap.set(current, [word]);
    }
    {
      const existing = proposedMap.get(proposed);
      if (existing) existing.push(word);
      else proposedMap.set(proposed, [word]);
    }

    if (hasAH0) {
      wordsWithAH0++;
      const freq = getWordFrequency(word) ?? 0;
      affected.push({ english: word, phonemes, current, proposed, frequency: freq });
    }
  }

  // --- Analysis ---

  // Words identical to English
  let currentIdentical = 0;
  let proposedIdentical = 0;
  const lostIdentical: WordComparison[] = []; // currently identical, would stop being
  const gainedIdentical: WordComparison[] = []; // not currently identical, would become

  for (const item of affected) {
    const isCurrentlyIdentical = item.current === item.english;
    const wouldBeIdentical = item.proposed === item.english;

    if (isCurrentlyIdentical) currentIdentical++;
    if (wouldBeIdentical) proposedIdentical++;

    if (isCurrentlyIdentical && !wouldBeIdentical) {
      lostIdentical.push(item);
    } else if (!isCurrentlyIdentical && wouldBeIdentical) {
      gainedIdentical.push(item);
    }
  }

  // Also count identical words among ALL words (not just affected)
  let totalCurrentIdentical = 0;
  let totalProposedIdentical = 0;
  for (const word of allWords) {
    const phonemes = dict[word];
    if (!phonemes) continue;
    const hasAH0 = phonemes.includes('AH0');
    const current = arpabetToIngglishWithSchwa(phonemes, 'u');
    const proposed = hasAH0 ? arpabetToIngglishWithSchwa(phonemes, 'a') : current;
    if (current === word) totalCurrentIdentical++;
    if (proposed === word) totalProposedIdentical++;
  }

  // Collision analysis
  // A collision = 2+ different English words mapping to the same Ingglish spelling
  function countCollisions(map: Map<string, string[]>): {
    count: number;
    groups: [string, string[]][];
  } {
    let count = 0;
    const groups: [string, string[]][] = [];
    for (const [ingglish, sources] of map) {
      if (sources.length > 1) {
        count++;
        groups.push([ingglish, sources]);
      }
    }
    return { count, groups };
  }

  const currentCollisions = countCollisions(currentMap);
  const proposedCollisions = countCollisions(proposedMap);

  // Find new collisions (exist in proposed but not in current)
  const currentCollisionKeys = new Set(currentCollisions.groups.map(([k]) => k));
  const proposedCollisionKeys = new Set(proposedCollisions.groups.map(([k]) => k));

  const newCollisions: [string, string[]][] = [];
  const lostCollisions: [string, string[]][] = [];

  for (const [ingglish, sources] of proposedCollisions.groups) {
    if (!currentCollisionKeys.has(ingglish)) {
      newCollisions.push([ingglish, sources]);
    }
  }

  for (const [ingglish, sources] of currentCollisions.groups) {
    if (!proposedCollisionKeys.has(ingglish)) {
      lostCollisions.push([ingglish, sources]);
    }
  }

  // Sort by max frequency of involved words
  const sortByMaxFreq = (items: [string, string[]][]) =>
    items.sort((a, b) => {
      const freqA = Math.max(...a[1].map((w) => getWordFrequency(w) ?? 0));
      const freqB = Math.max(...b[1].map((w) => getWordFrequency(w) ?? 0));
      return freqB - freqA;
    });

  sortByMaxFreq(newCollisions);
  sortByMaxFreq(lostCollisions);

  // Words that improve (become more readable / closer to English) vs get worse
  const improved = gainedIdentical.sort((a, b) => b.frequency - a.frequency);
  const worsened = lostIdentical.sort((a, b) => b.frequency - a.frequency);

  // Also find words where translation changed but neither version is identical
  const changedNonIdentical = affected
    .filter(
      (item) =>
        item.current !== item.proposed &&
        item.current !== item.english &&
        item.proposed !== item.english
    )
    .sort((a, b) => b.frequency - a.frequency);

  // --- Output ---

  const pct = ((wordsWithAH0 / totalWords) * 100).toFixed(1);
  const netIdentical = totalProposedIdentical - totalCurrentIdentical;
  const netIdenticalStr = netIdentical >= 0 ? `+${netIdentical}` : `${netIdentical}`;
  const netCollisions = proposedCollisions.count - currentCollisions.count;
  const netCollisionsStr = netCollisions >= 0 ? `+${netCollisions}` : `${netCollisions}`;

  console.log(`# Schwa Mapping Comparison: AH0 -> 'u' (current) vs AH0 -> 'a' (proposed)\n`);

  console.log('## Summary\n');
  console.log(`- Total dictionary words: ${totalWords}`);
  console.log(`- Words containing AH0 (affected): ${wordsWithAH0} (${pct}%)`);
  console.log('');

  console.log('## Identical Words (Ingglish === English)\n');
  console.log(`- Total identical (current AH0->u): ${totalCurrentIdentical}`);
  console.log(`- Total identical (proposed AH0->a): ${totalProposedIdentical}`);
  console.log(`- Net change: ${netIdenticalStr}`);
  console.log('- Among AH0 words:');
  console.log(`  - Currently identical: ${currentIdentical}`);
  console.log(`  - Would become identical: ${proposedIdentical}`);
  console.log(`  - Would LOSE identity (was identical, no longer): ${lostIdentical.length}`);
  console.log(`  - Would GAIN identity (wasn't identical, now is): ${gainedIdentical.length}`);
  console.log('');

  console.log('## Collisions (2+ English words -> same Ingglish)\n');
  console.log(`- Current collision groups: ${currentCollisions.count}`);
  console.log(`- Proposed collision groups: ${proposedCollisions.count}`);
  console.log(`- Net change: ${netCollisionsStr}`);
  console.log(`- New collisions introduced: ${newCollisions.length}`);
  console.log(`- Collisions resolved: ${lostCollisions.length}`);
  console.log('');

  console.log('## Top 20 Words That IMPROVE (gain identity with English)\n');
  console.log('These words would become identical to their English spelling:\n');
  for (const item of improved.slice(0, 20)) {
    const freqStr = item.frequency > 0 ? `  (freq: ${item.frequency})` : '';
    console.log(
      `  ${pad(item.english, 20)}  current: ${pad(item.current, 20)}  proposed: ${pad(item.proposed, 20)}${freqStr}`
    );
  }
  console.log('');

  console.log('## Top 20 Words That GET WORSE (lose identity with English)\n');
  console.log('These words would stop being identical to their English spelling:\n');
  for (const item of worsened.slice(0, 20)) {
    const freqStr = item.frequency > 0 ? `  (freq: ${item.frequency})` : '';
    console.log(
      `  ${pad(item.english, 20)}  current: ${pad(item.current, 20)}  proposed: ${pad(item.proposed, 20)}${freqStr}`
    );
  }
  console.log('');

  console.log('## Top 20 Changed Words (neither version identical to English)\n');
  console.log('High-frequency words where the spelling changes but neither matches English:\n');
  for (const item of changedNonIdentical.slice(0, 20)) {
    const freqStr = item.frequency > 0 ? `  (freq: ${item.frequency})` : '';
    console.log(
      `  ${pad(item.english, 20)}  current: ${pad(item.current, 20)}  proposed: ${pad(item.proposed, 20)}${freqStr}`
    );
  }
  console.log('');

  console.log('## Top 20 New Collisions Introduced\n');
  console.log('Different English words that would get the same Ingglish spelling:\n');
  for (const [ingglish, sources] of newCollisions.slice(0, 20)) {
    const freqs = sources.map((w) => {
      const f = getWordFrequency(w);
      return f ? `${w}(${f})` : w;
    });
    console.log(`  ${pad(ingglish, 20)}  <- ${freqs.join(', ')}`);
  }
  console.log('');

  console.log('## Top 20 Collisions Resolved\n');
  console.log('Words that currently collide but would stop colliding:\n');
  for (const [ingglish, sources] of lostCollisions.slice(0, 20)) {
    const freqs = sources.map((w) => {
      const f = getWordFrequency(w);
      return f ? `${w}(${f})` : w;
    });
    console.log(`  ${pad(ingglish, 20)}  <- ${freqs.join(', ')}`);
  }
  if (lostCollisions.length > 20) {
    console.log(`  ... and ${lostCollisions.length - 20} more`);
  }
  console.log('');

  // Show some example AH0 words for context
  console.log('## Sample High-Frequency AH0 Words (top 30)\n');
  const topAffected = [...affected].sort((a, b) => b.frequency - a.frequency).slice(0, 30);
  console.log(
    `  ${pad('English', 20)}  ${pad('AH phonemes', 15)}  ${pad('Current (u)', 20)}  ${pad('Proposed (a)', 20)}  Freq`
  );
  console.log('  ' + '-'.repeat(95));
  for (const item of topAffected) {
    const ahPhonemes = item.phonemes
      .filter((p) => p === 'AH0' || p === 'AH1' || p === 'AH2')
      .join(',');
    console.log(
      `  ${pad(item.english, 20)}  ${pad(ahPhonemes, 15)}  ${pad(item.current, 20)}  ${pad(item.proposed, 20)}  ${item.frequency}`
    );
  }
}

main().catch(console.error);
