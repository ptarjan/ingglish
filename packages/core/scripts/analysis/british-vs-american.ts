#!/usr/bin/env -S npx vite-node --script
/**
 * Scan CMU dictionary for entries that use British English pronunciations
 * where American English would differ.
 *
 * Usage: cd packages/core && npx vite-node --script scripts/british-vs-american.ts
 */

import { loadDictionary, getDictionary } from '@ingglish/dictionary';
import { loadFrequencies, getWordFrequency } from '@ingglish/dictionary';
import { CUSTOM_PRONUNCIATIONS } from '@ingglish/dictionary';

export async function main() {
  await loadDictionary();
  await loadFrequencies();
  const cmudict = getDictionary();

  // All base words (skip variant entries like "WORD(2)")
  const allWords = Object.keys(cmudict).filter((w) => cmudict[w]?.length > 0 && !w.includes('('));

  function stripStress(p: string): string {
    return p.replace(/[0-2]$/, '');
  }

  // Words already fixed in CUSTOM_PRONUNCIATIONS
  const alreadyFixed = new Set(Object.keys(CUSTOM_PRONUNCIATIONS));

  interface Match {
    word: string;
    phonemes: string[];
    frequency: number;
    detail: string;
  }

  // ============================================================================
  // Pattern 1: -ize/-ise words with SH instead of Z
  // British /aɪz/ can be realized differently; check if CMU uses SH where Z expected
  // ============================================================================
  const pattern1: Match[] = [];

  for (const word of allWords) {
    if (alreadyFixed.has(word)) continue;
    const phonemes = cmudict[word];
    if (!Array.isArray(phonemes)) continue;
    const bare = phonemes.map(stripStress);
    const freq = getWordFrequency(word) ?? 0;
    if (freq < 5) continue;

    // Words ending in -ize, -ise, -ized, -ised, -izes, -ises, -izing, -ising
    if (!/(?:iz|is)(?:e|ed|es|ing)?$/i.test(word)) continue;

    // Check if the phonemes near the end contain SH where we'd expect Z
    // The -ize suffix should be AY1 Z in American English
    // British might use a SH sound in some contexts
    for (let i = 0; i < bare.length - 1; i++) {
      if (bare[i] === 'SH' && (bare[i + 1] === 'AY' || (i > 0 && bare[i - 1] === 'AY'))) {
        pattern1.push({
          word,
          phonemes,
          frequency: freq,
          detail: `Has SH near AY — expected Z for AmE -ize suffix`,
        });
        break;
      }
    }

    // Also check: -ize words where the Z phoneme is missing entirely
    // and replaced with something else
    if (word.endsWith('ize') || word.endsWith('ise')) {
      const lastFew = bare.slice(-3);
      // Expected ending: AY Z  or  AY Z (with possible trailing phoneme)
      const hasZ = bare.some((p) => p === 'Z');
      const hasSH = bare.some((p, idx) => p === 'SH' && idx >= bare.length - 4);
      if (!hasZ && hasSH) {
        // SH instead of Z in an -ize word
        const alreadyCounted = pattern1.some((m) => m.word === word);
        if (!alreadyCounted) {
          pattern1.push({
            word,
            phonemes,
            frequency: freq,
            detail: `No Z phoneme, has SH near end — expected AY Z for AmE`,
          });
        }
      }
    }
  }

  // ============================================================================
  // Pattern 2: Schedule with SH (British) vs SK (American)
  // ============================================================================
  const pattern2: Match[] = [];

  for (const word of allWords) {
    const phonemes = cmudict[word];
    if (!Array.isArray(phonemes)) continue;
    const bare = phonemes.map(stripStress);
    const freq = getWordFrequency(word) ?? 0;

    if (!word.includes('schedul')) continue;

    // British: SH EH JH UW L  or  SH EH D Y UW L
    // American: S K EH JH UW L
    // Also check for SH anywhere (could be a typo like "reschedulings")
    const hasSH = bare.includes('SH');
    const hasSK = (() => {
      for (let i = 0; i < bare.length - 1; i++) {
        if (bare[i] === 'S' && bare[i + 1] === 'K') return true;
      }
      return false;
    })();

    // Show all schedule words for analysis, marking British ones
    const isBritish = hasSH && !hasSK;
    const isFixed = alreadyFixed.has(word);
    pattern2.push({
      word,
      phonemes,
      frequency: freq,
      detail: isBritish
        ? `HAS SH (British) instead of S K (American)${isFixed ? ' [ALREADY FIXED in CUSTOM_PRONUNCIATIONS]' : ''}`
        : isFixed
          ? `Has S K (American) [ALREADY FIXED in CUSTOM_PRONUNCIATIONS]`
          : `Has S K (American) — correct`,
    });
  }

  // ============================================================================
  // Pattern 3: Y UW glide inconsistency — base form has no Y but derived form does
  // (or vice versa), revealing inconsistency within CMU itself
  // ============================================================================
  const pattern3: Match[] = [];

  const coronals = new Set(['T', 'D', 'N', 'S', 'Z', 'L']);

  // Build a map of word -> Y-glide status for quick lookup
  const yGlideWords = new Map<
    string,
    { hasYGlide: boolean; position: number; consonant: string }
  >();

  for (const word of allWords) {
    const phonemes = cmudict[word];
    if (!Array.isArray(phonemes)) continue;
    const bare = phonemes.map(stripStress);

    for (let i = 0; i < bare.length - 2; i++) {
      if (coronals.has(bare[i]) && bare[i + 1] === 'Y' && bare[i + 2] === 'UW') {
        yGlideWords.set(word, { hasYGlide: true, position: i, consonant: bare[i] });
        break;
      }
    }
    // Also track words with coronal + UW (no Y glide)
    for (let i = 0; i < bare.length - 1; i++) {
      if (coronals.has(bare[i]) && bare[i + 1] === 'UW' && !yGlideWords.has(word)) {
        yGlideWords.set(word, { hasYGlide: false, position: i, consonant: bare[i] });
        break;
      }
    }
  }

  // Now find pairs where base has no Y glide but derived does (or vice versa)
  const suffixes = ['s', 'es', 'ed', 'ing', 'er', 'ers', 'ly', 'tion', 'tions', 'ment', 'ments'];
  const checked = new Set<string>();

  for (const word of allWords) {
    if (alreadyFixed.has(word)) continue;
    const freq = getWordFrequency(word) ?? 0;
    if (freq < 5) continue;

    for (const suffix of suffixes) {
      if (!word.endsWith(suffix) || word.length <= suffix.length + 2) continue;
      const stem = word.slice(0, -suffix.length);
      const stemE = stem + 'e';

      for (const base of [stem, stemE]) {
        if (!cmudict[base] || !Array.isArray(cmudict[base])) continue;
        const pairKey = `${base}|${word}`;
        if (checked.has(pairKey)) continue;
        checked.add(pairKey);

        const baseInfo = yGlideWords.get(base);
        const derivedInfo = yGlideWords.get(word);

        if (!baseInfo || !derivedInfo) continue;
        if (baseInfo.hasYGlide !== derivedInfo.hasYGlide) {
          const baseFreq = getWordFrequency(base) ?? 0;
          const highFreq = Math.max(freq, baseFreq);
          if (highFreq < 5) continue;

          pattern3.push({
            word: `${base} / ${word}`,
            phonemes: cmudict[base],
            frequency: highFreq,
            detail: baseInfo.hasYGlide
              ? `Base "${base}" has ${baseInfo.consonant} Y UW but derived "${word}" has ${derivedInfo.consonant} UW (no Y)`
              : `Base "${base}" has ${baseInfo.consonant} UW (no Y) but derived "${word}" has ${derivedInfo.consonant} Y UW`,
          });
        }
      }
    }
  }

  // ============================================================================
  // Pattern 4: -ary/-ory/-ery with extra syllable (British pronunciation)
  // British: "secretary" = 5 syllables, American = 4
  // Look for words where the vowel count suggests the extra syllable
  // ============================================================================
  const pattern4: Match[] = [];

  const vowels = new Set([
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

  function countSyllables(phonemes: string[]): number {
    return phonemes.filter((p) => vowels.has(stripStress(p))).length;
  }

  for (const word of allWords) {
    if (alreadyFixed.has(word)) continue;
    const phonemes = cmudict[word];
    if (!Array.isArray(phonemes)) continue;
    const freq = getWordFrequency(word) ?? 0;
    if (freq < 5) continue;

    // Words ending in -ary, -ory, -ery, -arily, -orily
    if (!/(ary|ory|ery|arily|orily)$/i.test(word)) continue;

    const bare = phonemes.map(stripStress);
    const syllCount = countSyllables(phonemes);

    // In American English, -ary/-ory/-ery is typically one syllable: ER IY or just R IY
    // In British English, it's two syllables: AH R IY or ER IY with an extra vowel
    // Check the last few phonemes for the suffix
    // AmE: ... ER IY  (one syllable for -ary)
    // BrE: ... AH R IY  (two syllables for -ary)

    // Count expected syllables by a simple heuristic:
    // Remove the -ary/-ory/-ery suffix from spelling and count base syllables
    let basePart: string;
    if (word.endsWith('arily')) {
      basePart = word.slice(0, -5); // remove "arily"
    } else if (word.endsWith('orily')) {
      basePart = word.slice(0, -5);
    } else if (word.endsWith('ary')) {
      basePart = word.slice(0, -3);
    } else if (word.endsWith('ory')) {
      basePart = word.slice(0, -3);
    } else {
      basePart = word.slice(0, -3); // -ery
    }

    // Look for the suffix phonemes in the pronunciation
    // BrE -ary: EH R IY or AH R IY (2 syllables for suffix)
    // AmE -ary: ER IY (1 syllable for suffix)
    // Check if there's AH/EH before R IY at the end
    const last5 = bare.slice(-5);
    const last4 = bare.slice(-4);

    let isBritishSuffix = false;

    // Check for -ary/-ory/-ery with 2-syllable suffix: ... vowel R IY
    // where there's an extra vowel before R (BrE keeps this vowel, AmE reduces to ER IY)
    if (bare.length >= 3) {
      const endIdx = bare.length - 1;

      // Pattern: ... V R IY at end (where V is a separate vowel, not ER)
      if (
        bare[endIdx] === 'IY' &&
        bare[endIdx - 1] === 'R' &&
        vowels.has(bare[endIdx - 2]) &&
        bare[endIdx - 2] !== 'ER'
      ) {
        // This has vowel + R + IY ending — 2-syllable suffix (British style)
        // In AmE this would be ER IY (1-syllable suffix)
        // Accept any stress level on the prefix vowel (EH0, EH2, AH0, AO2, etc.)
        const prefixVowelBare = bare[endIdx - 2];
        if (prefixVowelBare === 'AH' || prefixVowelBare === 'IH' || prefixVowelBare === 'EH') {
          isBritishSuffix = true;
        }
        // Also catch AO R IY for -ory words (like "territory" = T EH1 R IH0 T AO2 R IY0)
        if (prefixVowelBare === 'AO' && word.endsWith('ory')) {
          isBritishSuffix = true;
        }
      }

      // Also check -arily/-orily: ... V R AH L IY
      if (
        bare.length >= 5 &&
        bare[endIdx] === 'IY' &&
        bare[endIdx - 1] === 'L' &&
        bare[endIdx - 2] === 'AH' &&
        bare[endIdx - 3] === 'R' &&
        vowels.has(bare[endIdx - 4]) &&
        bare[endIdx - 4] !== 'ER'
      ) {
        const prefixVowelBare = bare[endIdx - 4];
        if (
          prefixVowelBare === 'AH' ||
          prefixVowelBare === 'IH' ||
          prefixVowelBare === 'EH' ||
          prefixVowelBare === 'AO'
        ) {
          isBritishSuffix = true;
        }
      }
    }

    if (isBritishSuffix) {
      // Filter out short 2-syllable words where the vowel before R IY is the main
      // stressed vowel of the word (e.g., "very", "story", "scary", "theory").
      // These are NOT British-style extra syllables — they're just how English works.
      // Only flag words with 3+ syllables where -ary/-ory/-ery is a clear suffix.
      if (syllCount <= 2) continue;

      // Also filter out proper nouns and names (common in CMU): Gary, Mary, Rory, etc.
      // Heuristic: if freq > 100 and only 2-3 consonants before the suffix, likely a name
      // Better: just exclude known names
      const names = new Set([
        'mary',
        'gary',
        'rory',
        'cory',
        'dory',
        'tory',
        'gory',
        'clary',
        'leery',
        'leary',
        'beery',
        'cheery',
        'dreary',
        'weary',
        'deary',
        'nary',
        'wary',
        'vary',
        'scary',
      ]);
      if (names.has(word)) continue;

      pattern4.push({
        word,
        phonemes,
        frequency: freq,
        detail: `${syllCount} syllables — suffix has extra vowel (British style): ${phonemes.join(' ')}`,
      });
    }
  }

  // ============================================================================
  // Pattern 5: "been"/"either"/"neither" variants
  // Check common words for British defaults
  // ============================================================================
  const pattern5: Match[] = [];

  const britishChecks: {
    word: string;
    britishPhonemes: string[][];
    americanPhonemes: string[][];
    description: string;
  }[] = [
    {
      word: 'been',
      britishPhonemes: [['B', 'IY1', 'N']], // BrE: /biːn/
      americanPhonemes: [['B', 'IH1', 'N']], // AmE: /bɪn/
      description: 'AmE is B IH1 N, BrE is B IY1 N',
    },
    {
      word: 'either',
      britishPhonemes: [['AY1', 'DH', 'ER0']], // BrE: /aɪðə/
      americanPhonemes: [['IY1', 'DH', 'ER0']], // AmE: /iːðər/
      description: 'AmE is IY1 DH ER0, BrE is AY1 DH ER0',
    },
    {
      word: 'neither',
      britishPhonemes: [['N', 'AY1', 'DH', 'ER0']], // BrE: /naɪðə/
      americanPhonemes: [['N', 'IY1', 'DH', 'ER0']], // AmE: /niːðər/
      description: 'AmE is N IY1 DH ER0, BrE is N AY1 DH ER0',
    },
    {
      word: 'again',
      britishPhonemes: [['AH0', 'G', 'EY1', 'N']], // BrE: /əˈɡeɪn/
      americanPhonemes: [['AH0', 'G', 'EH1', 'N']], // AmE: /əˈɡɛn/
      description: 'AmE is AH0 G EH1 N, BrE is AH0 G EY1 N',
    },
    {
      word: 'leisure',
      britishPhonemes: [['L', 'EH1', 'ZH', 'ER0']], // BrE: /lɛʒə/
      americanPhonemes: [['L', 'IY1', 'ZH', 'ER0']], // AmE: /liːʒər/
      description: 'AmE is L IY1 ZH ER0, BrE is L EH1 ZH ER0',
    },
    {
      word: 'lieutenant',
      britishPhonemes: [['L', 'EH0', 'F', 'T', 'EH1', 'N', 'AH0', 'N', 'T']], // BrE: /lɛfˈtɛnənt/
      americanPhonemes: [['L', 'UW0', 'T', 'EH1', 'N', 'AH0', 'N', 'T']], // AmE: /luːˈtɛnənt/
      description: 'AmE is L UW0 T EH1 N AH0 N T, BrE has F (leftenant)',
    },
    {
      word: 'privacy',
      britishPhonemes: [['P', 'R', 'IH1', 'V', 'AH0', 'S', 'IY0']], // BrE: /prɪvəsi/
      americanPhonemes: [['P', 'R', 'AY1', 'V', 'AH0', 'S', 'IY0']], // AmE: /praɪvəsi/
      description: 'AmE is P R AY1 V AH0 S IY0, BrE is P R IH1 V AH0 S IY0',
    },
    {
      word: 'garage',
      britishPhonemes: [['G', 'AE1', 'R', 'IH0', 'JH']], // BrE: /ɡærɪdʒ/
      americanPhonemes: [['G', 'ER0', 'AA1', 'ZH']], // AmE: /ɡəˈrɑːʒ/
      description: 'AmE is G ER0 AA1 ZH, BrE is G AE1 R IH0 JH',
    },
    {
      word: 'advertisement',
      britishPhonemes: [['AE0', 'D', 'V', 'ER1', 'T', 'IH0', 'Z', 'M', 'AH0', 'N', 'T']], // BrE: stress on 2nd syllable
      americanPhonemes: [['AE2', 'D', 'V', 'ER0', 'T', 'AY1', 'Z', 'M', 'AH0', 'N', 'T']], // AmE: stress on 3rd
      description: 'AmE stresses -tise- (AY1), BrE stresses -ver- (ER1)',
    },
    {
      word: 'herb',
      britishPhonemes: [['HH', 'ER1', 'B']], // BrE: /hɜːb/ (h pronounced)
      americanPhonemes: [['ER1', 'B']], // AmE: /ɜːrb/ (h silent)
      description: 'AmE drops the H (ER1 B), BrE keeps H (HH ER1 B)',
    },
    {
      word: 'herbs',
      britishPhonemes: [['HH', 'ER1', 'B', 'Z']], // BrE: h pronounced
      americanPhonemes: [['ER1', 'B', 'Z']], // AmE: h silent
      description: 'AmE drops the H (ER1 B Z), BrE keeps H (HH ER1 B Z)',
    },
    {
      word: 'vitamin',
      britishPhonemes: [['V', 'IH1', 'T', 'AH0', 'M', 'IH0', 'N']], // BrE: /vɪtəmɪn/
      americanPhonemes: [['V', 'AY1', 'T', 'AH0', 'M', 'AH0', 'N']], // AmE: /vaɪtəmən/
      description: 'AmE is V AY1 T ..., BrE is V IH1 T ...',
    },
    {
      word: 'vitamins',
      britishPhonemes: [['V', 'IH1', 'T', 'AH0', 'M', 'IH0', 'N', 'Z']], // BrE
      americanPhonemes: [['V', 'AY1', 'T', 'AH0', 'M', 'AH0', 'N', 'Z']], // AmE
      description: 'AmE is V AY1 T ..., BrE is V IH1 T ...',
    },
    {
      word: 'tomato',
      britishPhonemes: [['T', 'AH0', 'M', 'AA1', 'T', 'OW0']], // BrE: /təmɑːtəʊ/
      americanPhonemes: [['T', 'AH0', 'M', 'EY1', 'T', 'OW0']], // AmE: /təmeɪtoʊ/
      description: 'AmE is T AH0 M EY1 T OW0, BrE is T AH0 M AA1 T OW0',
    },
    {
      word: 'vase',
      britishPhonemes: [['V', 'AA1', 'Z']], // BrE: /vɑːz/
      americanPhonemes: [['V', 'EY1', 'S']], // AmE: /veɪs/
      description: 'AmE is V EY1 S, BrE is V AA1 Z',
    },
    {
      word: 'z',
      britishPhonemes: [['Z', 'EH1', 'D']], // BrE: "zed"
      americanPhonemes: [['Z', 'IY1']], // AmE: "zee"
      description: 'AmE is Z IY1 (zee), BrE is Z EH1 D (zed)',
    },
  ];

  for (const check of britishChecks) {
    const phonemes = cmudict[check.word];
    if (!phonemes || !Array.isArray(phonemes)) continue;
    if (alreadyFixed.has(check.word)) continue;
    const freq = getWordFrequency(check.word) ?? 0;

    const phonemeStr = phonemes.join(' ');

    // Check if CMU matches any British pattern
    let isBritish = false;
    for (const britPat of check.britishPhonemes) {
      if (phonemeStr === britPat.join(' ')) {
        isBritish = true;
        break;
      }
    }

    // Check if CMU matches any American pattern
    let isAmerican = false;
    for (const amPat of check.americanPhonemes) {
      if (phonemeStr === amPat.join(' ')) {
        isAmerican = true;
        break;
      }
    }

    pattern5.push({
      word: check.word,
      phonemes,
      frequency: freq,
      detail: isBritish
        ? `BRITISH DEFAULT: ${check.description}`
        : isAmerican
          ? `American (correct): ${check.description}`
          : `Neither exact match — CMU has: ${phonemeStr}. ${check.description}`,
    });
  }

  // ============================================================================
  // Pattern 6: Latin/Greek -ile suffix
  // British: "hostile" = /hɒstaɪl/ (AY L), American = /hɑːstəl/ (AH L)
  // Check words ending in "-ile" for AY vs AH/IH/AH0
  // ============================================================================
  const pattern6: Match[] = [];

  for (const word of allWords) {
    if (alreadyFixed.has(word)) continue;
    const phonemes = cmudict[word];
    if (!Array.isArray(phonemes)) continue;
    const freq = getWordFrequency(word) ?? 0;
    if (freq < 5) continue;

    // Words ending in -ile, -ile's derivatives (-ility could be different)
    if (!word.endsWith('ile') && !word.endsWith('il')) continue;
    // Skip very short words
    if (word.length < 4) continue;
    // Skip words where -ile is part of a bigger suffix like -obile, -while, -smile, -file, -mile, -pile, -tile (as standalone)
    // Focus on Latin-derived -ile: hostile, missile, fertile, fragile, agile, etc.

    const bare = phonemes.map(stripStress);

    // Check if the last phonemes end with AY L (British) or AH L / IH L (American)
    if (bare.length < 2) continue;

    const lastTwo = bare.slice(-2);
    const lastThree = bare.slice(-3);

    // British pattern: AY L at the end
    if (lastTwo[0] === 'AY' && lastTwo[1] === 'L') {
      // This is the British pronunciation for -ile
      // AmE would typically have AH L or IH L for words like hostile, missile, fertile
      // But some words legitimately end in AY L in AmE too: while, smile, file, mile, pile, tile, bile, etc.
      // Filter those out — they're native English words, not Latin -ile suffix
      const nativeAYL = new Set([
        // Germanic / native English words where AY L is correct in AmE
        'while',
        'awhile',
        'smile',
        'file',
        'mile',
        'pile',
        'tile',
        'bile',
        'guile',
        'wile',
        'rile',
        'beguile',
        'crocodile',
        'compile',
        'defile',
        'exile',
        'profile',
        'reconcile',
        'revile',
        'senile',
        'vile',
        'worthwhile',
        'meanwhile',
        'lifestyle',
        'stockpile',
        'turnstile',
        'aisle',
        'isle',
        'refile',
        // -phile words (AY L is correct in both dialects)
        'anglophile',
        'pedophile',
        'bibliophile',
        'francophile',
        // Proper nouns / non-Latin words
        'nile',
        'heil',
        // -pile compounds
        'woodpile',
        // -while compounds
        'erstwhile',
        // Words where AY is part of the stem, not the -ile suffix
        'chamomile',
      ]);

      // Words where AY L is correct in AmE too
      if (nativeAYL.has(word)) continue;

      // For -ile Latin words, AmE typically uses AH L or IH L
      pattern6.push({
        word,
        phonemes,
        frequency: freq,
        detail: `Ends with AY L (British -ile) — AmE typically uses AH L or IH L`,
      });
    }
  }

  // ============================================================================
  // Output
  // ============================================================================

  function printSection(title: string, matches: Match[]) {
    const sorted = matches.sort((a, b) => b.frequency - a.frequency);
    console.log(`\n${'='.repeat(80)}`);
    console.log(title);
    console.log('='.repeat(80));
    console.log(`Found: ${sorted.length} matches\n`);

    for (const m of sorted) {
      const freqStr = `freq=${String(m.frequency).padEnd(8)}`;
      console.log(`  ${m.word.padEnd(30)} ${freqStr} ${m.phonemes.join(' ')}`);
      console.log(`    ${m.detail}`);
    }
  }

  console.log('='.repeat(80));
  console.log('BRITISH vs AMERICAN PRONUNCIATION SCAN');
  console.log('='.repeat(80));
  console.log(`Scanning ${allWords.length} words in CMU dictionary...\n`);

  printSection('PATTERN 1: -ize/-ise words with SH instead of Z', pattern1);

  printSection('PATTERN 2: "schedule" words with SH (British) instead of S K (American)', pattern2);

  printSection('PATTERN 3: Y UW glide inconsistency between base and derived forms', pattern3);

  printSection('PATTERN 4: -ary/-ory/-ery with extra syllable (British style)', pattern4);

  printSection('PATTERN 5: Common words — British vs American default check', pattern5);

  printSection(
    'PATTERN 6: Latin/Greek -ile suffix with AY L (British) vs AH L (American)',
    pattern6
  );

  // Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`  Pattern 1 (-ize/-ise with SH):         ${pattern1.length} matches`);
  console.log(`  Pattern 2 (schedule with SH):           ${pattern2.length} matches`);
  console.log(`  Pattern 3 (Y UW glide inconsistency):   ${pattern3.length} matches`);
  console.log(`  Pattern 4 (-ary/-ory/-ery extra syll):   ${pattern4.length} matches`);
  console.log(`  Pattern 5 (common word BrE defaults):   ${pattern5.length} matches`);
  console.log(`  Pattern 6 (-ile with AY L):             ${pattern6.length} matches`);
  console.log(
    `  Total:                                  ${pattern1.length + pattern2.length + pattern3.length + pattern4.length + pattern5.length + pattern6.length} matches`
  );
}

if (process.argv[1]?.includes('british-vs-american')) main().catch(console.error);
