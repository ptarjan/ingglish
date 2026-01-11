/**
 * Performance profiling script for Ingglish core library.
 * Measures time spent in different parts of the translation pipeline.
 */

import { performance } from 'perf_hooks';

// Profile helper
function profile<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`${name}: ${(end - start).toFixed(2)}ms`);
  return result;
}

async function profileAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  console.log(`${name}: ${(end - start).toFixed(2)}ms`);
  return result;
}

async function main() {
  console.log('=== Ingglish Performance Profile ===\n');

  // 1. Dictionary loading
  console.log('--- Dictionary Loading ---');
  const { loadDictionary, getDictionaryStats } = await import('../src/translator');

  await profileAsync('loadDictionary (first call)', async () => {
    await loadDictionary();
  });

  await profileAsync('loadDictionary (cached)', async () => {
    await loadDictionary();
  });

  const stats = getDictionaryStats();
  console.log(`Dictionary size: ${stats.wordCount} words\n`);

  // 2. Word translation
  console.log('--- Word Translation ---');
  const { translateWord, translateText } = await import('../src/translator');

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
  const { reverseTranslateText, reverseTranslateWord } = await import('../src/reverse-translator');

  profile('reverseTranslateWord("huloh") - first call (builds cache)', () => {
    reverseTranslateWord('huloh');
  });

  profile('reverseTranslateWord("huloh") - cached', () => {
    reverseTranslateWord('huloh');
  });

  profile('reverseTranslateWord("werld")', () => {
    reverseTranslateWord('werld');
  });

  const inglishText = 'Dhu kwik brown foks jumps over dhu layzee dawg.';
  profile(`reverseTranslateText (${inglishText.length} chars)`, () => {
    reverseTranslateText(inglishText);
  });

  console.log('');

  // 5. Word frequency sorting
  console.log('--- Word Frequency ---');
  const { sortByFrequency, getWordFrequency } = await import('../src/word-frequency');

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

  // 6. Phonemize (if available)
  console.log('--- Phonemize Fallback ---');
  const { preloadPhonemize, translateWithPhonemize, translateWithRules } =
    await import('../src/unknown-words');

  await profileAsync('preloadPhonemize', async () => {
    await preloadPhonemize();
  });

  profile('translateWithRules("kubernetes")', () => translateWithRules('kubernetes'));
  profile('translateWithPhonemize("kubernetes")', () => translateWithPhonemize('kubernetes'));

  console.log('');

  // 7. Memory usage
  console.log('--- Memory Usage ---');
  const used = process.memoryUsage();
  console.log(`Heap used: ${Math.round(used.heapUsed / 1024 / 1024)}MB`);
  console.log(`Heap total: ${Math.round(used.heapTotal / 1024 / 1024)}MB`);
  console.log(`RSS: ${Math.round(used.rss / 1024 / 1024)}MB`);

  console.log('\n=== Profile Complete ===');
}

main().catch(console.error);
