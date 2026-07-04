#!/usr/bin/env -S npx vite-node --script
/**
 * Debug tool for analyzing round-trip translation failures.
 *
 * Usage:
 *   npm run debug:roundtrip <word-or-text>
 *
 * Examples:
 *   npm run debug:roundtrip exhumed           # Single word - detailed phoneme analysis
 *   npm run debug:roundtrip "hello world"     # Multiple words - finds failures
 */

import { loadDictionary, loadReverseDictionary, lookupPronunciation } from '@ingglish/dictionary';
import { ingglishToArpabet } from '@ingglish/phonemes';
import { translateWord, translateSync as translateText } from '../../src/translate/forward.js';
import {
  reverseTranslateWord,
  reverseTranslateSync as reverseTranslateText,
} from '../../src/translate/reverse.js';

const C = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

const color = (t: string, c: keyof typeof C) => C[c] + t + C.reset;

async function debugSingleWord(word: string) {
  console.log(color('\n═══════════════════════════════════════════', 'dim'));
  console.log(color(`  Round-trip Debug: "${word}"`, 'bold'));
  console.log(color('═══════════════════════════════════════════\n', 'dim'));

  const phonemesRaw = lookupPronunciation(word);
  if (!phonemesRaw) {
    console.log(color('✗ Word not found in CMU dictionary', 'red'));
    return;
  }

  const expected = phonemesRaw.map((p) => p.replace(/[0-9]/g, ''));
  console.log(color('1. CMU Dictionary Lookup', 'cyan'));
  console.log('   Raw: ' + color(phonemesRaw.join(' '), 'yellow'));
  console.log('   Phonemes: [' + expected.map((p) => color(p, 'green')).join(', ') + ']');

  const ingglish = translateWord(word);
  console.log(color('\n2. English → Ingglish', 'cyan'));
  console.log('   "' + color(word, 'blue') + '" → "' + color(ingglish, 'green') + '"');

  const parsed = ingglishToArpabet(ingglish);
  console.log(color('\n3. Ingglish → Phonemes', 'cyan'));
  console.log(
    '   "' +
      color(ingglish, 'green') +
      '" → [' +
      (parsed?.map((p) => color(p, 'yellow')).join(', ') ?? 'null') +
      ']'
  );

  console.log(color('\n4. Phoneme Comparison', 'cyan'));
  if (parsed) {
    const max = Math.max(expected.length, parsed.length);
    for (let i = 0; i < max; i++) {
      const exp = expected[i] ?? '(missing)';
      const par = parsed[i] ?? '(missing)';
      const ok = exp === par;
      console.log(
        '   ' +
          color(ok ? '✓' : '✗', ok ? 'green' : 'red') +
          ' ' +
          color(exp, ok ? 'green' : 'red').padEnd(20) +
          ' vs ' +
          color(par, ok ? 'green' : 'red')
      );
    }
    if (expected.join(' ') !== parsed.join(' ')) {
      console.log(color('\n   ⚠ Phoneme mismatch! Check PHONEME_ALTERNATIVES', 'yellow'));
    }
  }

  const results = reverseTranslateWord(ingglish);
  console.log(color('\n5. Reverse Translation', 'cyan'));
  console.log(
    '   Results: [' +
      results
        .slice(0, 5)
        .map((r) => color(r, 'blue'))
        .join(', ') +
      ']'
  );

  console.log(color('\n6. Round-trip Result', 'cyan'));
  const ok = results.includes(word);
  console.log(
    '   ' +
      color(ok ? '✓ SUCCESS' : '✗ FAILURE', ok ? 'green' : 'red') +
      ' - "' +
      word +
      '" ' +
      (ok ? 'found' : 'NOT found') +
      ' in results\n'
  );
}

async function debugText(text: string) {
  console.log(color('\n═══════════════════════════════════════════', 'dim'));
  console.log(color('  Round-trip Debug (Text Mode)', 'bold'));
  console.log(color('═══════════════════════════════════════════\n', 'dim'));

  // Extract words
  const words = text.match(/[a-zA-Z]+/g) || [];
  const uniqueWords = [...new Set(words.map((w) => w.toLowerCase()))];

  console.log(color('Input:', 'cyan'));
  console.log('   ' + text.slice(0, 100) + (text.length > 100 ? '...' : ''));
  console.log(`   (${uniqueWords.length} unique words)\n`);

  // Full text round-trip
  const ingglish = translateText(text);
  const back = reverseTranslateText(ingglish);

  console.log(color('Full Text Round-trip:', 'cyan'));
  console.log('   English:  ' + text.slice(0, 60) + (text.length > 60 ? '...' : ''));
  console.log('   Ingglish: ' + ingglish.slice(0, 60) + (ingglish.length > 60 ? '...' : ''));
  console.log('   Back:     ' + back.slice(0, 60) + (back.length > 60 ? '...' : ''));

  // Find failures
  const failures: { word: string; ingglish: string; back: string }[] = [];

  for (const word of uniqueWords) {
    const ing = translateWord(word);
    const results = reverseTranslateWord(ing);
    if (!results.includes(word)) {
      failures.push({ word, ingglish: ing, back: results[0] || '?' });
    }
  }

  console.log(color('\nWord-by-word Analysis:', 'cyan'));
  if (failures.length === 0) {
    console.log('   ' + color('✓ All words round-trip successfully!', 'green'));
  } else {
    console.log('   ' + color(`✗ ${failures.length} word(s) failed:`, 'red'));
    for (const f of failures.slice(0, 10)) {
      console.log(`     ${color(f.word, 'red')} → ${f.ingglish} → ${f.back}`);
    }
    if (failures.length > 10) {
      console.log(`     ... and ${failures.length - 10} more`);
    }
    console.log(color('\n   Run with a single failing word for detailed analysis:', 'dim'));
    console.log(`   npm run debug:roundtrip ${failures[0].word}\n`);
  }
}

export async function main() {
  const startTime = performance.now();
  const input = process.argv.slice(2).join(' ');

  if (!input) {
    console.log('Usage: npm run debug:roundtrip <word-or-text>');
    console.log('');
    console.log('Examples:');
    console.log('  npm run debug:roundtrip exhumed           # Single word');
    console.log('  npm run debug:roundtrip "hello world"     # Multiple words');
    process.exit(1);
  }

  const dictStart = performance.now();
  await loadDictionary();
  await loadReverseDictionary();
  const dictTime = performance.now() - dictStart;

  // Single word vs text
  const isSingleWord = /^[a-zA-Z]+$/.test(input);

  if (isSingleWord) {
    await debugSingleWord(input.toLowerCase());
  } else {
    await debugText(input);
  }

  const totalTime = performance.now() - startTime;
  console.log(
    color(`[Timing: dict=${dictTime.toFixed(0)}ms, total=${totalTime.toFixed(0)}ms]`, 'dim')
  );
}

if (process.argv[1]?.includes('debug-roundtrip')) main().catch(console.error);
