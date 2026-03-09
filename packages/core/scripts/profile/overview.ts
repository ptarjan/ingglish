#!/usr/bin/env npx vite-node
/**
 * Performance profiling script for Ingglish core library.
 * Measures time spent in different parts of the translation pipeline.
 */

import { profile, profileAsync } from './harness';

export async function main() {
  console.log('=== Ingglish Performance Profile ===\n');

  // 1. Dictionary loading
  console.log('--- Dictionary Loading ---');
  const { loadDictionary, getDictionary } = await import('@ingglish/dictionary');
  const { loadLangDict } = await import('ingglish');

  await profileAsync('loadDictionary (first call)', async () => {
    await loadDictionary();
    await loadLangDict('en');
  });

  await profileAsync('loadDictionary (cached)', async () => {
    await loadDictionary();
  });

  const dict = getDictionary();
  console.log(`Dictionary size: ${Object.keys(dict).length} words\n`);

  // 2. Word translation
  console.log('--- Word Translation ---');
  const { translateWord } = await import('../../src/translate/forward');
  const { translateSync: translateText } = await import('../../src/translate/forward');

  // Single word
  profile('translateWord("hello") x1', () => translateWord('hello'));

  // Many words (measure per-word cost)
  const words = ['hello', 'world', 'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog'];
  const iterations = 1000;

  profile(`translateWord x${iterations * words.length} words`, () => {
    for (let i = 0; i < iterations; i++) {
      for (const word of words) {
        translateWord(word);
      }
    }
  });

  // Unknown word (fallback path)
  profile('translateWord("kubernetes") - unknown word', () => translateWord('kubernetes'));

  console.log('');

  // 3. Text translation
  console.log('--- Text Translation ---');
  const shortText = 'Hello world';
  const mediumText =
    'The quick brown fox jumps over the lazy dog. This sentence contains every letter of the English alphabet.';
  const longText = mediumText.repeat(100);

  profile(`translateText (${shortText.length} chars)`, () => translateText(shortText));
  profile(`translateText (${mediumText.length} chars)`, () => translateText(mediumText));
  profile(`translateText (${longText.length} chars)`, () => translateText(longText));

  console.log('');

  // 4. Reverse translation
  console.log('--- Reverse Translation ---');
  const { loadReverseDictionary } = await import('@ingglish/dictionary');
  const { reverseTranslateWord, reverseTranslateSync: reverseTranslateText } =
    await import('../../src/translate/reverse');

  await profileAsync('loadReverseDictionary', async () => {
    await loadReverseDictionary();
  });

  profile('reverseTranslateWord("haloh") - first call (builds cache)', () => {
    reverseTranslateWord('haloh');
  });

  profile('reverseTranslateWord("haloh") - cached', () => {
    reverseTranslateWord('haloh');
  });

  profile('reverseTranslateWord("werld")', () => {
    reverseTranslateWord('werld');
  });

  const inglishText = 'Dha kwik brown foks jumps over dha layzee dawg.';
  profile(`reverseTranslateText (${inglishText.length} chars)`, () => {
    reverseTranslateText(inglishText);
  });

  console.log('');

  // 5. Word frequency sorting
  console.log('--- Word Frequency ---');
  const { sortByFrequency, getWordFrequency } = await import('@ingglish/dictionary');

  profile('getWordFrequency("the")', () => getWordFrequency('the'));
  profile('getWordFrequency("xyzabc") - unknown', () => getWordFrequency('xyzabc'));

  const testWords = [
    'hello',
    'world',
    'the',
    'a',
    'is',
    'hello',
    'test',
    'word',
    'frequency',
    'check',
  ];
  profile(`sortByFrequency (${testWords.length} words)`, () => sortByFrequency(testWords));

  const manyWords = Array.from({ length: 1000 }, (_, i) => `word${i}`);
  profile(`sortByFrequency (${manyWords.length} words)`, () => sortByFrequency(manyWords));

  console.log('');

  // 6. Memory usage
  console.log('--- Memory Usage ---');
  const used = process.memoryUsage();
  console.log(`Heap used: ${Math.round(used.heapUsed / 1024 / 1024)}MB`);
  console.log(`Heap total: ${Math.round(used.heapTotal / 1024 / 1024)}MB`);
  console.log(`RSS: ${Math.round(used.rss / 1024 / 1024)}MB`);

  console.log('\n=== Profile Complete ===');
}

if (process.argv[1]?.includes('overview')) main().catch(console.error);
