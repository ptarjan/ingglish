#!/usr/bin/env npx vite-node
/**
 * Debug tool for analyzing round-trip translation failures.
 *
 * Usage:
 *   npm run debug:roundtrip <word>
 *
 * Example:
 *   npm run debug:roundtrip exhumed
 */

import { loadDictionary, translateWord, lookupPronunciation } from '../src/translator.js';
import { inglishToPhonemes, reverseTranslateWord } from '../src/reverse-translator.js';

const C = {
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', cyan: '\x1b[36m', reset: '\x1b[0m',
  bold: '\x1b[1m', dim: '\x1b[2m',
};

const color = (t: string, c: keyof typeof C) => C[c] + t + C.reset;

async function main() {
  const word = process.argv[2];

  if (!word) {
    console.log('Usage: npm run debug:roundtrip <word>');
    console.log('Example: npm run debug:roundtrip exhumed');
    process.exit(1);
  }

  await loadDictionary();

  console.log(color('\n═══════════════════════════════════════════', 'dim'));
  console.log(color(`  Round-trip Debug: "${word}"`, 'bold'));
  console.log(color('═══════════════════════════════════════════\n', 'dim'));

  const phonemesRaw = lookupPronunciation(word);
  if (!phonemesRaw) {
    console.log(color('✗ Word not found in CMU dictionary', 'red'));
    return;
  }

  const expected = phonemesRaw.map(p => p.replace(/[0-9]/g, ''));
  console.log(color('1. CMU Dictionary Lookup', 'cyan'));
  console.log('   Raw: ' + color(phonemesRaw.join(' '), 'yellow'));
  console.log('   Phonemes: [' + expected.map(p => color(p, 'green')).join(', ') + ']');

  const ingglish = translateWord(word);
  console.log(color('\n2. English → Ingglish', 'cyan'));
  console.log('   "' + color(word, 'blue') + '" → "' + color(ingglish, 'green') + '"');

  const parsed = inglishToPhonemes(ingglish);
  console.log(color('\n3. Ingglish → Phonemes', 'cyan'));
  console.log('   "' + color(ingglish, 'green') + '" → [' + (parsed?.map(p => color(p, 'yellow')).join(', ') ?? 'null') + ']');

  console.log(color('\n4. Phoneme Comparison', 'cyan'));
  if (parsed) {
    const max = Math.max(expected.length, parsed.length);
    for (let i = 0; i < max; i++) {
      const exp = expected[i] ?? '(missing)';
      const par = parsed[i] ?? '(missing)';
      const ok = exp === par;
      console.log('   ' + color(ok ? '✓' : '✗', ok ? 'green' : 'red') + ' ' +
                  color(exp, ok ? 'green' : 'red').padEnd(20) + ' vs ' +
                  color(par, ok ? 'green' : 'red'));
    }
    if (expected.join(' ') !== parsed.join(' ')) {
      console.log(color('\n   ⚠ Phoneme mismatch! Check PHONEME_ALTERNATIVES', 'yellow'));
    }
  }

  const results = reverseTranslateWord(ingglish);
  console.log(color('\n5. Reverse Translation', 'cyan'));
  console.log('   Results: [' + results.slice(0, 5).map(r => color(r, 'blue')).join(', ') + ']');

  console.log(color('\n6. Round-trip Result', 'cyan'));
  const ok = results.includes(word);
  console.log('   ' + color(ok ? '✓ SUCCESS' : '✗ FAILURE', ok ? 'green' : 'red') +
              ' - "' + word + '" ' + (ok ? 'found' : 'NOT found') + ' in results\n');
}

main().catch(console.error);
