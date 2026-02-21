#!/usr/bin/env npx vite-node
/**
 * Scan CMU dictionary for entries that violate common English spelling-to-pronunciation rules.
 * These violations may indicate genuine CMU errors (wrong phonemes) vs legitimate exceptions.
 *
 * Usage: cd packages/core && npx vite-node scripts/spelling-rules-scan.ts
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

function stripStress(p: string): string {
  return p.replace(/[0-2]$/, '');
}

function bare(phonemes: string[]): string[] {
  return phonemes.map(stripStress);
}

interface Match {
  word: string;
  phonemes: string[];
  frequency: number;
  detail: string;
}

// ============================================================================
// Pattern 1: "ph" -> F
// Words containing "ph" where the phonemes don't have F at the expected position
// Skip compound boundaries like "loophole"
// ============================================================================
const pattern1: Match[] = [];

for (const word of allWords) {
  if (alreadyFixed.has(word)) continue;
  const phonemes = cmudict[word];
  if (!Array.isArray(phonemes)) continue;
  const freq = getWordFrequency(word) ?? 0;
  if (freq < 5) continue;

  // Find all occurrences of "ph" in the word
  let idx = word.indexOf('ph');
  while (idx !== -1) {
    // Skip compound boundaries: check if "ph" spans two morphemes
    // Heuristic: skip if preceded by a common prefix-ending letter pattern
    // like "loophole" (loop+hole), "uphold" (up+hold), "shepherd" (shep+herd)
    const compoundPatterns = [
      'looph',
      'uph',
      'sheph',
      'hoph',
      'caph',
      'saph',
      'raph',
      'naph',
      'gaph',
    ];
    // More robust: skip if the letter before 'p' and the 'h' after form separate
    // morphemes. We'll be conservative and just check for F in the phonemes.
    const barePhonemes = bare(phonemes);
    const hasF = barePhonemes.includes('F');

    if (!hasF) {
      // Check if this "ph" is at a compound boundary by looking for common patterns
      // where p and h are in different syllables/morphemes
      const isCompound =
        // "loophole" = loop + hole
        (idx > 0 && word.slice(idx - 1, idx + 2) === 'oph' && word[idx + 2] === 'o') ||
        // "uphill", "uphold" = up + h...
        word.slice(0, idx + 1) === 'up' ||
        word.slice(0, idx + 1).endsWith('up') ||
        // "potholed", "pothook" = pot + h...
        word.slice(idx - 2, idx + 2) === 'oth' + word[idx + 2] ||
        // "shepherd" = shep + herd
        word.includes('herd') ||
        // "tophat", "tophand" = top + h
        (idx >= 2 && word.slice(idx - 1, idx + 1) === 'ph' && word.slice(idx + 1, idx + 2) === 'o');

      // Simple heuristic: skip words where p and h are likely in different morphemes
      // by checking if the word has a compound-ish structure
      const compoundish =
        word.includes('house') ||
        word.includes('hole') ||
        word.includes('head') ||
        word.includes('hill') ||
        word.includes('hood') ||
        word.includes('hold') ||
        word.includes('hook') ||
        word.includes('horn') ||
        word.includes('hand') ||
        word.includes('herd');

      if (!isCompound && !compoundish) {
        pattern1.push({
          word,
          phonemes,
          frequency: freq,
          detail: `"ph" at position ${idx} but no F phoneme — has [${barePhonemes.join(' ')}]`,
        });
      }
      break; // only report once per word
    }
    idx = word.indexOf('ph', idx + 1);
  }
}

// ============================================================================
// Pattern 2: "wr" -> R (silent w at word start)
// ============================================================================
const pattern2: Match[] = [];

for (const word of allWords) {
  if (alreadyFixed.has(word)) continue;
  if (!word.startsWith('wr')) continue;
  const phonemes = cmudict[word];
  if (!Array.isArray(phonemes)) continue;
  const freq = getWordFrequency(word) ?? 0;
  if (freq < 5) continue;

  const barePhonemes = bare(phonemes);
  // Should start with R (w is silent)
  if (barePhonemes[0] !== 'R') {
    pattern2.push({
      word,
      phonemes,
      frequency: freq,
      detail: `Starts with "wr" but first phoneme is ${barePhonemes[0]}, expected R`,
    });
  }
}

// ============================================================================
// Pattern 3: "kn" -> N (silent k at word start)
// ============================================================================
const pattern3: Match[] = [];

for (const word of allWords) {
  if (alreadyFixed.has(word)) continue;
  if (!word.startsWith('kn')) continue;
  const phonemes = cmudict[word];
  if (!Array.isArray(phonemes)) continue;
  const freq = getWordFrequency(word) ?? 0;
  if (freq < 5) continue;

  const barePhonemes = bare(phonemes);
  if (barePhonemes[0] !== 'N') {
    pattern3.push({
      word,
      phonemes,
      frequency: freq,
      detail: `Starts with "kn" but first phoneme is ${barePhonemes[0]}, expected N`,
    });
  }
}

// ============================================================================
// Pattern 4: "gn" -> N (silent g at word start)
// ============================================================================
const pattern4: Match[] = [];

for (const word of allWords) {
  if (alreadyFixed.has(word)) continue;
  if (!word.startsWith('gn')) continue;
  const phonemes = cmudict[word];
  if (!Array.isArray(phonemes)) continue;
  const freq = getWordFrequency(word) ?? 0;
  if (freq < 5) continue;

  const barePhonemes = bare(phonemes);
  if (barePhonemes[0] !== 'N') {
    pattern4.push({
      word,
      phonemes,
      frequency: freq,
      detail: `Starts with "gn" but first phoneme is ${barePhonemes[0]}, expected N`,
    });
  }
}

// ============================================================================
// Pattern 5: "-ight" -> AY T
// ============================================================================
const pattern5: Match[] = [];

for (const word of allWords) {
  if (alreadyFixed.has(word)) continue;
  if (!word.endsWith('ight')) continue;
  const phonemes = cmudict[word];
  if (!Array.isArray(phonemes)) continue;
  const freq = getWordFrequency(word) ?? 0;
  if (freq < 5) continue;

  const barePhonemes = bare(phonemes);
  const len = barePhonemes.length;
  // Should end with AY T
  if (len < 2 || barePhonemes[len - 2] !== 'AY' || barePhonemes[len - 1] !== 'T') {
    // Also allow ending with AY T S for "ights" words that slip through
    pattern5.push({
      word,
      phonemes,
      frequency: freq,
      detail: `Ends with "-ight" but phonemes end with [${barePhonemes.slice(-3).join(' ')}], expected AY T`,
    });
  }
}

// ============================================================================
// Pattern 6: "-ould" -> UH D (would, could, should patterns)
// ============================================================================
const pattern6: Match[] = [];

for (const word of allWords) {
  if (alreadyFixed.has(word)) continue;
  if (!word.includes('ould')) continue;
  const phonemes = cmudict[word];
  if (!Array.isArray(phonemes)) continue;
  const freq = getWordFrequency(word) ?? 0;
  if (freq < 5) continue;

  const barePhonemes = bare(phonemes);
  // "ould" should map to UH D (the 'l' is silent, the 'ou' = UH)
  // Check if the phonemes contain UH ... D for the "ould" portion
  const hasUH = barePhonemes.includes('UH');
  const hasD = barePhonemes.includes('D');

  // More precisely, look for UH D sequence
  let hasUHD = false;
  for (let i = 0; i < barePhonemes.length - 1; i++) {
    if (barePhonemes[i] === 'UH' && barePhonemes[i + 1] === 'D') {
      hasUHD = true;
      break;
    }
  }

  // Also check for L phoneme — the L in "ould" should be silent
  // If there's an L between UH and D, that's a violation
  if (hasUH) {
    for (let i = 0; i < barePhonemes.length - 2; i++) {
      if (barePhonemes[i] === 'UH' && barePhonemes[i + 1] === 'L' && barePhonemes[i + 2] === 'D') {
        pattern6.push({
          word,
          phonemes,
          frequency: freq,
          detail: `Has "ould" with UH L D — the L should be silent (expected UH D)`,
        });
        break;
      }
    }
  }

  if (!hasUHD && !pattern6.some((m) => m.word === word)) {
    pattern6.push({
      word,
      phonemes,
      frequency: freq,
      detail: `Has "ould" but no UH D sequence — has [${barePhonemes.join(' ')}]`,
    });
  }
}

// ============================================================================
// Pattern 7: "qu" -> K W
// ============================================================================
const pattern7: Match[] = [];

for (const word of allWords) {
  if (alreadyFixed.has(word)) continue;
  if (!word.includes('qu')) continue;
  const phonemes = cmudict[word];
  if (!Array.isArray(phonemes)) continue;
  const freq = getWordFrequency(word) ?? 0;
  if (freq < 5) continue;

  const barePhonemes = bare(phonemes);

  // "qu" typically maps to K W
  // Exceptions: "qu" at end of word (like "plaque" -> K), "queue", "unique" etc where "que" = K
  // Also "liquor" where "qu" = K (no W)
  const quIdx = word.indexOf('qu');

  // If "que" at end of word, it's just K (plaque, unique, technique, etc.)
  if (word.endsWith('que')) continue;
  // If "qu" is followed by nothing or a consonant in certain patterns, skip
  // Focus on "qu" followed by a vowel where K W is expected
  if (quIdx + 2 < word.length) {
    const afterQu = word[quIdx + 2];
    const isVowelAfter = 'aeiou'.includes(afterQu);

    if (isVowelAfter) {
      // Check for K W in phonemes
      let hasKW = false;
      for (let i = 0; i < barePhonemes.length - 1; i++) {
        if (barePhonemes[i] === 'K' && barePhonemes[i + 1] === 'W') {
          hasKW = true;
          break;
        }
      }

      if (!hasKW) {
        pattern7.push({
          word,
          phonemes,
          frequency: freq,
          detail: `"qu" at position ${quIdx} followed by vowel "${afterQu}" but no K W — has [${barePhonemes.join(' ')}]`,
        });
      }
    }
  }
}

// ============================================================================
// Pattern 8: "-ous" -> AH S
// ============================================================================
const pattern8: Match[] = [];

for (const word of allWords) {
  if (alreadyFixed.has(word)) continue;
  if (!word.endsWith('ous')) continue;
  const phonemes = cmudict[word];
  if (!Array.isArray(phonemes)) continue;
  const freq = getWordFrequency(word) ?? 0;
  if (freq < 5) continue;

  const barePhonemes = bare(phonemes);
  const len = barePhonemes.length;

  // Should end with AH S
  if (len < 2 || barePhonemes[len - 2] !== 'AH' || barePhonemes[len - 1] !== 'S') {
    pattern8.push({
      word,
      phonemes,
      frequency: freq,
      detail: `Ends with "-ous" but phonemes end with [${barePhonemes.slice(-3).join(' ')}], expected ... AH S`,
    });
  }
}

// ============================================================================
// Pattern 9: "-tion" -> SH AH N
// ============================================================================
const pattern9: Match[] = [];

for (const word of allWords) {
  if (alreadyFixed.has(word)) continue;
  // Match -tion but not -stion (question), -tion at very end
  if (!word.endsWith('tion')) continue;
  const phonemes = cmudict[word];
  if (!Array.isArray(phonemes)) continue;
  const freq = getWordFrequency(word) ?? 0;
  if (freq < 5) continue;

  const barePhonemes = bare(phonemes);
  const len = barePhonemes.length;

  // Should end with SH AH N
  // But some -tion words have CH AH N (which is a known CMU error)
  // Also some could end with SH IH N (reduced vowel variant — also acceptable)
  let hasSHAHN = false;
  let hasCHAHN = false;
  for (let i = 0; i < len - 2; i++) {
    if (barePhonemes[i] === 'SH' && barePhonemes[i + 1] === 'AH' && barePhonemes[i + 2] === 'N') {
      hasSHAHN = true;
    }
    if (barePhonemes[i] === 'CH' && barePhonemes[i + 1] === 'AH' && barePhonemes[i + 2] === 'N') {
      hasCHAHN = true;
    }
  }

  // Also accept T IY AH N (for words like "bastion" where -tion = T + IH AH N)
  // and T Y AH N patterns
  let hasTION = false;
  for (let i = 0; i < len - 2; i++) {
    if (barePhonemes[i] === 'T' && barePhonemes[i + 2] === 'N') {
      hasTION = true;
    }
  }

  if (!hasSHAHN) {
    // Skip words where -tion is pronounced differently legitimately
    // e.g., "bastion", "question" (which ends in -stion)
    if (word.endsWith('stion')) continue;

    const detail = hasCHAHN
      ? `Has CH AH N instead of SH AH N — likely CMU error`
      : `No SH AH N for "-tion" — has [${barePhonemes.slice(-4).join(' ')}]`;

    pattern9.push({
      word,
      phonemes,
      frequency: freq,
      detail,
    });
  }
}

// ============================================================================
// Pattern 10: "x" at start -> Z (xylophone)
// ============================================================================
const pattern10: Match[] = [];

for (const word of allWords) {
  if (alreadyFixed.has(word)) continue;
  if (!word.startsWith('x')) continue;
  const phonemes = cmudict[word];
  if (!Array.isArray(phonemes)) continue;
  const freq = getWordFrequency(word) ?? 0;
  if (freq < 5) continue;

  const barePhonemes = bare(phonemes);
  // Words starting with "x" should start with Z phoneme (xylophone, xenon, etc.)
  if (barePhonemes[0] !== 'Z') {
    pattern10.push({
      word,
      phonemes,
      frequency: freq,
      detail: `Starts with "x" but first phoneme is ${barePhonemes[0]}, expected Z`,
    });
  }
}

// ============================================================================
// Pattern 11: "wh" -> W or HH W
// ============================================================================
const pattern11: Match[] = [];

for (const word of allWords) {
  if (alreadyFixed.has(word)) continue;
  if (!word.startsWith('wh')) continue;
  const phonemes = cmudict[word];
  if (!Array.isArray(phonemes)) continue;
  const freq = getWordFrequency(word) ?? 0;
  if (freq < 5) continue;

  const barePhonemes = bare(phonemes);

  // "wh" words: most start with W or HH W
  // Exception: "who", "whom", "whose", "whole", "whore" etc start with HH (w is silent)
  const wSilentWords = [
    'who',
    'whom',
    'whose',
    'whole',
    'whoever',
    'wholesale',
    'wholesome',
    'wholly',
    'whore',
    'whoop',
    'whoopee',
    'whooping',
    'whoops',
    'whopper',
    'whop',
    'whopping',
  ];
  if (wSilentWords.some((w) => word.startsWith(w.slice(0, 3)) && word.includes('ho'))) {
    // For "who-" words, expect HH
    if (barePhonemes[0] !== 'HH') {
      pattern11.push({
        word,
        phonemes,
        frequency: freq,
        detail: `"wh" word (who-family) but first phoneme is ${barePhonemes[0]}, expected HH`,
      });
    }
    continue;
  }

  // For normal "wh" words, expect W or HH W
  const startsWithW = barePhonemes[0] === 'W';
  const startsWithHHW =
    barePhonemes[0] === 'HH' && barePhonemes.length > 1 && barePhonemes[1] === 'W';

  if (!startsWithW && !startsWithHHW) {
    pattern11.push({
      word,
      phonemes,
      frequency: freq,
      detail: `Starts with "wh" but phonemes start with ${barePhonemes.slice(0, 2).join(' ')}, expected W or HH W`,
    });
  }
}

// ============================================================================
// Pattern 12: Silent letters
// "mb" at end -> M (silent b)
// "mn" at end -> M (silent n)
// "bt" in specific words -> T (silent b, e.g., "debt", "doubt")
// ============================================================================
const pattern12: Match[] = [];

for (const word of allWords) {
  if (alreadyFixed.has(word)) continue;
  const phonemes = cmudict[word];
  if (!Array.isArray(phonemes)) continue;
  const freq = getWordFrequency(word) ?? 0;
  if (freq < 5) continue;

  const barePhonemes = bare(phonemes);
  const len = barePhonemes.length;

  // "mb" at end of word -> last phoneme should be M (b is silent)
  // Words: climb, bomb, lamb, thumb, comb, dumb, limb, numb, plumb, tomb, womb, crumb
  if (word.endsWith('mb')) {
    // The b is silent, so the last phoneme should be M
    if (barePhonemes[len - 1] === 'B') {
      pattern12.push({
        word,
        phonemes,
        frequency: freq,
        detail: `Ends with "mb" but last phoneme is B — the B should be silent (expected M at end)`,
      });
    } else if (barePhonemes[len - 1] !== 'M') {
      // Could also end with another phoneme if there's a suffix
      // Check if there's a B anywhere near the end
      if (barePhonemes.includes('B')) {
        const bIdx = barePhonemes.lastIndexOf('B');
        if (bIdx >= len - 2) {
          pattern12.push({
            word,
            phonemes,
            frequency: freq,
            detail: `Ends with "mb" but has B phoneme near end — B should be silent`,
          });
        }
      }
    }
  }

  // "mb" before a suffix: climb->climbing, bomb->bombed etc.
  // Check for "mb" followed by common suffixes
  const mbSuffixMatch = word.match(/mb(ed|er|ers|ing|ings|s)$/);
  if (mbSuffixMatch) {
    // There should be no B phoneme for the "mb" part
    // Check if B appears before the suffix phonemes
    if (barePhonemes.includes('B')) {
      const bIdx = barePhonemes.indexOf('B');
      // Check it's in the right position (near where "mb" would map)
      const mIdx = barePhonemes.indexOf('M');
      if (mIdx >= 0 && bIdx === mIdx + 1) {
        pattern12.push({
          word,
          phonemes,
          frequency: freq,
          detail: `Has "mb" before suffix but B phoneme at position ${bIdx} — B should be silent after M`,
        });
      }
    }
  }

  // "mn" at end of word -> n is silent (autumn, column, hymn, condemn, damn, solemn)
  if (word.endsWith('mn')) {
    if (barePhonemes[len - 1] === 'N') {
      pattern12.push({
        word,
        phonemes,
        frequency: freq,
        detail: `Ends with "mn" but last phoneme is N — the N should be silent (expected M at end)`,
      });
    }
  }

  // "bt" where b is silent: debt, doubt, subtle
  if (word.includes('bt')) {
    const btIdx = word.indexOf('bt');
    // Check if there's a B phoneme that shouldn't be there
    if (barePhonemes.includes('B')) {
      // Find the B and check if it's adjacent to a T
      for (let i = 0; i < len - 1; i++) {
        if (barePhonemes[i] === 'B' && barePhonemes[i + 1] === 'T') {
          pattern12.push({
            word,
            phonemes,
            frequency: freq,
            detail: `Has "bt" at position ${btIdx} with B T phonemes — B should be silent (expected just T)`,
          });
          break;
        }
      }
    }
  }
}

// ============================================================================
// Output
// ============================================================================

function printSection(title: string, patternNum: number, matches: Match[], topN = 30) {
  const sorted = matches.sort((a, b) => b.frequency - a.frequency);
  console.log(`\n${'='.repeat(90)}`);
  console.log(`PATTERN ${patternNum}: ${title}`);
  console.log('='.repeat(90));
  console.log(`Found: ${sorted.length} violations\n`);

  const shown = sorted.slice(0, topN);
  for (const m of shown) {
    const freqStr = `freq=${String(m.frequency).padEnd(8)}`;
    console.log(`  ${m.word.padEnd(30)} ${freqStr} [${m.phonemes.join(' ')}]`);
    console.log(`    ${m.detail}`);
  }
  if (sorted.length > topN) {
    console.log(`  ... and ${sorted.length - topN} more`);
  }
}

console.log('='.repeat(90));
console.log('SPELLING RULES vs CMU PRONUNCIATION SCAN');
console.log('='.repeat(90));
console.log(`Scanning ${allWords.length} words (filtered to frequency >= 5)...\n`);

printSection('"ph" should produce F', 1, pattern1);
printSection('"wr" at start should produce R (silent W)', 2, pattern2);
printSection('"kn" at start should produce N (silent K)', 3, pattern3);
printSection('"gn" at start should produce N (silent G)', 4, pattern4);
printSection('"-ight" should end with AY T', 5, pattern5);
printSection('"-ould" should produce UH D (silent L)', 6, pattern6);
printSection('"qu" should produce K W', 7, pattern7);
printSection('"-ous" should end with AH S', 8, pattern8);
printSection('"-tion" should produce SH AH N', 9, pattern9);
printSection('"x" at start should produce Z', 10, pattern10);
printSection('"wh" at start should produce W or HH W', 11, pattern11);
printSection('Silent letters: "mb" end, "mn" end, "bt"', 12, pattern12);

// Summary
console.log(`\n${'='.repeat(90)}`);
console.log('SUMMARY');
console.log('='.repeat(90));
const allPatterns = [
  { num: 1, name: '"ph" -> F', matches: pattern1 },
  { num: 2, name: '"wr" -> R', matches: pattern2 },
  { num: 3, name: '"kn" -> N', matches: pattern3 },
  { num: 4, name: '"gn" -> N', matches: pattern4 },
  { num: 5, name: '"-ight" -> AY T', matches: pattern5 },
  { num: 6, name: '"-ould" -> UH D', matches: pattern6 },
  { num: 7, name: '"qu" -> K W', matches: pattern7 },
  { num: 8, name: '"-ous" -> AH S', matches: pattern8 },
  { num: 9, name: '"-tion" -> SH AH N', matches: pattern9 },
  { num: 10, name: '"x" at start -> Z', matches: pattern10 },
  { num: 11, name: '"wh" -> W/HH W', matches: pattern11 },
  { num: 12, name: 'Silent letters', matches: pattern12 },
];

let total = 0;
for (const p of allPatterns) {
  console.log(
    `  Pattern ${String(p.num).padEnd(3)} ${p.name.padEnd(25)} ${p.matches.length} violations`
  );
  total += p.matches.length;
}
console.log(`  ${''.padEnd(4)} ${'TOTAL'.padEnd(25)} ${total} violations`);
